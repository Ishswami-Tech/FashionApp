import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { generatePdf } from '@/lib/pdf';
import clientPromise from "@/lib/mongodb";
import { getCustomerInvoiceHtml } from "@/templates/invoices/customerInvoiceHtml";
import { getTailorInvoiceHtml } from "@/templates/invoices/tailorInvoiceHtml";

// Configure Cloudinary explicitly for this API
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

// Compulsory and robust PDF generation endpoint
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const oid = searchParams.get("oid");

  if (!type || !oid) {
    return new NextResponse("Missing type or oid", { status: 400 });
  }

  console.log(`[Proxy PDF] Generating ${type} PDF for order: ${oid}`);

  try {
    // Get order data from request body
    const body = await req.json();
    const order = body.order;

    if (!order) {
      return new NextResponse("Order data not provided", { status: 400 });
    }

    // Validate essential order data
    if (!order.oid || !order.fullName || !order.contactNumber) {
      return new NextResponse("Invalid order data: missing essential fields", { status: 400 });
    }

    console.log(`[Proxy PDF] Order data validated, generating HTML...`);

    // Generate HTML based on type (compulsory)
    let html;
    try {
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

      if (!html || html.trim().length === 0) {
        console.error("[Proxy PDF] HTML generation failed - empty result");
        return new NextResponse("Failed to generate HTML content", { status: 500 });
      }
      
      console.log(`[Proxy PDF] HTML generated successfully for ${type} invoice (${html.length} characters)`);
    } catch (htmlError) {
      console.error("[Proxy PDF] HTML generation error:", htmlError);
      return new NextResponse(`Failed to generate HTML: ${htmlError instanceof Error ? htmlError.message : 'Unknown error'}`, { status: 500 });
    }

    // Generate PDF (compulsory) with timeout
    let pdfBuffer;
    try {
      // Add timeout to prevent hanging
      const pdfPromise = generatePdf(html);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF generation timeout after 30 seconds')), 30000);
      });
      
      pdfBuffer = await Promise.race([pdfPromise, timeoutPromise]) as Buffer;
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
        console.error("[Proxy PDF] PDF generation failed - empty buffer returned");
        return new NextResponse("Failed to generate PDF content", { status: 500 });
      }
      
      console.log(`[Proxy PDF] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
    } catch (pdfError) {
      console.error("[Proxy PDF] PDF generation error:", pdfError);
      return new NextResponse(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`, { status: 500 });
    }
    
    // Upload to Cloudinary for future use (optional - don't block on failure)
    try {
      // Set up folder structure
      const yyyy = oid.substring(0, 4);
      const mm = oid.substring(4, 6);
      const dd = oid.substring(6, 8);
      const dateFolder = `${dd}-${mm}-${yyyy}`;
      const folder = `invoices/${dateFolder}/${oid}`;

      // Check if Cloudinary is properly configured
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
          !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || 
          !process.env.CLOUDINARY_API_SECRET) {
        console.error("[Proxy PDF] Cloudinary configuration missing");
        throw new Error("Cloudinary configuration incomplete");
      }

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { 
            resource_type: 'raw', 
            public_id: type, 
            folder, 
            format: 'pdf',
            overwrite: true
          },
          (error, result) => {
            if (error) {
              console.error("[Proxy PDF] Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(pdfBuffer);
      });
      
      console.log(`[Proxy PDF] PDF uploaded to Cloudinary: ${uploadResult.secure_url}`);
      
    } catch (uploadError) {
      console.error("[Proxy PDF] Failed to upload PDF to Cloudinary:", uploadError);
      // Continue to serve the PDF even if upload fails
    }

    // Serve the PDF
    console.log(`[Proxy PDF] Serving generated PDF, size: ${pdfBuffer.length} bytes`);
    
    const headers = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${type}_${oid}.pdf"`,
      "Cache-Control": "public, max-age=3600",
      "Content-Length": pdfBuffer.length.toString(),
    };
    
    console.log(`[Proxy PDF] Response headers:`, headers);
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });
    
  } catch (err) {
    console.error("[Proxy PDF] Failed to generate PDF:", err);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}

// Efficient GET endpoint for existing PDFs from Cloudinary
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const oid = searchParams.get("oid");

  if (!type || !oid) {
    return new NextResponse("Missing type or oid", { status: 400 });
  }

  console.log(`[Proxy PDF] GET Request for ${type} invoice, order: ${oid}`);

  try {
    // Set up folder structure
    const yyyy = oid.substring(0, 4);
    const mm = oid.substring(4, 6);
    const dd = oid.substring(6, 8);
    const dateFolder = `${dd}-${mm}-${yyyy}`;
    const folder = `invoices/${dateFolder}/${oid}`;

    // Try to fetch existing PDF from Cloudinary
    let public_id = `${folder}/${type}`;
    let result;
    
    try {
      result = await cloudinary.api.resource(public_id, {
        resource_type: "raw",
        format: "pdf",
      });
      console.log(`[Proxy PDF] Found existing PDF in Cloudinary: ${public_id}`);
    } catch (err1) {
      try {
        public_id = `${folder}/${type}.pdf`;
        result = await cloudinary.api.resource(public_id, {
          resource_type: "raw",
          format: "pdf",
        });
        console.log(`[Proxy PDF] Found existing PDF in Cloudinary: ${public_id}`);
      } catch (err2) {
        console.log(`[Proxy PDF] PDF not found in Cloudinary, redirecting to generation`);
        // Redirect to POST endpoint for generation
        return new NextResponse("PDF not found - use POST to generate", { status: 404 });
      }
    }

    // Serve existing PDF directly from Cloudinary
    const downloadUrl = cloudinary.utils.private_download_url(
      public_id,
      "pdf",
      {
        resource_type: "raw",
        type: "upload",
        expires_at: Math.floor(Date.now() / 1000) + 60,
      }
    );

    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) throw new Error("Failed to fetch PDF from Cloudinary");
    const arrayBuffer = await fileRes.arrayBuffer();

    console.log(`[Proxy PDF] Serving existing PDF from Cloudinary (${arrayBuffer.byteLength} bytes)`);
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${type}_${oid}.pdf"`,
        "Cache-Control": "public, max-age=3600",
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    });
    
  } catch (err) {
    console.error("[Proxy PDF] Error serving existing PDF:", err);
    return new NextResponse("PDF not available", { status: 404 });
  }
}