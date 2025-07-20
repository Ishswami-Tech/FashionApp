import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function generatePdf(html: string) {
  let executablePath;
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if we're in development and have a local Chrome path
      const isDevelopment = process.env.NODE_ENV === 'development';
      const localChromePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      
      if (isDevelopment && localChromePath) {
        // Use local Chrome in development
        executablePath = localChromePath;
      } else {
        // Use Chromium in production
        executablePath = await chromium.executablePath();
      }
      
      // Add a small delay between retries to allow file locks to clear
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath,
        headless: isDevelopment ? true : "shell", // Use true for local development
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });
      await browser.close();
      return pdfBuffer;
      
    } catch (err: any) {
      lastError = err;
      
      // If it's not an ETXTBSY error or we've exhausted retries, throw immediately
      if (!err.message?.includes('ETXTBSY') || attempt === maxRetries) {
        const msg =
          `Failed to launch Chromium/Chrome for PDF generation after ${attempt} attempts.\n` +
          `Attempted executablePath: ${executablePath}\n` +
          `Error: ${err?.message || err}\n` +
          `\n` +
          `If on Windows (local), set PUPPETEER_EXECUTABLE_PATH to your Chrome/Chromium executable.\n` +
          `On Vercel, this may be a cold start issue. Try again or check https://github.com/sparticuz/chromium for updates.\n` +
          `See https://pptr.dev/troubleshooting and https://github.com/sparticuz/chromium for more info.`;
        throw new Error(msg);
      }
      
      // For ETXTBSY errors, continue to next retry
      console.log(`PDF generation attempt ${attempt} failed with ETXTBSY, retrying...`);
    }
  }
} 