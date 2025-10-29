import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    // Clean phone number (remove spaces, dashes, etc)
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    // WhatsApp API endpoint
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: message,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', data)
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message', details: data },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: data.messages?.[0]?.id,
      data,
    })
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
