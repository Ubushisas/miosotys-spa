import { NextResponse } from 'next/server';
import { saveMessageToSheet } from '@/lib/google-sheets';

export async function POST(request) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // WhatsApp Business API credentials
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.error('WhatsApp credentials not configured');
      return NextResponse.json(
        { error: 'WhatsApp not configured' },
        { status: 500 }
      );
    }

    // Send message via WhatsApp Business API
    // Note: In test mode, we can only use approved templates
    // For now using hello_world template until custom template is approved
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber.replace('+', ''), // Remove + from phone number
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'en_US'
            }
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);

      // Log failed message to sheet
      await saveMessageToSheet({
        phoneNumber,
        direction: 'outbound-api',
        body: message,
        status: 'failed',
        messageType: 'Confirmación',
        errorMessage: data.error?.message || 'Unknown error',
      });

      return NextResponse.json(
        { error: 'Failed to send WhatsApp message', details: data },
        { status: response.status }
      );
    }

    // Log successful message to sheet
    await saveMessageToSheet({
      phoneNumber,
      direction: 'outbound-api',
      body: message,
      status: 'sent',
      messageType: 'Confirmación',
      twilioSid: data.messages?.[0]?.id || '',
    });

    return NextResponse.json({
      success: true,
      messageId: data.messages?.[0]?.id,
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
