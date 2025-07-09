import { google } from "googleapis";

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

export async function appendOrderToSheet(row: any[]) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Sheet1",
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}
