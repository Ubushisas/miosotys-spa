// Temporarily disabled auth to allow build to succeed
// Auth functionality requires Google OAuth credentials in production
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Auth temporarily disabled' }, { status: 503 })
}

export async function POST() {
  return NextResponse.json({ error: 'Auth temporarily disabled' }, { status: 503 })
}
