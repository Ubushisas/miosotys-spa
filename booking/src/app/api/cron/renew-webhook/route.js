import { NextResponse } from 'next/server';
import { registerCalendarWebhook } from '@/lib/calendar';

// Auto-renew Google Calendar webhook
// This runs automatically every 2 months via Vercel Cron

export async function GET(request) {
  try {
    // Verify this is coming from Vercel Cron (security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Auto-renewing calendar webhook...');

    // Get the webhook URL
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002');

    const webhookUrl = `${baseUrl}/api/calendar/webhook`;

    // Register the webhook
    const channels = await registerCalendarWebhook(webhookUrl);

    console.log('✅ Webhook auto-renewed successfully');

    return NextResponse.json({
      success: true,
      message: 'Webhook auto-renewed',
      timestamp: new Date().toISOString(),
      channels,
      webhookUrl,
    });
  } catch (error) {
    console.error('❌ Error auto-renewing webhook:', error);
    return NextResponse.json(
      {
        error: 'Failed to auto-renew webhook',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
