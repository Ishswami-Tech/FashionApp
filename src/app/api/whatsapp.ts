import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { to, params } = await req.json();

  // WhatsApp API endpoint and token
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "703783789484730";
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  // Build template payload (no image)
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "order_invoice",
      language: { code: "en" }, // Changed from en_US to en
      components: [
        {
          type: "body",
          parameters: params.map((text: string) => ({ type: "text", text })),
        },
      ],
    },
  };

  // Validate token
  if (!token) {
    console.error("WHATSAPP_ACCESS_TOKEN not found in environment variables");
    return NextResponse.json(
      { error: "WhatsApp token not configured" },
      { status: 500 }
    );
  }

  // Call WhatsApp API
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return NextResponse.json(
        { error: `WhatsApp API error: ${data.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    console.log("WhatsApp message sent successfully:", data);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Failed to send WhatsApp message:", error);
    return NextResponse.json(
      { error: `Failed to send WhatsApp message: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 