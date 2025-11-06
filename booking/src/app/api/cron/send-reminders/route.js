import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { updateAppointmentStatus } from '@/lib/google-sheets';

export async function GET(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const tokenJson = process.env.GOOGLE_OAUTH_TOKEN;
    if (!tokenJson) {
      return NextResponse.json({ error: 'OAuth token not configured' }, { status: 500 });
    }

    oauth2Client.setCredentials(JSON.parse(tokenJson));
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get appointments for the next 25 hours (to catch both 24h and 1h reminders)
    const now = new Date();
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: in25Hours.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    const remindersSent = [];

    for (const event of events) {
      if (!event.start?.dateTime) continue;

      const eventStart = new Date(event.start.dateTime);
      const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);

      // Get customer info from event description
      const description = event.description || '';
      const phoneMatch = description.match(/Teléfono:\s*(\+?\d+)/);
      const nameMatch = description.match(/Nombre:\s*(.+)/);

      if (!phoneMatch || !nameMatch) continue;

      const customerPhone = phoneMatch[1];
      const customerName = nameMatch[1];

      // 24-hour reminder (send between 23.5 and 24.5 hours before)
      if (hoursUntilEvent >= 23.5 && hoursUntilEvent <= 24.5) {
        const message = `Hola ${customerName}!\n\nRecordatorio: Tienes una cita mañana en Miosotys Spa\n\n📅 Servicio: ${event.summary}\n⏰ Fecha: ${eventStart.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}\n🕐 Hora: ${eventStart.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n\n¡Te esperamos! 🌿`;

        await sendSMS(customerPhone, message);

        await updateAppointmentStatus(event.id, null, { reminder24h: true });

        remindersSent.push({
          type: '24h',
          customer: customerName,
          phone: customerPhone,
          event: event.summary,
        });
      }

      // 1-hour reminder (send between 0.9 and 1.1 hours before)
      if (hoursUntilEvent >= 0.9 && hoursUntilEvent <= 1.1) {
        const message = `Hola ${customerName}!\n\n⏰ Tu cita es en 1 hora\n\n📍 Miosotys Spa\n🕐 Hora: ${eventStart.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n\n¡Nos vemos pronto! ✨`;

        await sendSMS(customerPhone, message);

        await updateAppointmentStatus(event.id, null, { reminder1h: true });

        remindersSent.push({
          type: '1h',
          customer: customerName,
          phone: customerPhone,
          event: event.summary,
        });
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: remindersSent.length,
      reminders: remindersSent,
    });

  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to send SMS
async function sendSMS(phoneNumber, message) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://miosotys-spa-booking.vercel.app'}/api/whatsapp/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, message }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send SMS: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in sendSMS:', error);
    throw error;
  }
}
