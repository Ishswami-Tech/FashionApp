// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import path from "path";
import { google } from "googleapis";
import Busboy from "busboy";
import { Readable } from "stream";
import cloudinary from '@/lib/cloudinary';
import { generatePdf } from '@/lib/pdf';
import { getCustomerInvoiceHtml } from "@/templates/invoices/customerInvoiceHtml";

export const config = {
  api: {
    bodyParser: false,
  },
};

function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// In-memory order sequence tracking (resets on server restart)
const orderSequence: { [date: string]: number } = {};

function getTodayOrderId(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const key = `${yyyy}${mm}${dd}`;
  if (!orderSequence[key]) orderSequence[key] = 1;
  else orderSequence[key]++;
  const seq = String(orderSequence[key]).padStart(3, '0');
  return `${yyyy}${mm}${dd}${seq}`;
}

// Parse multipart form data using busboy
async function parseFormWithBusboy(req: NextRequest) {
  return new Promise<{ fields: any; files: any }>(async (resolve, reject) => {
    const fields: Record<string, any> = {};
    const files: Record<string, any> = {};
    const busboy = Busboy({ headers: Object.fromEntries(req.headers) });

    busboy.on("file", (fieldname: string, file: NodeJS.ReadableStream, filename: string, encoding: string, mimetype: string) => {
      const fileBuffers: Buffer[] = [];
      file.on("data", (data: Buffer) => fileBuffers.push(data));
      file.on("end", () => {
        const fileBuffer = Buffer.concat(fileBuffers);
        if (!files[fieldname]) files[fieldname] = [];
        files[fieldname].push({
          buffer: fileBuffer,
          originalname: filename,
          mimetype,
        });
      });
    });

    busboy.on("field", (fieldname: string, value: string) => {
      fields[fieldname] = value;
    });

    busboy.on("finish", () => {
      // Flatten single-file fields
      for (const key in files) {
        if (files[key].length === 1) files[key] = files[key][0];
      }
      resolve({ fields, files });
    });

    busboy.on("error", (err: Error) => reject(err));

    // Read the request body as a buffer, then pipe to busboy
    const reader = req.body.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    const buffer = Buffer.concat(chunks);
    const nodeStream = Readable.from(buffer);
    nodeStream.pipe(busboy);
  });
}

function isBusboyFile(file: any): file is { buffer: Buffer; originalname: string; mimetype: string } {
  return file && file.buffer && file.originalname && file.mimetype;
}

// Helper to flatten an object into an array of its primitive values (recursively, if needed)
function flattenObjectValues(obj: any) {
  const result: any[] = [];
  for (const v of Object.values(obj)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      result.push(...flattenObjectValues(v));
    } else if (Array.isArray(v)) {
      result.push(v.join(', '));
    } else {
      result.push(v ?? '');
    }
  }
  return result;
}

// Define the measurement fields in a fixed order for summary row
const MEASUREMENT_FIELDS = [
  'shoulderWidth', 'shoulderSlope', 'shoulderPoint', 'chest', 'waist', 'hip', 'sleeveLength', 'armhole',
  'kurtaLength', 'neck', 'neckBand', 'neckCircumference', 'frontNeckDepth', 'backNeckDepth', 'cuffWidth',
  'cuffLength', 'backWidth', 'sideSeam', 'collarHeight', 'collarSpread', 'yokeWidth', 'yokeLength',
  'pocketPosition', 'buttonStance', 'bicep', 'forearm', 'wrist', 'alterationAllowance', 'bust', 'underBust',
  'armpit', 'sleeveWidth', 'blouseLength', 'bustPointToPoint', 'shoulderToBust', 'waistToBust', 'waistDart',
  'bustDart', 'princessLine', 'shoulderTip', 'hookPosition'
];

async function uploadBufferToCloudinary(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: filename, folder: 'orders' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
}

// --- HTML template functions for invoices ---
function getTailorInvoiceHtml(order) {
  const garmentsData = order.garments || [];
  const deliveryData = order;
  const orderIdValue = order.oid;
  const garment = garmentsData[0] || {};
  const design = garment.designs && Array.isArray(garment.designs) && garment.designs.length > 0 ? garment.designs[0] : null;
  function renderDesignImages(design) {
    let images = [];
    if (design && design.canvasImage && typeof design.canvasImage === "string" && design.canvasImage.startsWith("data:image/")) {
      images.push(`<img src="${design.canvasImage}" alt="Canvas Drawing" class="canvas-image" />`);
    }
    const refs = [
      ...(Array.isArray(design?.designReference) ? design.designReference : []),
      ...(Array.isArray(design?.designReferenceFiles) ? design.designReferenceFiles : []),
    ];
    images = images.concat(
      refs
        .map((img, idx) => {
          if (typeof img === "string") return `<img src="${img}" alt="Reference ${idx + 1}" class="canvas-image" />`;
          if (img && img.url) return `<img src="${img.url}" alt="Reference ${idx + 1}" class="canvas-image" />`;
          return "";
        })
        .filter(Boolean)
    );
    return images.slice(0, 4).join("");
  }
  return `<!DOCTYPE html>
  <html>
  <head>
    <title>Tailor Work Order</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 13px; background: #fafbfc; margin: 0; padding: 0; }
      .main-container { max-width: 1000px; margin: 24px auto; background: #fff; border: 2px solid #388e3c; border-radius: 10px; box-shadow: 0 2px 8px #0001; padding: 32px 24px; }
      .order-id { font-size: 18px; font-weight: bold; color: #388e3c; margin-bottom: 18px; letter-spacing: 1px; }
      .two-col { display: grid; grid-template-columns: 1fr 1.2fr; gap: 32px; align-items: flex-start; }
      .section-title { font-weight: bold; color: #388e3c; margin-bottom: 10px; font-size: 16px; border-bottom: 1.5px solid #388e3c; padding-bottom: 4px; }
      .measurement-list { list-style: none; padding: 0; margin: 0; }
      .measurement-list li { margin-bottom: 4px; padding: 4px 6px; font-size: 11px; }
      .measurement-label { font-weight: bold; color: #222; margin-right: 8px; }
      .canvas-image { max-width: 300px; max-height: 300px; width: 300px; height: auto; object-fit: contain; border: 2px solid #388e3c; border-radius: 6px; background: #f8f9fa; box-shadow: 0 1px 4px #0001; margin-bottom: 10px; }
      .design-images { display: flex; gap: 16px; margin: 18px 0; }
      .right-col-section { margin-bottom: 24px; }
      .work-instructions { background: #e8f5e8; border-left: 4px solid #388e3c; border-radius: 6px; padding: 16px 14px; font-size: 14px; color: #222; margin-top: 18px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
      th, td { border: 1.5px solid #e0e0e0; padding: 8px 10px; text-align: left; }
    </style>
  </head>
  <body>
    <div class="main-container">
      <div class="order-id">Order ID: ${orderIdValue}</div>
      <div class="two-col">
        <div>
          <div class="section-title">Measurements</div>
          <ul class="measurement-list">
            ${garment.measurement && garment.measurement.measurements && Object.keys(garment.measurement.measurements).length > 0
              ? Object.entries(garment.measurement.measurements)
                  .map(
                    ([key, value]) => `<li><span class="measurement-label">${key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:</span> ${value}</li>`
                  )
                  .join("")
              : "<li>No measurements</li>"}
          </ul>
        </div>
        <div>
          <div class="right-col-section">
            <div class="section-title">Design Reference</div>
            ${design
              ? `<div><strong>${garment.order?.orderType || ""} - ${garment.variant || ""}</strong></div>
                <div><strong>Design 1:</strong> ${design.name || "Design 1"}</div>
                <div>${design.designDescription || "Custom design"}</div>
                <div class="design-images">${renderDesignImages(design) || "<span>No images</span>"}</div>`
              : "<div>No design data</div>"}
          </div>
          <div class="right-col-section">
            <div class="section-title">Delivery Details</div>
            <table>
              <tr><th>Delivery Date</th><td>${deliveryData.deliveryDate || ''}</td></tr>
            </table>
          </div>
          <div class="work-instructions">
            <div style="font-weight:bold; margin-bottom:6px;">Work Instructions</div>
            ${garment
              ? `<div>• ${garment.order?.orderType || ""} in ${garment.variant || ""} variant</div>
                <div>• Quantity: ${garment.order?.quantity || ""}</div>
                <div>• Urgency: ${garment.order?.urgency || ""}</div>
                <div>• Follow the design references provided</div>
                <div>• Use the exact measurements provided</div>
                <div>• Special instructions: ${deliveryData.specialInstructions || "None"}</div>
                <div>• Complete by: ${deliveryData.deliveryDate || ''}</div>`
              : "<div>No garment data</div>"}
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse form data
    const { fields, files } = await parseFormWithBusboy(req);
    console.log('Parsed files:', files); // LOG parsed files
    const now = new Date();
    const formattedDate = formatDate(now);
    const oid = getTodayOrderId(now);

    // 2. Parse and flatten nested JSON fields from the form
    let customer = {};
    let garments = [];
    let delivery = {};
    try {
      customer = fields.customer ? JSON.parse(fields.customer) : {};
    } catch (err) {
      console.error('Customer parse error:', err);
    }
    try {
      garments = fields.garments ? JSON.parse(fields.garments) : [];
    } catch (err) {
      console.error('Garments parse error:', err);
    }
    try {
      delivery = fields.delivery ? JSON.parse(fields.delivery) : {};
    } catch (err) {
      console.error('Delivery parse error:', err);
    }

    // 3. For each garment, attach file Buffers (canvasImage, designReference, voiceNote) if present
    const dateFolder = formattedDate.replace(/\//g, '-'); // e.g. 11-07-2025
    for (let i = 0; i < garments.length; i++) {
      const garment = garments[i];
      const measurement = garment.measurement || {};
      const garmentType = (garment.order?.orderType || 'GARMENT').replace(/\s+/g, '').toUpperCase();
      const orderSeq = oid.split('-').pop() || '000';
      const garmentIndex = i + 1;
      // Upload canvasImage file to Cloudinary if present
      if (files[`canvasImage_${i}`]) {
        const file = files[`canvasImage_${i}`];
        console.log(`Uploading canvasImage for garment ${i}:`, file);
        if (!file.mimetype) file.mimetype = 'image/png';
        const imageNum = 1;
        const businessName = `ORD+${garmentType}+${orderSeq}+${garmentIndex}+CANVAS+${imageNum}`;
        const folder = `orders/${dateFolder}/${oid}`;
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'image', public_id: businessName.replace(/\+/g, '_'), folder },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });
        console.log('Cloudinary canvasImage upload result:', result);
        measurement.canvasImageFile = { url: result.secure_url, originalname: businessName };
      } else {
        measurement.canvasImageFile = undefined;
      }
      // Upload designReference files to Cloudinary if present
      // If this garment has designs, attach designReferenceFiles to each design
      if (Array.isArray(garment.designs)) {
        for (let d = 0; d < garment.designs.length; d++) {
          const designRefs = [];
          let j = 0;
          while (files[`designReference_${i}_${d}_${j}`]) {
            const file = files[`designReference_${i}_${d}_${j}`];
            if (!file.mimetype) file.mimetype = 'image/png';
            const imageNum = j + 1;
            const businessName = `ORD+${garmentType}+${orderSeq}+${garmentIndex}+REF+${d + 1}+${imageNum}`;
            const folder = `orders/${dateFolder}/${oid}`;
            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                { resource_type: 'image', public_id: businessName.replace(/\+/g, '_'), folder },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              ).end(file.buffer);
            });
            designRefs.push({ url: result.secure_url, originalname: businessName });
            j++;
          }
          garment.designs[d].designReferenceFiles = designRefs;
        }
      }
      // Voice notes: (optional) you can upload to Cloudinary as resource_type: 'video' or keep in MongoDB
      if (files[`voiceNote_${i}`]) {
        const file = files[`voiceNote_${i}`];
        if (!file.mimetype) file.mimetype = 'audio/mpeg';
        // For now, skip uploading audio to Cloudinary (can be added if needed)
        // measurement.voiceNoteFile = file;
      }
      garment.measurement = measurement;
      garments[i] = garment;
    }

    // 4. Build the order object
    // Only store order data (no image buffers)
    // Calculate total amount from all designs
    const totalAmount = garments.reduce((sum: number, garment: any) => {
      if (garment.designs && Array.isArray(garment.designs)) {
        return sum + garment.designs.reduce((dsum: number, design: any) => 
          dsum + (parseFloat(design.amount) || 0), 0);
      }
      return sum;
    }, 0);
    
    const order = {
      ...customer,
      ...delivery,
      garments,
      totalAmount: totalAmount.toFixed(2),
      oid,
      orderDate: formattedDate,
      createdAt: now,
    };
    console.log('Final order to be saved in MongoDB:', order); // LOG final order

    // 5. Store in MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "fashionapp");
    const insertResult = await db.collection("orders").insertOne(order);

    // Fetch the inserted order (with _id)
    const savedOrder = await db.collection("orders").findOne({ _id: insertResult.insertedId });

    // --- PDF Generation and Cloudinary Upload ---
    const customerHtml = getCustomerInvoiceHtml(savedOrder);
    const tailorHtml = getTailorInvoiceHtml(savedOrder);
    let customerPdf, tailorPdf;
    let pdfGenerationSuccess = false;
    try {
      [customerPdf, tailorPdf] = await Promise.all([
        generatePdf(customerHtml),
        generatePdf(tailorHtml),
      ]);
      pdfGenerationSuccess = true;
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError);
      // Continue without PDFs - order will still be saved
    }
    
    // Upload PDFs to Cloudinary only if generation was successful
    let customerUpload = null, tailorUpload = null;
    if (pdfGenerationSuccess) {
      try {
        const dateFolder = formattedDate.replace(/\//g, '-');
        const folder = `invoices/${dateFolder}/${oid}`;
        
        // Upload customer PDF
        customerUpload = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'raw', public_id: 'customer', folder, format: 'pdf' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(customerPdf);
        });
        
        // Upload tailor PDF
        tailorUpload = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'raw', public_id: 'tailor', folder, format: 'pdf' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(tailorPdf);
        });
        
        console.log("PDFs uploaded successfully to Cloudinary");
      } catch (uploadError) {
        console.error("PDF upload to Cloudinary failed:", uploadError);
        // Continue without PDFs - order will still be saved
      }
    }
    
    // Save URLs to order (only if uploads were successful)
    const invoiceLinks = {};
    if (customerUpload?.secure_url) invoiceLinks.customer = customerUpload.secure_url;
    if (tailorUpload?.secure_url) invoiceLinks.tailor = tailorUpload.secure_url;
    if (Object.keys(invoiceLinks).length > 0) {
      await db.collection("orders").updateOne(
        { _id: savedOrder._id },
        { $set: { invoiceLinks } }
      );
    }
    
    // Fetch updated order
    const updatedOrder = await db.collection("orders").findOne({ _id: savedOrder._id });
    // --- Automatically send WhatsApp message ---
    try {
      console.log("Attempting to send WhatsApp message...");
      const waToken = process.env.WHATSAPP_ACCESS_TOKEN;
      if (!waToken) {
        console.error("WHATSAPP_ACCESS_TOKEN not found in environment variables");
        throw new Error("WhatsApp token not configured");
      }
      let phoneNumber = updatedOrder.contactNumber;
      if (!phoneNumber.startsWith('91')) {
        phoneNumber = '91' + phoneNumber;
      }
      console.log("Sending WhatsApp message to:", phoneNumber);
      // Use proxy-pdf URL for WhatsApp invoice link
      const invoiceLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://sonyfashion.in'}/api/proxy-pdf?type=customer&oid=${updatedOrder.oid}`;
      const params = [
        updatedOrder.fullName || "",
        updatedOrder.oid || "",
        updatedOrder.orderDate || "",
        (updatedOrder.garments || []).map((g) => g.order?.orderType).join(", ") || "",
        updatedOrder.totalAmount || "",
        updatedOrder.deliveryDate || "",
        invoiceLink
      ];
      
      console.log("WhatsApp template parameters:", params);
      
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "703783789484730";
      const waUrl = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
      const waPayload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: "order_invoice",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: params.map((text) => ({ type: "text", text })),
            },
          ],
        },
      };
      
      console.log("WhatsApp payload:", JSON.stringify(waPayload, null, 2));
      
      const waRes = await fetch(waUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${waToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(waPayload),
      });
      
      const waData = await waRes.json();
      console.log("WhatsApp API response:", waData);
      
      if (!waRes.ok) {
        console.error("WhatsApp API error:", waData);
        throw new Error(`WhatsApp API error: ${waData.error?.message || 'Unknown error'}`);
      }
      
      console.log("WhatsApp message sent successfully!");
      
    } catch (err) {
      console.error("Failed to send WhatsApp message:", err);
    }

    console.log('Returning response:', { success: true, oid, orderDate: formattedDate, order: updatedOrder });
    return NextResponse.json({ success: true, oid, orderDate: formattedDate, order: updatedOrder });
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
} 