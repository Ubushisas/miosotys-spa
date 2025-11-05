import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error('Failed to fetch patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, notes } = body

    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
        notes,
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('Failed to create patient:', error)
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}
