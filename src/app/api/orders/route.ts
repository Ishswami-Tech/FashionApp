import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const SHEET_ID = '1Atojz1POy5FQRQrJGuw7tyqRoAN3Hk9Se53PkMGI3Zg';
const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'google-service-account.json');
const ORDERS_JSON_PATH = path.resolve(process.cwd(), 'orders.json');

// In-memory order sequence tracking (resets on server restart)
const orderSequence: { [date: string]: number } = {};

function getTodayOrderId(): string {
  const now = new Date();
  const yymmdd = now
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, '');
  if (!orderSequence[yymmdd]) orderSequence[yymmdd] = 1;
  else orderSequence[yymmdd]++;
  const seq = String(orderSequence[yymmdd]).padStart(3, '0');
  return `ORD-${yymmdd}-${seq}`;
}

function flattenOrder(order: any, orderId: string) {
  // Flatten nested objects for Google Sheets row
  const flat = {
    orderId,
    ...order.customer,
    ...order.order,
    ...order.measurement,
    ...order.delivery,
    timestamp: new Date().toISOString(),
  };
  // Convert any object/array value to a string
  Object.keys(flat).forEach((key) => {
    const val = flat[key];
    if (typeof val === 'object' && val !== null) {
      flat[key] = Array.isArray(val) ? JSON.stringify(val) : JSON.stringify(val);
    }
  });
  return flat;
}

export async function POST(req: NextRequest) {
  try {
    const order = await req.json();
    const orderId = getTodayOrderId();
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare data for Google Sheets
    const flatOrder = flattenOrder(order, orderId);
    const values = [Object.values(flatOrder)];

    // If this is the first row, add headers
    const sheetMeta = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:Z1',
    });
    let appendRange = 'Sheet1';
    if (!sheetMeta.data.values || sheetMeta.data.values.length === 0) {
      // Add headers
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: appendRange,
        valueInputOption: 'RAW',
        requestBody: { values: [Object.keys(flatOrder)] },
      });
    }

    // Append the order row to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: appendRange,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    // Also append to orders.json
    let orders: any[] = [];
    if (fs.existsSync(ORDERS_JSON_PATH)) {
      const raw = fs.readFileSync(ORDERS_JSON_PATH, 'utf-8');
      try {
        orders = JSON.parse(raw);
        if (!Array.isArray(orders)) orders = [];
      } catch {
        orders = [];
      }
    }
    orders.push({ ...order, orderId });
    fs.writeFileSync(ORDERS_JSON_PATH, JSON.stringify(orders, null, 2));

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error('Google Sheets API error:', error);
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
} 