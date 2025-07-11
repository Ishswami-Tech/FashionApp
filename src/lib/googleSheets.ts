import { google } from "googleapis";

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// Define the header row (update as needed to match your summary row structure)
const SHEET_HEADER_ROW = [
  'Order ID', 'Name', 'Email', 'Contact', 'Delivery Date', 'Delivery Method', 'Budget', 'Payment', 'Special Instructions',
  // Garment 1
  'Garment1 Gender', 'Garment1 Type', 'Garment1 Urgency', 'Garment1 Quantity', 'Garment1 Design Description', 'Garment1 Canvas Image Link', 'Garment1 Design Reference Links', 'Garment1 Voice Note Link',
  'Garment1 Waist', 'Garment1 Hip', 'Garment1 Seat Width', 'Garment1 Seat Length', 'Garment1 Thigh', 'Garment1 Knee Round', 'Garment1 Calf Round', 'Garment1 Bottom Round', 'Garment1 Ankle Round', 'Garment1 Inseam', 'Garment1 Outseam', 'Garment1 Rise Front', 'Garment1 Rise Back', 'Garment1 Pant Length', 'Garment1 Crotch Depth', 'Garment1 Seat Depth', 'Garment1 Leg Opening', 'Garment1 Waist Band', 'Garment1 Belt Loop Spacing', 'Garment1 Pocket Depth', 'Garment1 Pocket Width', 'Garment1 Pocket Position', 'Garment1 Knee Position', 'Garment1 Crotch Point', 'Garment1 Alteration Allowance',
  // Garment 2
  'Garment2 Gender', 'Garment2 Type', 'Garment2 Urgency', 'Garment2 Quantity', 'Garment2 Design Description', 'Garment2 Canvas Image Link', 'Garment2 Design Reference Links', 'Garment2 Voice Note Link',
  'Garment2 Waist', 'Garment2 Hip', 'Garment2 Seat Width', 'Garment2 Seat Length', 'Garment2 Thigh', 'Garment2 Knee Round', 'Garment2 Calf Round', 'Garment2 Bottom Round', 'Garment2 Ankle Round', 'Garment2 Inseam', 'Garment2 Outseam', 'Garment2 Rise Front', 'Garment2 Rise Back', 'Garment2 Pant Length', 'Garment2 Crotch Depth', 'Garment2 Seat Depth', 'Garment2 Leg Opening', 'Garment2 Waist Band', 'Garment2 Belt Loop Spacing', 'Garment2 Pocket Depth', 'Garment2 Pocket Width', 'Garment2 Pocket Position', 'Garment2 Knee Position', 'Garment2 Crotch Point', 'Garment2 Alteration Allowance',
  // Garment 3
  'Garment3 Gender', 'Garment3 Type', 'Garment3 Urgency', 'Garment3 Quantity', 'Garment3 Design Description', 'Garment3 Canvas Image Link', 'Garment3 Design Reference Links', 'Garment3 Voice Note Link',
  'Garment3 Waist', 'Garment3 Hip', 'Garment3 Seat Width', 'Garment3 Seat Length', 'Garment3 Thigh', 'Garment3 Knee Round', 'Garment3 Calf Round', 'Garment3 Bottom Round', 'Garment3 Ankle Round', 'Garment3 Inseam', 'Garment3 Outseam', 'Garment3 Rise Front', 'Garment3 Rise Back', 'Garment3 Pant Length', 'Garment3 Crotch Depth', 'Garment3 Seat Depth', 'Garment3 Leg Opening', 'Garment3 Waist Band', 'Garment3 Belt Loop Spacing', 'Garment3 Pocket Depth', 'Garment3 Pocket Width', 'Garment3 Pocket Position', 'Garment3 Knee Position', 'Garment3 Crotch Point', 'Garment3 Alteration Allowance',
  'Date'
];

export async function appendOrderToSheet(row: any[]) {
  // Check if the sheet is empty (no data)
  const getRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A1:A1",
  });
  const isEmpty = !getRes.data.values || getRes.data.values.length === 0;
  if (isEmpty) {
    // Insert header row first
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1",
      valueInputOption: "RAW",
      requestBody: { values: [SHEET_HEADER_ROW] },
    });
  }
  // Now append the data row
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Sheet1",
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}
