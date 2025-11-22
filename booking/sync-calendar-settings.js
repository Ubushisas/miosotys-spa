// Script to sync calendar-settings.json to database
// Run with: node sync-calendar-settings.js

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function syncSettings() {
  try {
    console.log('🔄 Starting calendar settings sync...\n');

    // Read calendar-settings.json
    const settingsPath = path.join(__dirname, 'calendar-settings.json');
    const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    console.log('📖 Loaded settings from calendar-settings.json');

    // Check if settings exist in database
    const existingSettings = await prisma.calendarSettings.findFirst();

    if (existingSettings) {
      // Update existing settings
      await prisma.calendarSettings.update({
        where: { id: existingSettings.id },
        data: {
          calendarEnabled: settingsData.calendarEnabled,
          bufferTime: settingsData.bufferTime,
          minimumAdvanceBookingHours: settingsData.minimumAdvanceBookingHours,
          rooms: settingsData.rooms,
          services: settingsData.services,
          workingHours: settingsData.workingHours,
          blockedDates: settingsData.blockedDates,
        }
      });
      console.log('✅ Updated existing calendar settings in database');
    } else {
      // Create new settings
      await prisma.calendarSettings.create({
        data: {
          calendarEnabled: settingsData.calendarEnabled,
          bufferTime: settingsData.bufferTime,
          minimumAdvanceBookingHours: settingsData.minimumAdvanceBookingHours,
          rooms: settingsData.rooms,
          services: settingsData.services,
          workingHours: settingsData.workingHours,
          blockedDates: settingsData.blockedDates,
        }
      });
      console.log('✅ Created new calendar settings in database');
    }

    // Display services count
    const serviceCategories = Object.keys(settingsData.services);
    console.log('\n📊 Services synced by category:');
    for (const category of serviceCategories) {
      const count = settingsData.services[category].length;
      console.log(`   ${category}: ${count} services`);

      // Show familia services specifically
      if (category === 'familia') {
        settingsData.services[category].forEach(service => {
          console.log(`      - ${service.name} (${service.id})`);
        });
      }
    }

    console.log('\n✅ Calendar settings synchronized successfully!');

  } catch (error) {
    console.error('❌ Error syncing settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncSettings();
