import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { to, params } = await req.json();

  // WhatsApp API endpoint and token
  const url = "https://graph.facebook.com/v22.0/703783789484730/messages";
  const token = process.env.WHATSAPP_TOKEN;

  // Build template payload (no image)
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "order_invoice",
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: params.map((text: string) => ({ type: "text", text })),
        },
      ],
    },
  };

  // Call WhatsApp API
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
} 