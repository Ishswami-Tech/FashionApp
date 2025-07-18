import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function generatePdf(html: string) {
  let executablePath;
  try {
    // Use only chromium.executablePath() on Vercel, env var locally
    if (process.env.VERCEL) {
      executablePath = await chromium.executablePath();
    } else {
      executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || await chromium.executablePath();
    }
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
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
      `To fix this on Windows, install Chrome or Chromium and set the environment variable PUPPETEER_EXECUTABLE_PATH to the path of your Chrome/Chromium executable.\n` +
      `Example: PUPPETEER_EXECUTABLE_PATH=\"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\"\n` +
      `See https://pptr.dev/troubleshooting for more info.`;
    throw new Error(msg);
  }
} 