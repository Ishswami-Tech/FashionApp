import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { to, params } = await req.json();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!to || !params || params.length !== 7) {
    return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
  }
  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ error: 'WhatsApp API credentials not set' }, { status: 500 });
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'order_confirmation_invoice', // your template name
      language: { code: 'en_US' }, // or your template's language code
      components: [
        {
          type: 'body',
          parameters: params.map((text: string) => ({ type: 'text', text }))
        }
      ]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 