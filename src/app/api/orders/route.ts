import { NextRequest, NextResponse } from "next/server";
import formidable, { File } from "formidable";
import { uploadToDrive } from "@/lib/googleDrive";
import clientPromise from "@/lib/mongodb";
import { appendOrderToSheet } from "@/lib/googleSheets";
import path from "path";
import { google } from "googleapis";

export const config = {
  api: {
    bodyParser: false,
  },
};

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// In-memory order sequence tracking (resets on server restart)
const orderSequence: { [date: string]: number } = {};

function getTodayOrderId(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const key = `${dd}${mm}${yyyy}`;
  if (!orderSequence[key]) orderSequence[key] = 1;
  else orderSequence[key]++;
  const seq = String(orderSequence[key]).padStart(3, '0');
  return `ORD-${dd}${mm}${yyyy}-${seq}`;
}

async function ensureDriveFolderStructure(baseFolderId: string, date: Date, oid: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const drive = google.drive({ version: "v3", auth });
  // 1. YYYY-MM
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const monthName = `${yyyy}-${mm}`;
  // 2. DD
  const dd = String(date.getDate()).padStart(2, '0');
  // Helper to find or create folder
  async function getOrCreateFolder(name: string, parent: string) {
    const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false`;
    const res = await drive.files.list({ q, fields: "files(id,name)" });
    if (res.data.files && res.data.files.length > 0) return res.data.files[0].id!;
    const folder = await drive.files.create({
      requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parent] },
      fields: "id"
    });
    return folder.data.id!;
  }
  const monthFolderId = await getOrCreateFolder(monthName, baseFolderId);
  const dayFolderId = await getOrCreateFolder(dd, monthFolderId);
  const orderFolderId = await getOrCreateFolder(oid, dayFolderId);
  return orderFolderId;
}

async function parseForm(req: any) {
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function isFormidableFile(file: any): file is { buffer: Buffer; originalname: string; mimetype: string } {
  return file && file.buffer && file.originalname && file.mimetype;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse form data
    // @ts-ignore
    const { fields, files } = await parseForm(req);
    const now = new Date();
    const formattedDate = formatDate(now);
    const oid = getTodayOrderId(now);

    // 2. Create Drive folder structure
    const orderFolderId = await ensureDriveFolderStructure(DRIVE_FOLDER_ID, now, oid);

    // 3. Upload files to Google Drive and collect URLs
    const fileLinks: Record<string, any> = {};
    for (const [key, file] of Object.entries(files)) {
      if (Array.isArray(file)) {
        fileLinks[key] = [];
        for (const f of file) {
          if (isFormidableFile(f)) {
            const uploaded = await uploadToDrive(f, orderFolderId);
            fileLinks[key].push(uploaded.webViewLink);
          }
        }
      } else {
        if (isFormidableFile(file)) {
          const uploaded = await uploadToDrive(file, orderFolderId);
          fileLinks[key] = uploaded.webViewLink;
        }
      }
    }

    // 4. Prepare order object for MongoDB
    const order = {
      ...fields,
      ...fileLinks,
      oid,
      orderDate: formattedDate,
      createdAt: now,
    };

    // 5. Store in MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "fashionapp");
    const result = await db.collection("orders").insertOne(order);

    // 6. Prepare summary row for Google Sheets
    const summaryRow = [
      oid,
      order.fullName,
      order.email,
      order.garments ? JSON.stringify(order.garments) : "",
      order.orderDate,
      order.budgetAmount,
      order.payment,
      order.specialInstructions,
      fileLinks.designReference ? JSON.stringify(fileLinks.designReference) : "",
      fileLinks.canvasImage || "",
      fileLinks.voiceNote || "",
      formattedDate,
    ];
    await appendOrderToSheet(summaryRow);

    return NextResponse.json({ success: true, oid, orderDate: formattedDate });
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
} 