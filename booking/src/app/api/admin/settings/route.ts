import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const settingsPath = path.join(process.cwd(), 'calendar-settings.json')
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    return NextResponse.json(settings)
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
    const settingsPath = path.join(process.cwd(), 'calendar-settings.json')

    // Write the entire settings object to the file
    fs.writeFileSync(settingsPath, JSON.stringify(body, null, 2), 'utf8')

    return NextResponse.json(body)
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
