import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst()

    if (!settings) {
      // Return default settings
      return NextResponse.json({
        bufferTime: 15,
        calendarEnabled: true,
        workingHours: JSON.stringify({
          mon: { start: '09:00', end: '18:00' },
          tue: { start: '09:00', end: '18:00' },
          wed: { start: '09:00', end: '18:00' },
          thu: { start: '09:00', end: '18:00' },
          fri: { start: '09:00', end: '18:00' },
          sat: { start: '10:00', end: '16:00' },
          sun: { start: 'closed', end: 'closed' },
        }),
      })
    }

    return NextResponse.json({
      ...settings,
      workingHours: JSON.parse(settings.workingHours),
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
    const { bufferTime, calendarEnabled, workingHours } = body

    const existingSettings = await prisma.settings.findFirst()

    if (existingSettings) {
      const updated = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          bufferTime,
          calendarEnabled,
          workingHours: JSON.stringify(workingHours),
        },
      })

      return NextResponse.json(updated)
    } else {
      // Create initial settings with default password
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_DEFAULT_PASSWORD || 'miosotys2025',
        10
      )

      const created = await prisma.settings.create({
        data: {
          bufferTime,
          calendarEnabled,
          workingHours: JSON.stringify(workingHours),
          adminPassword: hashedPassword,
        },
      })

      return NextResponse.json(created)
    }
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
