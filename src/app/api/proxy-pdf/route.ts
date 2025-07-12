import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const oid = searchParams.get("oid");

  if (!type || !oid) {
    return new NextResponse("Missing type or oid", { status: 400 });
  }

  const [yyyy, mm, dd] = oid.split("-");
  const dateFolder = `${dd}-${mm}-${yyyy}`;
  const folder = `invoices/${dateFolder}/${oid}`;

  let public_id = `${folder}/${type}`;
  let result;
  try {
    result = await cloudinary.api.resource(public_id, {
      resource_type: "raw",
      format: "pdf",
    });
  } catch (err1) {
    try {
      public_id = `${folder}/${type}.pdf`;
      result = await cloudinary.api.resource(public_id, {
        resource_type: "raw",
        format: "pdf",
      });
    } catch (err2) {
      console.error("Cloudinary PDF fetch failed for both public_id variants:", err1, err2);
      return new NextResponse("PDF not found or error fetching from Cloudinary", { status: 404 });
    }
  }

  try {
    // Generate a signed private download URL
    const downloadUrl = cloudinary.utils.private_download_url(
      public_id,
      "pdf",
      {
        resource_type: "raw",
        type: "upload",
        expires_at: Math.floor(Date.now() / 1000) + 60, // 1 minute expiry
      }
    );

    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) throw new Error("Failed to fetch PDF from Cloudinary (private URL)");
    const arrayBuffer = await fileRes.arrayBuffer();

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=\"${type}.pdf\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Error downloading PDF from Cloudinary private URL:", err);
    return new NextResponse("PDF not found or error fetching from Cloudinary", { status: 404 });
  }
} 