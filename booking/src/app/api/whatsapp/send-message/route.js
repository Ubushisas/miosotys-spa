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

    // Twilio credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!accountSid || !authToken || !messagingServiceSid) {
      console.error('Twilio credentials not configured');
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 500 }
      );
    }

    // Format phone number for Colombia (ensure it starts with +57)
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.startsWith('57')) {
      formattedPhone = '+' + formattedPhone;
    } else if (formattedPhone.length === 10) {
      formattedPhone = '+57' + formattedPhone;
    } else {
      formattedPhone = '+' + formattedPhone;
    }

    // Send SMS using Messaging Service (better deliverability)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const twilioAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const messageType = 'sms';

    // Send SMS via Twilio Messaging Service
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        MessagingServiceSid: messagingServiceSid,
        To: formattedPhone,
        Body: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);

      // Save failed message to sheet
      try {
        await saveMessageToSheet({
          phoneNumber: formattedPhone,
          direction: 'outbound-api',
          body: message,
          status: 'failed',
          messageType: messageType,
          twilioSid: data.sid || '',
          errorMessage: data.message || 'Unknown error',
        });
      } catch (sheetError) {
        console.error('Error saving to sheet (non-critical):', sheetError.message);
      }

      return NextResponse.json(
        { error: data.message || 'Failed to send message' },
        { status: response.status }
      );
    }

    // Save successful message to sheet
    try {
      await saveMessageToSheet({
        phoneNumber: formattedPhone,
        direction: 'outbound-api',
        body: message,
        status: data.status,
        messageType: messageType,
        twilioSid: data.sid,
        errorMessage: '',
      });
    } catch (sheetError) {
      console.error('Error saving to sheet (non-critical):', sheetError.message);
    }

    return NextResponse.json({
      success: true,
      messageType: messageType,
      sid: data.sid,
      status: data.status,
    });

  } catch (error) {
    console.error('Error in send-message API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
