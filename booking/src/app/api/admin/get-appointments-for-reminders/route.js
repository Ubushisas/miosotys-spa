import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAppointmentsNeedingReminders } from '@/lib/reminder-helpers';

export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    console.error('Error in get-appointments-for-reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
