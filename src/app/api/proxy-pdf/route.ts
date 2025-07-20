import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { generatePdf } from '@/lib/pdf';
import clientPromise from "@/lib/mongodb";
import { getCustomerInvoiceHtml } from "@/templates/invoices/customerInvoiceHtml";
import { getTailorInvoiceHtml } from "@/templates/invoices/tailorInvoiceHtml";

// Import the HTML generation functions from the orders route
// We'll need to copy these functions here since they're not exported
function formatDate(dateStr: string | Date) {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(val: any) {
  const num = typeof val === 'number' ? val : parseFloat(val || '0');
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const oid = searchParams.get("oid");

  if (!type || !oid) {
    return new NextResponse("Missing type or oid", { status: 400 });
  }

  // First, try to fetch the PDF from Cloudinary
  const yyyy = oid.substring(0, 4);
  const mm = oid.substring(4, 6);
  const dd = oid.substring(6, 8);
  const dateFolder = `${dd}-${mm}-${yyyy}`;
  const folder = `invoices/${dateFolder}/${oid}`;

  let public_id = `${folder}/${type}`;
  let result;
  let pdfExists = false;
  
  try {
    result = await cloudinary.api.resource(public_id, {
      resource_type: "raw",
      format: "pdf",
    });
    pdfExists = true;
  } catch (err1) {
    try {
      public_id = `${folder}/${type}.pdf`;
      result = await cloudinary.api.resource(public_id, {
        resource_type: "raw",
        format: "pdf",
      });
      pdfExists = true;
    } catch (err2) {
      console.log("PDF not found in Cloudinary, attempting to generate on-demand");
      pdfExists = false;
    }
  }

  // If PDF exists in Cloudinary, serve it
  if (pdfExists) {
    try {
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
      // Fall through to on-demand generation
    }
  }

  // If PDF doesn't exist or failed to download, generate it on-demand
  console.log(`Attempting to generate PDF on-demand for order: ${oid}`);
  
  try {
    // Fetch order from MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "fashionapp");
    const order = await db.collection("orders").findOne({ oid });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Generate HTML based on type
    let html;
    switch (type) {
      case 'customer':
        html = getCustomerInvoiceHtml(order);
        break;
      case 'tailor':
        html = getTailorInvoiceHtml(order);
        break;
      default:
        return new NextResponse("Invalid PDF type", { status: 400 });
    }

    // Generate PDF
    const pdfBuffer = await generatePdf(html);
    
    if (!pdfBuffer) {
      return new NextResponse("Failed to generate PDF", { status: 500 });
    }
    
    // Upload to Cloudinary for future use
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'raw', public_id: type, folder, format: 'pdf' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(pdfBuffer);
      });
      console.log(`PDF uploaded to Cloudinary: ${uploadResult.secure_url}`);
    } catch (uploadError) {
      console.error("Failed to upload PDF to Cloudinary:", uploadError);
      // Continue to serve the PDF even if upload fails
    }

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=\"${type}.pdf\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Failed to generate PDF on-demand:", err);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}