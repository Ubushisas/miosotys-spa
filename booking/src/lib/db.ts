import { sql } from '@vercel/postgres'

export async function initializeSettingsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS calendar_settings (
        id SERIAL PRIMARY KEY,
        settings JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Check if we have any settings
    const { rows } = await sql`SELECT * FROM calendar_settings LIMIT 1`

    if (rows.length === 0) {
      // Insert default settings from calendar-settings.json
      const defaultSettings = {
        calendarEnabled: true,
        rooms: {
          individual: {
            enabled: true,
            name: 'Sala Individual',
            calendarId: 'c_83f3b9184bb03652fe4f7b9858ba4dc022f6ae195245d233c9b7e3603d64dc9a@group.calendar.google.com',
          },
          principal: {
            enabled: true,
            name: 'Sala Principal',
            calendarId: 'c_388f36cd098bb4f42b02cd43b728000ddb283db209570fc4e80c626a177d1f74@group.calendar.google.com',
          },
        },
        workingHours: {
          monday: { enabled: false, start: '08:00', end: '18:00' },
          tuesday: { enabled: false, start: '08:00', end: '18:00' },
          wednesday: { enabled: true, start: '08:00', end: '18:00' },
          thursday: { enabled: true, start: '08:00', end: '18:00' },
          friday: { enabled: true, start: '08:00', end: '18:00' },
          saturday: { enabled: true, start: '09:00', end: '17:00' },
          sunday: { enabled: true, start: '09:00', end: '17:00' },
        },
        blockedDates: [],
        bufferTime: 30,
        minimumAdvanceBookingHours: 13,
      }

      await sql`
        INSERT INTO calendar_settings (settings)
        VALUES (${JSON.stringify(defaultSettings)})
      `
    }
  } catch (error) {
    console.error('Failed to initialize settings table:', error)
    throw error
  }
}

export async function getSettings() {
  try {
    await initializeSettingsTable()
    const { rows } = await sql`SELECT settings FROM calendar_settings ORDER BY id DESC LIMIT 1`
    return rows[0]?.settings || null
  } catch (error) {
    console.error('Failed to get settings:', error)
    throw error
  }
}

export async function updateSettings(newSettings: any) {
  try {
    await initializeSettingsTable()

    // Get current settings
    const current = await getSettings()
    const updated = { ...current, ...newSettings }

    // Update or insert
    await sql`
      INSERT INTO calendar_settings (settings)
      VALUES (${JSON.stringify(updated)})
    `

    return updated
  } catch (error) {
    console.error('Failed to update settings:', error)
    throw error
  }
}
