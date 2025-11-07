import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    let settings = await prisma.calendarSettings.findFirst()

    // If no settings in database, try to load from JSON file as fallback
    if (!settings) {
      try {
        const settingsPath = path.join(process.cwd(), 'calendar-settings.json')
        const fileSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))

        // Save to database for future use
        settings = await prisma.calendarSettings.create({
          data: {
            calendarEnabled: fileSettings.calendarEnabled ?? true,
            bufferTime: fileSettings.bufferTime ?? 30,
            minimumAdvanceBookingHours: fileSettings.minimumAdvanceBookingHours ?? 13,
            rooms: fileSettings.rooms,
            services: fileSettings.services,
            workingHours: fileSettings.workingHours,
            blockedDates: fileSettings.blockedDates ?? [],
          }
        })
      } catch (fileError) {
        // Return default settings if file also doesn't exist
        return NextResponse.json({
          calendarEnabled: true,
          bufferTime: 30,
          minimumAdvanceBookingHours: 13,
          rooms: {},
          services: {},
          workingHours: {},
          blockedDates: [],
        })
      }
    }

    return NextResponse.json({
      calendarEnabled: settings.calendarEnabled,
      bufferTime: settings.bufferTime,
      minimumAdvanceBookingHours: settings.minimumAdvanceBookingHours,
      rooms: settings.rooms,
      services: settings.services,
      workingHours: settings.workingHours,
      blockedDates: settings.blockedDates,
    })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    let settings = await prisma.calendarSettings.findFirst()

    if (settings) {
      settings = await prisma.calendarSettings.update({
        where: { id: settings.id },
        data: {
          calendarEnabled: body.calendarEnabled,
          bufferTime: body.bufferTime,
          minimumAdvanceBookingHours: body.minimumAdvanceBookingHours,
          rooms: body.rooms,
          services: body.services,
          workingHours: body.workingHours,
          blockedDates: body.blockedDates,
        }
      })
    } else {
      settings = await prisma.calendarSettings.create({
        data: {
          calendarEnabled: body.calendarEnabled ?? true,
          bufferTime: body.bufferTime ?? 30,
          minimumAdvanceBookingHours: body.minimumAdvanceBookingHours ?? 13,
          rooms: body.rooms,
          services: body.services,
          workingHours: body.workingHours,
          blockedDates: body.blockedDates ?? [],
        }
      })
    }

    return NextResponse.json({
      calendarEnabled: settings.calendarEnabled,
      bufferTime: settings.bufferTime,
      minimumAdvanceBookingHours: settings.minimumAdvanceBookingHours,
      rooms: settings.rooms,
      services: settings.services,
      workingHours: settings.workingHours,
      blockedDates: settings.blockedDates,
    })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
