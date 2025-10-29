import { NextRequest, NextResponse } from 'next/server'
import { getSettings, updateSettings } from '@/lib/db'

export async function GET() {
  try {
    const settings = await getSettings()

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(settings)
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

    // Update settings in Postgres
    const updated = await updateSettings(body)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
