import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();

    return NextResponse.json({
      enabled: settings?.calendarEnabled ?? true,
      message: settings?.calendarEnabled
        ? null
        : 'El calendario no está disponible en este momento. Por favor intenta más tarde.',
    });
  } catch (error) {
    console.error('Error getting calendar status:', error);
    return NextResponse.json(
      { enabled: true }, // Default to enabled if settings not found
      { status: 200 }
    );
  }
}
