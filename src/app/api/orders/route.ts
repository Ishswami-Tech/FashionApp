// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import path from "path";
import { google } from "googleapis";
import Busboy from "busboy";
import { Readable } from "stream";
import cloudinary from '@/lib/cloudinary';

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
  return `${yyyy}-${mm}-${dd}-${seq}`;
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
      const designRefs = [];
      let j = 0;
      while (files[`designReference_${i}_${j}`]) {
        const file = files[`designReference_${i}_${j}`];
        console.log(`Uploading designReference for garment ${i}, ref ${j}:`, file);
        if (!file.mimetype) file.mimetype = 'image/png';
        const imageNum = j + 1;
        const businessName = `ORD+${garmentType}+${orderSeq}+${garmentIndex}+REF+${imageNum}`;
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
        console.log('Cloudinary designReference upload result:', result);
        designRefs.push({ url: result.secure_url, originalname: businessName });
        j++;
      }
      measurement.designReferenceFiles = designRefs;
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
    const order = {
      ...customer,
      ...delivery,
      garments,
      oid,
      orderDate: formattedDate,
      createdAt: now,
    };
    console.log('Final order to be saved in MongoDB:', order); // LOG final order

    // 5. Store in MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "fashionapp");
    await db.collection("orders").insertOne(order);

    return NextResponse.json({ success: true, oid, orderDate: formattedDate });
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
} 