import { NextResponse } from 'next/server';
import { getUnavailableSlots } from '@/lib/calendar';

export async function POST(request) {
  try {
    const { date, service } = await request.json();

    if (!date || !service) {
      return NextResponse.json(
        { error: 'Missing date or service' },
        { status: 400 }
      );
    }

    // Convert date string to Date object
    const dateObj = new Date(date);

    // Get unavailable slots for this date and service
    const unavailableSlots = await getUnavailableSlots(dateObj, service);

    return NextResponse.json({ unavailableSlots });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
