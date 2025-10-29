import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/calendar-settings';

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const newSettings = await request.json();
    const updated = updateSettings(newSettings);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
