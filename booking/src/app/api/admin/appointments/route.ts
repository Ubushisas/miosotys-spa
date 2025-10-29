import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: true,
        service: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Failed to fetch appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, serviceId, startTime, notes } = body

    // Get service to calculate end time
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const start = new Date(startTime)
    const end = new Date(start.getTime() + service.duration * 60000)

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        serviceId,
        startTime: start,
        endTime: end,
        notes,
        status: 'scheduled',
      },
      include: {
        patient: true,
        service: true,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Failed to create appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
