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

// Generate single PDF and upload to Cloudinary
async function generateSinglePDF(type: 'customer' | 'tailor', order: any) {
  try {
    console.log(`[API] Generating ${type} PDF for order: ${order.oid}`);
    
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
        throw new Error(`Invalid PDF type: ${type}`);
    }
    
    if (!html || html.trim().length === 0) {
      throw new Error(`HTML generation failed for ${type} PDF`);
    }
    
    // Generate PDF with timeout
    const pdfPromise = generatePdf(html);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF generation timeout after 30 seconds')), 30000);
    });
    
    const pdfBuffer = await Promise.race([pdfPromise, timeoutPromise]) as Buffer;
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error(`PDF generation failed for ${type} PDF`);
    }
    
    // Set up Cloudinary folder structure
    const yyyy = order.oid.substring(0, 4);
    const mm = order.oid.substring(4, 6);
    const dd = order.oid.substring(6, 8);
    const dateFolder = `${dd}-${mm}-${yyyy}`;
    const folder = `invoices/${dateFolder}/${order.oid}`;
    
    // Upload to Cloudinary
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
            console.error(`[API] Cloudinary upload error for ${type} PDF:`, error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(pdfBuffer);
    });
    
    console.log(`[API] ${type} PDF uploaded to Cloudinary: ${uploadResult.secure_url}`);
    console.log(`[API] ${type} PDF public_id: ${uploadResult.public_id}`);
    
    // Return both URL and public_id for better tracking
    return {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      asset_id: uploadResult.asset_id
    };
    
  } catch (error) {
    console.error(`[API] Failed to generate ${type} PDF:`, error);
    throw error;
  }
}

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
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000);
    });
    
    // 1. Parse form data
    const parsePromise = parseFormWithBusboy(req);
    const { fields, files } = await Promise.race([parsePromise, timeoutPromise]);
    console.log('Parsed fields:', Object.keys(fields));
    console.log('Parsed files:', Object.keys(files));
    console.log('Files count:', Object.keys(files).length);
    console.log('Sample files:', files);
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

    // 3. Process all garments in parallel for faster uploads
    const dateFolder = formattedDate.replace(/\//g, '-'); // e.g. 11-07-2025
    
    // Process all garments in parallel with better error handling
    const processedGarments = await Promise.all(garments.map(async (garment, i) => {
      try {
      const measurement = garment.measurement || {};
      const garmentType = (garment.order?.orderType || 'GARMENT').replace(/\s+/g, '').toUpperCase();
      const orderSeq = oid.split('-').pop() || '000';
      const garmentIndex = i + 1;
      
      // Upload canvasImage file to Cloudinary if present
      if (files[`canvasImage_${i}`]) {
        const fileArray = Array.isArray(files[`canvasImage_${i}`]) ? files[`canvasImage_${i}`] : [files[`canvasImage_${i}`]];
        console.log(`Uploading canvasImage for garment ${i}:`, fileArray);
        
        // Process each file in the array
        const uploadedFiles = [];
        for (let fileIndex = 0; fileIndex < fileArray.length; fileIndex++) {
          const file = fileArray[fileIndex];
          
          // Ensure mimetype is set and check buffer
          const mimetype = file.mimetype || 'image/png';
          console.log(`Using mimetype: ${mimetype} for canvasImage_${i}_${fileIndex}`);
          
          // Check if buffer is valid
          if (!file.buffer || file.buffer.length === 0) {
            console.warn(`Empty buffer for canvasImage_${i}_${fileIndex}, skipping upload`);
            continue;
          }
          
          const imageNum = fileIndex + 1;
        const businessName = `ORD+${garmentType}+${orderSeq}+${garmentIndex}+CANVAS+${imageNum}`;
        const folder = `orders/${dateFolder}/${oid}`;
          
          try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
                { 
                  resource_type: 'image', 
                  public_id: businessName.replace(/\+/g, '_'), 
                  folder,
                  format: 'png' // Explicitly set format
                },
            (error, result) => {
                  if (error) {
                    console.error(`Cloudinary upload error for canvasImage_${i}_${fileIndex}:`, error);
                    reject(error);
                  } else {
                    console.log(`Cloudinary upload success for canvasImage_${i}_${fileIndex}:`, result);
                    resolve(result);
                  }
            }
          ).end(file.buffer);
        });
            uploadedFiles.push({ url: result.secure_url, originalname: businessName });
          } catch (uploadError) {
            console.error(`Failed to upload canvasImage_${i}_${fileIndex}:`, uploadError);
          }
        }
        
        // Set the first uploaded file as the main canvas image, or undefined if none uploaded
        measurement.canvasImageFile = uploadedFiles.length > 0 ? uploadedFiles[0] : undefined;
      } else {
        measurement.canvasImageFile = undefined;
      }
      
      // Upload designReference files to Cloudinary if present
      if (Array.isArray(garment.designs)) {
        // Process all designs in parallel
        const processedDesigns = await Promise.all(garment.designs.map(async (design, d) => {
          const designRefs = [];
          const uploadPromises = [];
          let j = 0;
          
          // Collect all file upload promises for this design
          while (files[`designReference_${i}_${d}_${j}`]) {
            const file = files[`designReference_${i}_${d}_${j}`];
            
            // Check if buffer is valid
            if (!file.buffer || file.buffer.length === 0) {
              console.warn(`Empty buffer for designReference_${i}_${d}_${j}, skipping upload`);
              j++;
              continue;
            }
            
            const fileMimetype = file.mimetype || 'image/png';
            const imageNum = j + 1;
            const businessName = `ORD+${garmentType}+${orderSeq}+${garmentIndex}+REF+${d + 1}+${imageNum}`;
            const folder = `orders/${dateFolder}/${oid}`;
            
            const uploadPromise = new Promise((resolve, reject) => {
              console.log(`Using mimetype: ${fileMimetype} for designReference_${i}_${d}_${j}`);
              
              cloudinary.uploader.upload_stream(
                { 
                  resource_type: 'image', 
                  public_id: businessName.replace(/\+/g, '_'), 
                  folder,
                  format: 'png' // Explicitly set format
                },
                (error, result) => {
                  if (error) {
                    console.error(`Cloudinary upload error for designReference_${i}_${d}_${j}:`, error);
                    reject(error);
                  } else {
                    console.log(`Cloudinary upload success for designReference_${i}_${d}_${j}:`, result);
                    resolve({ url: result.secure_url, originalname: businessName });
                  }
                }
              ).end(file.buffer);
            });
            
            uploadPromises.push(uploadPromise);
            j++;
          }
          
          // Wait for all uploads to complete
          const results = await Promise.all(uploadPromises);
          designRefs.push(...results);
          
          return {
            ...design,
            designReferenceFiles: designRefs
          };
        }));
        
        garment.designs = processedDesigns;
      }
      
      // Voice notes: (optional) you can upload to Cloudinary as resource_type: 'video' or keep in MongoDB
      if (files[`voiceNote_${i}`]) {
        const file = files[`voiceNote_${i}`];
        if (!file.mimetype) file.mimetype = 'audio/mpeg';
        // For now, skip uploading audio to Cloudinary (can be added if needed)
        // measurement.voiceNoteFile = file;
      }
      
      garment.measurement = measurement;
      return garment;
    } catch (garmentError) {
      console.error(`Error processing garment ${i}:`, garmentError);
      // Return the garment without processed files if upload fails
      return {
        ...garment,
        measurement: {
          ...garment.measurement,
          canvasImageFile: undefined
        }
      };
    }
  }));
    
    // Replace garments with processed ones
    garments = processedGarments;

    // 3. Build the order object (do not change structure)
    console.log('[API] Building order object...');
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
    
    console.log('[API] Order object built successfully. Total amount:', totalAmount);

    // 5. Store in MongoDB (as before)
    console.log('[API] Storing order in MongoDB...');
    const insertResult = await db.collection("orders").insertOne(order);
    console.log('[API] Order stored in MongoDB with ID:', insertResult.insertedId);

    // Fetch the inserted order (with _id)
    const savedOrder = await db.collection("orders").findOne({ _id: insertResult.insertedId });
    console.log('[API] Order fetched from MongoDB successfully');

    // --- PDF Generation and Cloudinary Upload (Optimized) ---
    console.log('[API] Starting PDF generation...');
    
    let customerInvoiceUrl = null;
    let tailorInvoiceUrl = null;
    
    try {
      // Generate both PDFs in parallel using the savedOrder
      const pdfPromises = [
        generateSinglePDF('customer', savedOrder),
        generateSinglePDF('tailor', savedOrder)
      ];
      const [customerResult, tailorResult] = await Promise.allSettled(pdfPromises);
      
      let customerPdfData = null;
      let tailorPdfData = null;
      
      if (customerResult.status === 'fulfilled') {
        customerPdfData = customerResult.value;
        customerInvoiceUrl = customerPdfData.url;
        console.log('[API] Customer PDF generated and uploaded:', customerInvoiceUrl);
        console.log('[API] Customer PDF public_id:', customerPdfData.public_id);
      } else {
        console.error('[API] Customer PDF generation failed:', customerResult.reason);
      }
      
      if (tailorResult.status === 'fulfilled') {
        tailorPdfData = tailorResult.value;
        tailorInvoiceUrl = tailorPdfData.url;
        console.log('[API] Tailor PDF generated and uploaded:', tailorInvoiceUrl);
        console.log('[API] Tailor PDF public_id:', tailorPdfData.public_id);
      } else {
        console.error('[API] Tailor PDF generation failed:', tailorResult.reason);
      }
      
      // If either PDF failed, return error and do not send WhatsApp
      if (!customerInvoiceUrl || !tailorInvoiceUrl) {
        return NextResponse.json({
          success: false,
          error: 'PDF generation failed. Please try again or contact support.',
          customerPdf: customerInvoiceUrl,
          tailorPdf: tailorInvoiceUrl
        }, { status: 500 });
      }
      
      // Update order with PDF URLs and metadata
      // Note: Cloudinary URLs are stored for admin access and proxy endpoint fallback
      // WhatsApp messages use proxy endpoint URLs which serve PDFs with proper headers
      const updateData: any = {
        pdfsGenerated: true,
        pdfsGeneratedAt: new Date()
      };
      
      if (customerPdfData) {
        updateData.customerInvoiceUrl = customerPdfData.url;
        updateData.customerInvoicePublicId = customerPdfData.public_id;
        updateData.customerInvoiceAssetId = customerPdfData.asset_id;
      }
      
      if (tailorPdfData) {
        updateData.tailorInvoiceUrl = tailorPdfData.url;
        updateData.tailorInvoicePublicId = tailorPdfData.public_id;
        updateData.tailorInvoiceAssetId = tailorPdfData.asset_id;
      }
      
      await db.collection("orders").updateOne(
        { oid },
        { $set: updateData }
      );
      console.log('[API] Order updated with PDF URLs and metadata');
      console.log('[API] PDF Generation Summary:');
      console.log(`  - Customer PDF: ${customerInvoiceUrl ? '✅ Generated' : '❌ Failed'}`);
      console.log(`  - Tailor PDF: ${tailorInvoiceUrl ? '✅ Generated' : '❌ Failed'}`);
      console.log(`  - Both PDFs ready for WhatsApp: ${customerInvoiceUrl && tailorInvoiceUrl ? '✅ Yes' : '❌ No'}`);
    } catch (pdfError) {
      console.error('[API] PDF generation failed:', pdfError);
      return NextResponse.json({
        success: false,
        error: 'PDF generation failed. Please try again or contact support.'
      }, { status: 500 });
    }
    
    // Fetch updated order
    const updatedOrder = await db.collection("orders").findOne({ _id: savedOrder._id });
    console.log('[API] Updated order fetched successfully');
    
    // --- Automatically send WhatsApp message ---
    try {
      console.log("[API] Attempting to send WhatsApp message...");
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
      // Always use proxy endpoint for WhatsApp - Cloudinary URLs cannot be opened directly in WhatsApp
      const invoiceLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://sonyfashion.in'}/api/proxy-pdf?type=customer&oid=${updatedOrder.oid}`;
      console.log(`[API] WhatsApp invoice link: ${invoiceLink}`);
      console.log(`[API] PDF source: Proxy endpoint (Cloudinary URLs cannot be opened directly in WhatsApp)`);

      // Build garments summary: Only include garments with at least one design
      const validGarments = (updatedOrder.garments || []).filter((g: any) => Array.isArray(g.designs) && g.designs.length > 0);
      const garmentsSummary = validGarments.length > 0 ? validGarments.map((g: any) => {
        const type = g.order?.orderType || g.orderType || '-';
        const variant = g.variant || '-';
        const qty = g.designs.length;
        return `${type} (${variant}) x${qty}`;
      }).join(', ') : '-';

      // Always show advance and due, even if 0
      const advancePaid = `Advance: ₹${updatedOrder.advanceAmount !== undefined ? updatedOrder.advanceAmount : 0}`;
      const amountDue = `Due: ₹${updatedOrder.dueAmount !== undefined ? updatedOrder.dueAmount : 0}`;

      const params = [
        updatedOrder.fullName || "-",
        updatedOrder.oid || "-",
        updatedOrder.orderDate || "-",
        garmentsSummary,
        updatedOrder.totalAmount || "-",
        updatedOrder.deliveryDate
          ? new Date(updatedOrder.deliveryDate).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "-",
        advancePaid,
        amountDue,
        invoiceLink || "-"
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

          console.log('[API] Order processed successfully:', { 
        success: true, 
        oid, 
        orderDate: formattedDate, 
        garmentsCount: garments.length,
        totalAmount,
        processingTime: Date.now() - now.getTime()
      });
      
      // Note: PDFs will be generated on-demand via /api/proxy-pdf endpoint
      // This provides better performance and caching
      
      console.log('[API] Sending success response to client...');
    return NextResponse.json({ success: true, oid, orderDate: formattedDate, order: updatedOrder });
  } catch (error) {
    console.error("Order API error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 