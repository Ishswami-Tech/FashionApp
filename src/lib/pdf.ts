import puppeteer from "puppeteer";

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfUint8Array = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  // Ensure we return a Node.js Buffer
  return Buffer.from(pdfUint8Array);
} 