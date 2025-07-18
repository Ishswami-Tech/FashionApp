import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function generatePdf(html: string) {
  let executablePath;
  try {
    executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: "shell", // Use 'shell' for serverless environments
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();
    return pdfBuffer;
  } catch (err: any) {
    const msg =
      `Failed to launch Chromium/Chrome for PDF generation.\n` +
      `Attempted executablePath: ${executablePath}\n` +
      `Error: ${err?.message || err}\n` +
      `\n` +
      `If on Windows (local), set PUPPETEER_EXECUTABLE_PATH to your Chrome/Chromium executable.\n` +
      `On Vercel, no env var is needed.\n` +
      `See https://pptr.dev/troubleshooting and https://github.com/sparticuz/chromium for more info.`;
    throw new Error(msg);
  }
} 