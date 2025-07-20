import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { generatePdf } from '@/lib/pdf';
import clientPromise from "@/lib/mongodb";

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

function getCustomerInvoiceHtml(order: any) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Sony Fashion Customer Order</title>
    <style>
      body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f6f7fa; color: #23272f; }
      .container { max-width: 800px; margin: 48px auto; background: #fff; border-radius: 20px; box-shadow: 0 8px 36px #0002; padding: 44px 40px 32px 40px; border: 1.5px solid #ececec; }
      .header { background: linear-gradient(90deg, #7f9cf5 0%, #fc5c7d 100%); color: #fff; border-radius: 16px; padding: 36px 0 22px 0; text-align: center; margin-bottom: 44px; font-weight: 900; font-size: 2.2em; letter-spacing: 0.5px; box-shadow: 0 2px 18px #b693fd33; }
      .order-id { font-size: 1.08em; margin-top: 12px; opacity: 0.92; font-weight: 400; }
      .main-row { display: flex; gap: 36px; margin-bottom: 36px; }
      .col { flex: 1; }
      .section-title { font-size: 1.15em; font-weight: 800; margin-bottom: 16px; color: #3b3b3b; display: flex; align-items: center; gap: 7px; letter-spacing: 0.2px; border-left: 5px solid #7f9cf5; padding-left: 14px; background: #f6f7fa; border-radius: 8px 0 0 8px; }
      table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; margin-top: 4px; box-shadow: 0 2px 10px #7f9cf511; border-radius: 12px; overflow: hidden; }
      th, td { border: 1px solid #ececec; padding: 11px 15px; text-align: left; font-size: 1em; background: #fff; }
      th { background: #f6f7fa; color: #7f9cf5; font-weight: 700; }
      tr:nth-child(even) td { background: #fafbfc; }
      .highlight-row td, .highlight-row th { background: #e7eafe !important; font-weight: 900; color: #4f46e5; border-radius: 10px; font-size: 1.1em; }
      .total-row { background: #fce4ec; color: #d81b60; font-size: 1.22em; font-weight: 900; }
      .total-label { font-size: 1.08em; color: #d81b60; font-weight: 800; }
      .notes { background: #f4f7fd; border-radius: 12px; padding: 18px 22px; font-size: 1em; margin-top: 12px; box-shadow: 0 1px 6px #7f9cf511; }
      .divider { border-top: 2px solid #ececec; margin: 32px 0; }
      .footer { text-align: center; color: #aaa; font-size: 1em; margin-top: 36px; border-top: 1px solid #ececec; padding-top: 16px; letter-spacing: 0.05px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        Sony Fashion Customer Order
        <div class="order-id">Order ID: ${order.oid} | Date: ${formatDate(order.orderDate)}</div>
      </div>
      <div class="main-row">
        <div class="col">
          <div class="section-title">👤 Customer Information</div>
          <table>
            <tr class="highlight-row"><th>Name</th><td>${order.fullName}</td></tr>
            <tr><th>Phone</th><td>${order.contactNumber}</td></tr>
            <tr><th>Email</th><td>${order.email}</td></tr>
            <tr><th>Address</th><td>${order.fullAddress}</td></tr>
          </table>
        </div>
        <div class="col">
          <div class="section-title">🧵 Order Summary</div>
          <table>
            <tr><th>Total Garments</th><td>${order.garments?.length || 0}</td></tr>
            <tr><th>Delivery Date</th><td>${formatDate(order.deliveryDate)}</td></tr>
            <tr><th>Delivery Method</th><td>${order.deliveryMethod || '-'}</td></tr>
            <tr><th>Payment Method</th><td>${order.payment}</td></tr>
            <tr><th>Special Instructions</th><td>${order.specialInstructions || '-'}</td></tr>
          </table>
        </div>
      </div>
      <div class="divider"></div>
      <div class="section-title">💰 Order Summary & Payment</div>
      <table>
        <tr class="total-row"><td class="total-label">Total Amount:</td><td class="total-label">${formatCurrency(order.totalAmount)}</td></tr>
      </table>
      <div style="background:#f4f7fd; border-radius:10px; padding:13px 20px; margin-bottom:14px; font-size:1em; box-shadow:0 1px 6px #7f9cf511;">
        <b>Payment Method:</b> ${order.payment}<br>
        <b>Payment Status:</b> Pending
      </div>
      <div class="divider"></div>
      <div class="section-title">📝 Order Notes</div>
      <div class="notes">
        What you ordered:<br>
        • ${order.garments?.length || 0} garment(s) with custom designs<br>
        • Delivery on ${formatDate(order.deliveryDate)}<br>
        • Total amount: ${formatCurrency(order.totalAmount)}<br>
        • Payment method: ${order.payment}
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
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 20px;
        color: #1a202c;
        line-height: 1.6;
      }
      
      .container { 
        max-width: 900px; 
        margin: 0 auto; 
        background: #ffffff; 
        border-radius: 24px; 
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        backdrop-filter: blur(10px);
      }
      
      .header { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #ffffff; 
        padding: 48px 40px;
        text-align: center; 
        position: relative;
        overflow: hidden;
      }
      
      .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        opacity: 0.3;
      }
      
      .header-content {
        position: relative;
        z-index: 2;
      }
      
      .header-title {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 8px;
        letter-spacing: -0.025em;
      }
      
      .header-subtitle {
        font-size: 1.1rem;
        font-weight: 400;
        opacity: 0.9;
        margin-bottom: 16px;
      }
      
      .order-id { 
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 0.95rem;
        font-weight: 500;
        letter-spacing: 0.025em;
      }
      
      .content {
        padding: 40px;
      }
      
      .garment-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 32px;
        margin-bottom: 32px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .garment-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      }
      
      .garment-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      
      .garment-header {
        display: flex;
        align-items: center;
        margin-bottom: 32px;
        padding-bottom: 20px;
        border-bottom: 2px solid #f7fafc;
      }
      
      .garment-number {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.2rem;
        margin-right: 16px;
        box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.4);
      }
      
      .garment-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #2d3748;
        letter-spacing: -0.025em;
      }
      
      .garment-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        align-items: start;
      }
      
      .measurements-section h3,
      .design-section h3 {
        font-size: 1.2rem;
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .measurements-table { 
        width: 100%; 
        border-collapse: separate; 
        border-spacing: 0; 
        border-radius: 16px; 
        overflow: hidden;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        background: #ffffff;
      }
      
      .measurements-table th { 
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        color: #4a5568; 
        font-weight: 600;
        padding: 16px 20px;
        text-align: left;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .measurements-table td { 
        padding: 16px 20px;
        border-top: 1px solid #e2e8f0;
        background: #ffffff;
        font-size: 0.95rem;
      }
      
      .measurements-table tbody tr:hover td {
        background: #f8fafc;
      }
      
      .measurement-label {
        font-weight: 500;
        color: #2d3748;
      }
      
      .measurement-value {
        font-weight: 600;
        color: #667eea;
      }
      
      .design-description {
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        border-left: 4px solid #667eea;
        padding: 20px;
        border-radius: 0 12px 12px 0;
        margin-bottom: 24px;
        font-style: italic;
        color: #4a5568;
        line-height: 1.7;
      }
      
      .design-images { 
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }
      
      .design-image { 
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 16px;
        border: 3px solid #e2e8f0;
        background: #f8fafc;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      
      .design-image:hover {
        transform: scale(1.02);
        border-color: #667eea;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
      
      .no-images {
        text-align: center;
        color: #a0aec0;
        font-style: italic;
        padding: 40px 20px;
        border: 2px dashed #e2e8f0;
        border-radius: 16px;
        background: #f8fafc;
      }
      
      .footer { 
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        color: #ffffff;
        text-align: center; 
        padding: 32px 40px;
        font-size: 0.95rem;
        font-weight: 500;
        letter-spacing: 0.025em;
      }
      
      .footer-icon {
        font-size: 1.5rem;
        margin-bottom: 12px;
        opacity: 0.8;
      }
      
      @media (max-width: 768px) {
        body { padding: 10px; }
        .container { border-radius: 16px; }
        .header { padding: 32px 24px; }
        .header-title { font-size: 2rem; }
        .content { padding: 24px; }
        .garment-card { padding: 24px; margin-bottom: 24px; }
        .garment-content { grid-template-columns: 1fr; gap: 24px; }
        .design-images { grid-template-columns: 1fr; }
      }
      
      /* Icons using CSS */
      .icon-ruler::before { content: "📏"; margin-right: 8px; }
      .icon-design::before { content: "🎨"; margin-right: 8px; }
      .icon-checkmark::before { content: "✨"; margin-right: 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-content">
          <div class="header-title">Sony Fashion Tailor</div>
          <div class="header-subtitle">Custom Order Details</div>
          <div class="order-id">Order #${order.oid}</div>
        </div>
      </div>
      
      <div class="content">
        ${garmentsData.map((g: any, idx: number) => {
          const design = g.designs && Array.isArray(g.designs) && g.designs.length > 0 ? g.designs[0] : null;
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
            <div class="garment-card">
              <div class="garment-header">
                <div class="garment-number">${idx + 1}</div>
                <div class="garment-title">Garment ${idx + 1}</div>
              </div>
              
              <div class="garment-content">
                <div class="measurements-section">
                  <h3 class="icon-ruler">Measurements</h3>
                  <table class="measurements-table">
                    <thead>
                      <tr>
                        <th>Measurement</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${g.measurement?.measurements
                        ? Object.entries(g.measurement.measurements)
                            .map(
                              ([key, value]) =>
                                `<tr>
                                  <td class="measurement-label">${key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                  <td class="measurement-value">${value}</td>
                                </tr>`
                            )
                            .join('')
                        : '<tr><td colspan="2" style="text-align: center; color: #a0aec0; font-style: italic;">No measurements available</td></tr>'}
                    </tbody>
                  </table>
                </div>
                
                <div class="design-section">
                  <h3 class="icon-design">Design Details</h3>
                  ${design?.designDescription ? `<div class="design-description">"${design.designDescription}"</div>` : ''}
                  
                  <div class="design-images">
                    ${images.length > 0 
                      ? images.join('') 
                      : '<div class="no-images">No design images provided</div>'
                    }
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="footer">
        <div class="footer-icon icon-checkmark"></div>
        Please follow all measurements and design references precisely for the perfect fit.
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