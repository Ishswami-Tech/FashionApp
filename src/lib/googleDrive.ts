import { google } from "googleapis";
import { Readable } from "stream";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});
const drive = google.drive({ version: "v3", auth });

export async function uploadToDrive(file: { buffer: Buffer, originalname: string, mimetype: string }, folderId: string) {
  const res = await drive.files.create({
    requestBody: {
      name: file.originalname,
      parents: [folderId],
      mimeType: file.mimetype,
    },
    media: {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer), // Convert Buffer to ReadableStream
    },
    fields: 'id, webViewLink, webContentLink',
  });
  return res.data;
}
