import { NextResponse } from 'next/server';
import { registerCalendarWebhook } from '@/lib/calendar';

// Register Google Calendar Push Notifications
// This endpoint should be called once to set up the webhook

export async function POST(request) {
  try {
    // Get the webhook URL from the request or build it from environment
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002');

    const webhookUrl = `${baseUrl}/api/calendar/webhook`;

    console.log('📡 Registering calendar webhook:', webhookUrl);

    // Register the webhook with Google Calendar
    const channels = await registerCalendarWebhook(webhookUrl);

    console.log('✅ Webhook registered successfully:', channels);

    return NextResponse.json({
      success: true,
      message: 'Calendar webhook registered successfully',
      channels,
      webhookUrl,
    });
  } catch (error) {
    console.error('❌ Error registering calendar webhook:', error);
    return NextResponse.json(
      {
        error: 'Failed to register webhook',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Get webhook registration status
export async function GET(request) {
  return NextResponse.json({
    message: 'Use POST to register a new webhook',
    info: {
      description: 'This endpoint registers Google Calendar push notifications',
      note: 'Webhooks expire after some time and need to be re-registered',
    },
  });
}
