import { NextResponse } from 'next/server';
import { markReminderSent } from '@/lib/reminder-helpers';

/**
 * POST /api/cron/mark-reminder-sent
 *
 * This endpoint is called by the WhatsApp automation bot on DigitalOcean
 * after successfully sending a reminder message.
 * It uses API key authentication instead of session authentication.
 *
 * Headers:
 * - x-api-key: The CRON_API_KEY from environment variables
 *
 * Body:
 * - rowIndex: The row number in Google Sheets (1-indexed)
 * - reminderType: '24h' or '2h'
 */
export async function POST(request) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    // Get data from request body
    const body = await request.json();
    const { rowIndex, reminderType } = body;

    // Validate input
    if (!rowIndex || typeof rowIndex !== 'number') {
      return NextResponse.json(
        { error: 'Invalid rowIndex. Must be a number' },
        { status: 400 }
      );
    }

    if (!['24h', '2h'].includes(reminderType)) {
      return NextResponse.json(
        { error: 'Invalid reminder type. Must be "24h" or "2h"' },
        { status: 400 }
      );
    }

    // Mark reminder as sent
    await markReminderSent(rowIndex, reminderType);

    return NextResponse.json({
      success: true,
      message: `Reminder marked as sent for row ${rowIndex}`,
    });
  } catch (error) {
    console.error('Error in cron/mark-reminder-sent:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
