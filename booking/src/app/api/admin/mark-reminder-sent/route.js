import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { markReminderSent } from '@/lib/reminder-helpers';

export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    console.error('Error in mark-reminder-sent:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
