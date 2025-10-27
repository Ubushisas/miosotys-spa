import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const settingsPath = path.join(process.cwd(), 'calendar-settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}
