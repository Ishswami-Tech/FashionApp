import { NextRequest, NextResponse } from "next/server";
import { generatePdf } from '@/lib/pdf';

export async function GET(req: NextRequest) {
  try {
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test PDF</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <h1>PDF Generation Test</h1>
        <p>This is a test PDF to verify that PDF generation is working correctly.</p>
        <p>If you can see this PDF, the setup is working!</p>
        <p>Generated at: ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `;

    const pdfBuffer = await generatePdf(testHtml);

    if (!pdfBuffer) {
      return new NextResponse("Failed to generate PDF", { status: 500 });
    }

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"test.pdf\"",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF test failed:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "PDF generation failed", 
        details: error instanceof Error ? error.message : String(error) 
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
} 