import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { generatePdf } from '@/lib/pdf';
import clientPromise from "@/lib/mongodb";

// Import the HTML generation functions from the orders route
// We'll need to copy these functions here since they're not exported
function getCustomerInvoiceHtml(order: any) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Sony Fashion Customer Order</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6fb; color: #222; }
      .container { max-width: 900px; margin: 30px auto; background: #fff; border-radius: 16px; box-shadow: 0 0 32px #0002; padding: 40px 48px; }
      .header { background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%); color: #fff; border-radius: 12px; padding: 32px 0 24px 0; text-align: center; margin-bottom: 32px; }
      .header-title { font-size: 2em; font-weight: 700; letter-spacing: 1px; }
      .order-id { font-size: 1.1em; margin-top: 8px; }
      .section { margin-bottom: 32px; }
      .section-title { font-size: 1.1em; font-weight: 600; margin-bottom: 10px; color: #3b3b3b; display: flex; align-items: center; }
      .section-title svg { margin-right: 8px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; }
      th { background: #f1f5f9; color: #6a82fb; font-weight: 600; }
      .total-row { background: #fce4ec; color: #d81b60; font-size: 1.2em; font-weight: 700; }
      .notes { background: #e3f2fd; border-radius: 8px; padding: 16px; }
      .footer { text-align: center; color: #888; font-size: 0.98em; margin-top: 40px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-title">Sony Fashion Customer Order</div>
        <div class="order-id">Order ID: ${order.oid} | Date: ${order.orderDate}</div>
      </div>
      <div class="section">
        <div class="section-title">👤 Customer Information</div>
        <table>
          <tr><th>Name</th><td>${order.fullName}</td></tr>
          <tr><th>Phone</th><td>${order.contactNumber}</td></tr>
          <tr><th>Email</th><td>${order.email}</td></tr>
          <tr><th>Address</th><td>${order.fullAddress}</td></tr>
        </table>
      </div>
      <div class="section">
        <div class="section-title">👕 Order Summary</div>
        <table>
          <tr><th>Total Garments</th><td>${order.garments?.length || 0}</td></tr>
          <tr><th>Delivery Date</th><td>${order.deliveryDate}</td></tr>
          <tr><th>Delivery Method</th><td>${order.deliveryMethod || '-'}</td></tr>
          <tr><th>Payment Method</th><td>${order.payment}</td></tr>
          <tr><th>Special Instructions</th><td>${order.specialInstructions || '-'}</td></tr>
        </table>
      </div>
      <div class="section">
        <div class="section-title">💰 Order Summary & Payment</div>
        <table>
          <tr class="total-row"><td>Total Amount:</td><td>₹${order.totalAmount}</td></tr>
        </table>
        <div style="background:#e3f2fd; border-radius:8px; padding:10px 16px; margin-bottom:8px;">
          <b>Payment Method:</b> ${order.payment}<br>
          <b>Payment Status:</b> Pending
        </div>
      </div>
      <div class="section">
        <div class="section-title">📝 Order Notes</div>
        <div class="notes">
          What you ordered:<br>
          • ${order.garments?.length || 0} garment(s) with custom designs<br>
          • Delivery on ${order.deliveryDate}<br>
          • Total amount: ₹${order.totalAmount}<br>
          • Payment method: ${order.payment}
        </div>
      </div>
      <div class="footer">
        Thank you for your order! For queries, contact us anytime.
      </div>
    </div>
  </body>
  </html>
  `;
}

function getTailorInvoiceHtml(order: any) {
  const garmentsData = order.garments || [];
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Sony Fashion Tailor Order</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f6fefb; color: #222; }
      .container { max-width: 900px; margin: 24px auto; background: #fff; border-radius: 14px; box-shadow: 0 0 24px #0001; padding: 32px 32px 24px 32px; }
      .header { background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%); color: #fff; border-radius: 10px; padding: 24px 0 18px 0; text-align: center; margin-bottom: 24px; }
      .header-title { font-size: 2em; font-weight: 700; letter-spacing: 1px; }
      .order-id { font-size: 1.1em; margin-top: 8px; }
      .row { display: flex; gap: 24px; }
      .col { flex: 1; }
      .measurements-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      .measurements-table th, .measurements-table td { border: 1.5px solid #e0f2e9; padding: 7px 10px; }
      .measurements-table th { background: #e6f9f0; color: #1b8c4a; font-weight: 700; font-size: 1em; }
      .measurements-table td { background: #fff; font-size: 0.98em; }
      .section-title { color: #1b8c4a; font-weight: 700; font-size: 1.1em; margin-bottom: 8px; }
      .design-images { display: flex; flex-direction: column; gap: 16px; }
      .design-image { width: 320px; height: 320px; object-fit: contain; border-radius: 10px; border: 2.5px solid #43e97b; background: #f8f9fa; box-shadow: 0 2px 8px #0001; margin-bottom: 4px; }
      .design-desc { margin: 8px 0 12px 0; color: #444; font-style: italic; }
      .footer { text-align: center; color: #888; font-size: 1em; margin-top: 32px; border-top: 1px solid #e0f2e9; padding-top: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-title">Sony Fashion Tailor Order</div>
        <div class="order-id">Order ID: ${order.oid}</div>
      </div>
      ${garmentsData.map((g: any, idx: number) => {
        const design = g.designs && Array.isArray(g.designs) && g.designs.length > 0 ? g.designs[0] : null;
        // Images
        let images = [];
        if (design && design.canvasImage && typeof design.canvasImage === "string" && design.canvasImage.startsWith("data:image/")) {
          images.push(`<img src="${design.canvasImage}" alt="Canvas Drawing" class="design-image" />`);
        }
        const refs = [
          ...(Array.isArray(design?.designReference) ? design.designReference : []),
          ...(Array.isArray(design?.designReferenceFiles) ? design.designReferenceFiles : []),
        ];
        images = images.concat(
          refs
            .map((img, idx) => {
              if (typeof img === "string") return `<img src="${img}" alt="Reference ${idx + 1}" class="design-image" />`;
              if (img && img.url) return `<img src="${img.url}" alt="Reference ${idx + 1}" class="design-image" />`;
              return "";
            })
            .filter(Boolean)
        );
        return `
          <div style="margin-bottom: 24px;">
            <div class="section-title">Garment ${idx + 1}</div>
            <div class="row">
              <div class="col">
                <table class="measurements-table">
                  <thead>
                    <tr><th>Measurement</th><th>Value</th></tr>
                  </thead>
                  <tbody>
                    ${g.measurement?.measurements
                      ? Object.entries(g.measurement.measurements)
                          .map(
                            ([key, value]) =>
                              `<tr><td>${key.replace(/([A-Z])/g, ' $1').trim()}</td><td>${value}</td></tr>`
                          )
                          .join('')
                      : '<tr><td colspan="2">No measurements</td></tr>'}
                  </tbody>
                </table>
              </div>
              <div class="col">
                ${design?.designDescription ? `<div class="design-desc">${design.designDescription}</div>` : ''}
                <div class="design-images">
                  ${images.length > 0 ? images.join('') : '<div style="color:#aaa;">No design images</div>'}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
      <div class="footer">
        Please follow all measurements and design references precisely.
      </div>
    </div>
  </body>
  </html>
  `;
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