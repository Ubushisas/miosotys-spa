import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const settings = await prisma.calendarSettings.findFirst();

    if (!settings) {
      // Return default settings if none exist in database
      return NextResponse.json({
        calendarEnabled: true,
        bufferTime: 30,
        minimumAdvanceBookingHours: 13,
        rooms: {
          individual: {
            enabled: true,
            name: 'Sala Individual',
            calendarId: '44b404aad9e13f877c9af362787bf2a0212fbcad1a073bfa3439392167bd0c5f@group.calendar.google.com',
          },
          principal: {
            enabled: true,
            name: 'Sala Principal',
            calendarId: '5f7b7d0630cdbfe75c87101e63c334ccc2a875971b4c26d4a39003210b5bf393@group.calendar.google.com',
          },
        },
        workingHours: {
          monday: { enabled: true, start: '08:00', end: '18:00' },
          tuesday: { enabled: true, start: '08:00', end: '18:00' },
          wednesday: { enabled: true, start: '08:00', end: '18:00' },
          thursday: { enabled: true, start: '08:00', end: '18:00' },
          friday: { enabled: true, start: '08:00', end: '18:00' },
          saturday: { enabled: true, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' },
        },
        blockedDates: [],
        services: {},
      });
    }

    return NextResponse.json({
      calendarEnabled: settings.calendarEnabled,
      bufferTime: settings.bufferTime,
      minimumAdvanceBookingHours: settings.minimumAdvanceBookingHours,
      rooms: settings.rooms,
      services: settings.services,
      workingHours: settings.workingHours,
      blockedDates: settings.blockedDates,
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}
