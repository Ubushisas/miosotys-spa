import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Return basic stats without database
    // In the future, you can connect to Google Calendar API to get real stats
    return NextResponse.json({
      totalPatients: 0,
      todayAppointments: 0,
      weekRevenue: 0,
      monthGrowth: 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
