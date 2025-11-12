import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import calendarSettings from '../../../../../calendar-settings.json';

export async function POST(request) {
  try {
    // Simple auth check - you can enhance this
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.ADMIN_SECRET || 'sync-secret-2025';

    if (authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Syncing settings to production database...');

    // Update or create settings
    const existingSettings = await prisma.calendarSettings.findFirst();

    if (existingSettings) {
      console.log('📝 Updating existing settings...');
      await prisma.calendarSettings.update({
        where: { id: existingSettings.id },
        data: {
          calendarEnabled: calendarSettings.calendarEnabled,
          rooms: calendarSettings.rooms,
          services: calendarSettings.services,
        },
      });
    } else {
      console.log('✨ Creating new settings...');
      await prisma.calendarSettings.create({
        data: {
          calendarEnabled: calendarSettings.calendarEnabled,
          bufferTime: 30,
          minimumAdvanceBookingHours: 13,
          rooms: calendarSettings.rooms,
          services: calendarSettings.services,
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
        },
      });
    }

    console.log('✅ Settings synced successfully!');

    const serviceCount = Object.keys(calendarSettings.services).reduce((acc, category) => {
      acc[category] = calendarSettings.services[category].length;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      message: 'Settings synced successfully',
      serviceCount,
    });

  } catch (error) {
    console.error('❌ Error syncing settings:', error);
    return NextResponse.json({
      error: 'Failed to sync settings',
      details: error.message
    }, { status: 500 });
  }
}
