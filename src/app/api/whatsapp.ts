import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { to, mediaUrl, mediaType } = await req.json();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!to || !mediaUrl || !mediaType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ error: 'WhatsApp API credentials not set' }, { status: 500 });
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: mediaType,
    [mediaType]: {
      link: mediaUrl,
      caption: 'Thank you for your order! Here is your invoice from Sony Fashion.'
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