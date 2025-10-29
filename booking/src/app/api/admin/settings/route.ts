import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'calendar-settings.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(SETTINGS_FILE, 'utf-8')
    const settings = JSON.parse(fileContent)

    return NextResponse.json({
      bufferTime: settings.bufferTime || 30,
      minimumAdvanceBookingHours: settings.minimumAdvanceBookingHours || 13,
      calendarEnabled: settings.calendarEnabled ?? true,
      workingHours: settings.workingHours || {},
      rooms: settings.rooms || {},
      services: settings.services || {},
      blockedDates: settings.blockedDates || [],
    })
  } catch (error) {
    console.error('Failed to read settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Read current settings
    const fileContent = await fs.readFile(SETTINGS_FILE, 'utf-8')
    const currentSettings = JSON.parse(fileContent)

    // Merge with new data
    const updatedSettings = {
      ...currentSettings,
      ...body,
    }

    // Write back to file
    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(updatedSettings, null, 2),
      'utf-8'
    )

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
