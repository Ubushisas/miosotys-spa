import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Get total patients
    const totalPatients = await prisma.patient.count()

    // Get today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        startTime: {
          gte: startOfDay,
        },
        status: {
          in: ['scheduled', 'completed'],
        },
      },
    })

    // Get week revenue
    const weekAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startOfWeek,
        },
        status: 'completed',
      },
      include: {
        service: true,
      },
    })

    const weekRevenue = weekAppointments.reduce(
      (sum, apt) => sum + apt.service.price,
      0
    )

    // Calculate month growth
    const thisMonthAppointments = await prisma.appointment.count({
      where: {
        startTime: {
          gte: startOfMonth,
        },
      },
    })

    const lastMonthAppointments = await prisma.appointment.count({
      where: {
        startTime: {
          gte: startOfLastMonth,
          lt: startOfMonth,
        },
      },
    })

    const monthGrowth =
      lastMonthAppointments === 0
        ? 100
        : Math.round(
            ((thisMonthAppointments - lastMonthAppointments) /
              lastMonthAppointments) *
              100
          )

    return NextResponse.json({
      totalPatients,
      todayAppointments,
      weekRevenue,
      monthGrowth,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
