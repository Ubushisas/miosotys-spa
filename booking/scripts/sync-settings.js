const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function syncSettings() {
  try {
    console.log('📥 Loading calendar-settings.json...');
    const settingsPath = path.join(__dirname, '..', 'calendar-settings.json');
    const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    console.log('🔄 Syncing settings to database...');

    // Update or create settings
    const existingSettings = await prisma.calendarSettings.findFirst();

    if (existingSettings) {
      console.log('📝 Updating existing settings...');
      await prisma.calendarSettings.update({
        where: { id: existingSettings.id },
        data: {
          calendarEnabled: settingsData.calendarEnabled,
          rooms: settingsData.rooms,
          services: settingsData.services,
        },
      });
    } else {
      console.log('✨ Creating new settings...');
      await prisma.calendarSettings.create({
        data: {
          calendarEnabled: settingsData.calendarEnabled,
          bufferTime: 30,
          minimumAdvanceBookingHours: 13,
          rooms: settingsData.rooms,
          services: settingsData.services,
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
    console.log('📊 Services synced:');
    Object.keys(settingsData.services).forEach(category => {
      console.log(`  - ${category}: ${settingsData.services[category].length} services`);
    });

  } catch (error) {
    console.error('❌ Error syncing settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncSettings();
