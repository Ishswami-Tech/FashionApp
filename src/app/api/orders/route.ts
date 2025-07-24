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
import { getTailorInvoiceHtml } from "@/templates/invoices/tailorInvoiceHtml";

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

// Persistent daily order sequence using MongoDB (robust atomic approach with debug logging)
async function getTodayOrderIdFromDb(db, date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const key = `${yyyy}${mm}${dd}`;
  // Atomically increment and fetch the sequence for today
  const result = await db.collection('order_sequences').findOneAndUpdate(
    { date: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('Order sequence result:', result); // Debug log
  // Defensive: fallback to 1 if result.value is missing (shouldn't happen, but safe)
  const seqNum = result.value?.seq ?? 1;
  const seq = String(seqNum).padStart(3, '0');
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

const inMemoryOrderSequence = {};

async function getRobustOrderId(db, date, client, orderData) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const key = `${yyyy}${mm}${dd}`;

  let mongoSeq = 0, lastOrderSeq = 0, memSeq = inMemoryOrderSequence[key] || 0;
  let fallbackError = null;

  // 1. Try MongoDB atomic sequence
  try {
    const result = await db.collection('order_sequences').findOneAndUpdate(
      { date: key },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    mongoSeq = result.value?.seq ?? 1;
  } catch (e) {
    console.error('MongoDB sequence error:', e);
    fallbackError = e;
  }

  // 2. Query latest order
  try {
    const latestOrder = await db.collection('orders')
      .find({ oid: { $regex: `^${key}` } })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    if (latestOrder.length > 0) {
      lastOrderSeq = parseInt(latestOrder[0].oid.slice(8), 10);
    }
  } catch (e) {
    console.error('Latest order query error:', e);
    fallbackError = e;
  }

  // 3. In-memory
  try {
    memSeq = inMemoryOrderSequence[key] || 0;
  } catch (e) {
    console.error('In-memory sequence error:', e);
    fallbackError = e;
  }

  // 4. Take the max and increment
  const nextSeq = Math.max(mongoSeq, lastOrderSeq, memSeq) + 1;
  const seqStr = String(nextSeq).padStart(3, '0');
  const oid = `${key}${seqStr}`;

  // 5. Sync all sources
  inMemoryOrderSequence[key] = nextSeq;
  try {
    await db.collection('order_sequences').updateOne(
      { date: key },
      { $set: { seq: nextSeq } },
      { upsert: true }
    );
  } catch (e) {
    console.error('MongoDB sequence sync error:', e);
    fallbackError = e;
  }

  // 6. Debug log
  console.log({ mongoSeq, lastOrderSeq, memSeq, nextSeq, oid });

  // 7. Try to insert order, retry on duplicate key error
  let insertResult = null;
  try {
    insertResult = await db.collection('orders').insertOne({ ...orderData, oid });
    return { oid, insertResult };
  } catch (e) {
    if (e.code === 11000) { // Duplicate key error
      console.warn('Duplicate order ID, retrying...');
      // Recursively retry (could add a max retry count)
      return await getRobustOrderId(db, date, client, orderData);
    } else {
      console.error('Order insert error:', e);
      fallbackError = e;
    }
  }

  // 8. If all else fails, try a MongoDB transaction
  try {
    const session = client.startSession();
    let txnOid = oid;
    let txnInsertResult = null;
    await session.withTransaction(async () => {
      const txnResult = await db.collection('order_sequences').findOneAndUpdate(
        { date: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after', session }
      );
      const txnSeqNum = txnResult.value?.seq ?? 1;
      const txnSeq = String(txnSeqNum).padStart(3, '0');
      txnOid = `${key}${txnSeq}`;
      txnInsertResult = await db.collection('orders').insertOne({ ...orderData, oid: txnOid }, { session });
    });
    await session.endSession();
    return { oid: txnOid, insertResult: txnInsertResult };
  } catch (e) {
    console.error('Transaction fallback error:', e);
    throw fallbackError || e;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse form data
    const { fields, files } = await parseFormWithBusboy(req);
    console.log('Parsed files:', files); // LOG parsed files
    const now = new Date();
    const formattedDate = formatDate(now);
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "fashionapp");

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

    // 4. Generate robust order ID before the garments loop
    const { oid } = await getRobustOrderId(db, now, client, {}); // Destructure to get oid string

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

    // 3. Build the order object (do not change structure)
    const totalAmount = garments.reduce((sum, garment) => {
      if (garment.designs && Array.isArray(garment.designs)) {
        return sum + garment.designs.reduce((dsum, design) => dsum + (parseFloat(design.amount) || 0), 0);
      }
      return sum;
    }, 0);

    const order = {
      ...customer,
      ...delivery,
      garments,
      totalAmount: totalAmount.toFixed(2),
      orderDate: formattedDate,
      createdAt: now,
      oid,
      advanceAmount: delivery.advanceAmount ? Number(delivery.advanceAmount) : 0,
      dueAmount: Math.max(0, totalAmount - Number(delivery.advanceAmount) || 0),
    };

    // 5. Store in MongoDB (as before)
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
        updatedOrder.deliveryDate
          ? new Date(updatedOrder.deliveryDate).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
        updatedOrder.payment === 'advance' && updatedOrder.advanceAmount ? `Advance: ₹${updatedOrder.advanceAmount}` : "",
        updatedOrder.payment === 'advance' && updatedOrder.dueAmount !== undefined ? `Due: ₹${updatedOrder.dueAmount}` : "",
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