import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple AI-like command processing
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    const lowerMessage = message.toLowerCase()

    let response = ''

    // Show today's schedule
    if (
      lowerMessage.includes('today') &&
      (lowerMessage.includes('schedule') ||
        lowerMessage.includes('appointment') ||
        lowerMessage.includes('show'))
    ) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: today,
            lt: tomorrow,
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

      if (appointments.length === 0) {
        response = "You have no appointments scheduled for today. It's a quiet day!"
      } else {
        response = `You have ${appointments.length} appointment${
          appointments.length > 1 ? 's' : ''
        } today:\n\n`
        appointments.forEach((apt) => {
          const time = new Date(apt.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
          response += `• ${time} - ${apt.patient.name} - ${apt.service.name} (${apt.service.duration} min)\n`
        })
      }
    }

    // Show all patients
    else if (
      lowerMessage.includes('patient') &&
      (lowerMessage.includes('all') ||
        lowerMessage.includes('show') ||
        lowerMessage.includes('list'))
    ) {
      const patients = await prisma.patient.findMany({
        include: {
          _count: {
            select: { appointments: true },
          },
        },
        take: 10,
      })

      if (patients.length === 0) {
        response = 'You have no patients registered yet.'
      } else {
        response = `You have ${patients.length} patient${
          patients.length > 1 ? 's' : ''
        } (showing first 10):\n\n`
        patients.forEach((patient) => {
          response += `• ${patient.name} - ${patient.email} - ${patient._count.appointments} appointment${
            patient._count.appointments !== 1 ? 's' : ''
          }\n`
        })
      }
    }

    // Find available slots
    else if (
      lowerMessage.includes('available') ||
      lowerMessage.includes('slot') ||
      lowerMessage.includes('free')
    ) {
      response =
        "I can help you find available slots! The calendar feature is coming soon. For now, you can check the Calendar tab to see availability and book appointments manually."
    }

    // Block off time
    else if (lowerMessage.includes('block')) {
      response =
        "I can help you block off time slots! The calendar blocking feature is coming soon. For now, you can manually manage availability in the Settings tab."
    }

    // Buffer time
    else if (lowerMessage.includes('buffer')) {
      const settings = await prisma.settings.findFirst()
      if (settings) {
        response = `Current buffer time between appointments is ${settings.bufferTime} minutes. You can adjust this in the Settings tab.`
      } else {
        response =
          'Buffer time is set to 15 minutes by default. You can adjust this in the Settings tab.'
      }
    }

    // Show services
    else if (
      lowerMessage.includes('service') &&
      (lowerMessage.includes('show') ||
        lowerMessage.includes('list') ||
        lowerMessage.includes('what'))
    ) {
      const services = await prisma.service.findMany({
        where: { active: true },
      })

      if (services.length === 0) {
        response = 'You have no active services. Add services in the Services tab.'
      } else {
        response = `You have ${services.length} active service${
          services.length > 1 ? 's' : ''
        }:\n\n`
        services.forEach((service) => {
          response += `• ${service.name} - ${service.duration} min - $${service.price}\n`
        })
      }
    }

    // Help
    else if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
      response = `I can help you with:\n
• Show today's appointments
• List all patients
• Show active services
• Check buffer time settings
• Find available time slots (coming soon)
• Block off time periods (coming soon)

Just ask me in natural language!`
    }

    // Default response
    else {
      response = `I understand you're asking about "${message}".

I can help with:
• Showing today's schedule
• Listing patients and services
• Checking buffer times
• Finding available slots

Try rephrasing your question, or type "help" for more options.`
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Assistant error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
