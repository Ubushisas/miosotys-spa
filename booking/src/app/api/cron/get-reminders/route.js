import { NextResponse } from 'next/server';
import { getAppointmentsNeedingReminders } from '@/lib/reminder-helpers';

/**
 * GET /api/cron/get-reminders
 *
 * This endpoint is called by the WhatsApp automation bot on DigitalOcean.
 * It uses API key authentication instead of session authentication.
 *
 * Query params:
 * - type: '24h' or '2h'
 *
 * Headers:
 * - x-api-key: The CRON_API_KEY from environment variables
 */
export async function GET(request) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    // Get reminder type from query params
    const { searchParams } = new URL(request.url);
    const reminderType = searchParams.get('type') || '24h';

    // Validate reminder type
    if (!['24h', '2h'].includes(reminderType)) {
      return NextResponse.json(
        { error: 'Invalid reminder type. Must be "24h" or "2h"' },
        { status: 400 }
      );
    }

    // Get appointments needing reminders
    const appointments = await getAppointmentsNeedingReminders(reminderType);

    return NextResponse.json({
      success: true,
      reminderType,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error('Error in cron/get-reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
