import { NextResponse } from 'next/server';
import { getEventById, getRecentEvents } from '@/lib/calendar';
import {
  deleteAppointmentFromSheet,
  updateAppointmentDetails,
  getAppointmentsFromSheet,
  saveAppointmentToSheet,
} from '@/lib/google-sheets';

// Google Calendar Push Notification Webhook
// This endpoint receives notifications when calendar events are created, updated, or deleted

export async function POST(request) {
  try {
    // Get headers from Google Calendar notification
    const headers = request.headers;
    const resourceState = headers.get('x-goog-resource-state');
    const resourceId = headers.get('x-goog-resource-id');
    const channelId = headers.get('x-goog-channel-id');

    console.log('📅 Calendar webhook received:', {
      state: resourceState,
      resourceId,
      channelId,
    });

    // Google sends "sync" when first setting up the watch - just acknowledge it
    if (resourceState === 'sync') {
      console.log('✅ Webhook sync received - calendar watch is active');
      return NextResponse.json({ success: true, message: 'Sync acknowledged' });
    }

    // For 'exists' state, calendar changed - fetch recent updates
    if (resourceState === 'exists') {
      // Get the calendar ID from the channel ID (format: miosotys-{room}-{timestamp})
      const [, room] = channelId.split('-');
      const calendarIds = {
        individual: '44b404aad9e13f877c9af362787bf2a0212fbcad1a073bfa3439392167bd0c5f@group.calendar.google.com',
        principal: '5f7b7d0630cdbfe75c87101e63c334ccc2a875971b4c26d4a39003210b5bf393@group.calendar.google.com',
      };
      const calendarId = calendarIds[room];

      if (!calendarId) {
        console.error('Unknown calendar room:', room);
        return NextResponse.json({ success: false, error: 'Unknown calendar' });
      }

      // Fetch recent changes from the calendar
      await syncRecentChanges(calendarId);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('❌ Error processing calendar webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET(request) {
  // Some webhook systems send GET requests to verify the endpoint
  return NextResponse.json({
    success: true,
    message: 'Calendar webhook endpoint is active',
  });
}

// Sync recent changes from calendar to sheet
async function syncRecentChanges(calendarId) {
  try {
    console.log('🔄 Syncing recent calendar changes...');

    // Get all appointments from the sheet
    const sheetAppointments = await getAppointmentsFromSheet();
    console.log(`Found ${sheetAppointments.length} appointments in sheet`);

    // Get events from the last 24 hours (to catch recent changes)
    const updatedMin = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const calendarEvents = await getRecentEvents(calendarId, updatedMin);
    console.log(`Found ${calendarEvents.length} recent events in calendar`);

    // Create a map of calendar event IDs for quick lookup
    const calendarEventIds = new Set();
    const calendarEventMap = new Map();

    for (const event of calendarEvents) {
      if (event.status !== 'cancelled') {
        calendarEventIds.add(event.id);
        calendarEventMap.set(event.id, event);
      }
    }

    // Check each sheet appointment
    for (const appointment of sheetAppointments) {
      const googleEventId = appointment.googleEventId;

      if (!googleEventId) {
        // No calendar ID, skip
        continue;
      }

      // Check if event still exists in calendar
      if (!calendarEventIds.has(googleEventId)) {
        // Event was deleted or cancelled
        console.log(`🗑️ Event ${googleEventId} no longer exists, deleting from sheet`);
        await deleteAppointmentFromSheet(googleEventId);
        continue;
      }

      // Event exists, check if it was rescheduled
      const calendarEvent = calendarEventMap.get(googleEventId);
      const startDateTime = new Date(calendarEvent.start.dateTime || calendarEvent.start.date);

      // Format date to DD/MM/YYYY (Colombia format) for comparison
      const day = String(startDateTime.getDate()).padStart(2, '0');
      const month = String(startDateTime.getMonth() + 1).padStart(2, '0');
      const year = startDateTime.getFullYear();
      const calendarDate = `${day}/${month}/${year}`;

      // Format time to 12-hour format
      let hours = startDateTime.getHours();
      const minutes = startDateTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const calendarTime = `${hours}:${String(minutes).padStart(2, '0')} ${period}`;

      // Compare with sheet data
      const sheetDate = appointment.date;
      const sheetTime = appointment.time;

      if (sheetDate !== calendarDate || sheetTime !== calendarTime) {
        console.log(`📝 Event ${googleEventId} was rescheduled from ${sheetDate} ${sheetTime} to ${calendarDate} ${calendarTime}`);
        // updateAppointmentDetails expects YYYY-MM-DD format
        const newDate = startDateTime.toISOString().split('T')[0];
        await updateAppointmentDetails(googleEventId, newDate, calendarTime);
      }
    }

    // REVERSE SYNC: Check for new calendar events with [BOOKING] tag that need to be added to sheet
    const existingEventIds = new Set(sheetAppointments.map(apt => apt.googleEventId).filter(Boolean));

    for (const event of calendarEvents) {
      // Skip if event already exists in sheet
      if (existingEventIds.has(event.id)) {
        continue;
      }

      // Only sync events with [BOOKING] tag
      if (!event.description || !event.description.includes('[BOOKING]')) {
        console.log(`⏭️ Skipping event ${event.id} - no [BOOKING] tag`);
        continue;
      }

      console.log(`✨ Found new booking event: ${event.summary} (${event.id})`);

      // Parse event data from calendar event
      const eventData = parseCalendarEventToAppointment(event);

      if (eventData) {
        console.log(`📝 Adding new booking to sheet: ${eventData.customerInfo.name}`);
        await saveAppointmentToSheet(eventData);
      } else {
        console.log(`⚠️ Could not parse event data for ${event.id}`);
      }
    }

    console.log('✅ Sync completed');
  } catch (error) {
    console.error('Error syncing calendar changes:', error);
    throw error;
  }
}

// Parse calendar event into appointment data format for sheet
function parseCalendarEventToAppointment(event) {
  try {
    const description = event.description || '';
    const summary = event.summary || '';

    // Extract customer info from description
    // Format: "Nombre: XXX\nTeléfono: XXX\nEmail: XXX"
    const nameMatch = description.match(/Nombre:\s*(.+)/);
    const phoneMatch = description.match(/Teléfono:\s*(.+)/);
    const emailMatch = description.match(/Email:\s*(.+)/);

    // Extract service details
    const durationMatch = description.match(/Duración:\s*(\d+)\s*minutos/);
    const priceMatch = description.match(/Precio:\s*\$?([\d,]+)/);
    const peopleMatch = description.match(/Número de personas:\s*(\d+)/);

    // Extract guest names
    const guestsSection = description.match(/Nombres de los asistentes:(.+?)(?=\n\n|$)/s);
    const guestNames = [];
    if (guestsSection) {
      const guestLines = guestsSection[1].trim().split('\n');
      guestLines.forEach(line => {
        const guestName = line.replace(/^\d+\.\s*/, '').trim();
        if (guestName) guestNames.push(guestName);
      });
    }

    // Get date and time from event
    const startDateTime = new Date(event.start.dateTime || event.start.date);
    const dateStr = startDateTime.toISOString().split('T')[0]; // YYYY-MM-DD

    // Format time to 12-hour format
    let hours = startDateTime.getHours();
    const minutes = startDateTime.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${String(minutes).padStart(2, '0')} ${period}`;

    // Build appointment data object
    const appointmentData = {
      customerInfo: {
        name: nameMatch ? nameMatch[1].trim() : 'Cliente sin nombre',
        phone: phoneMatch ? phoneMatch[1].trim() : 'Sin teléfono',
        email: emailMatch ? emailMatch[1].trim() : '',
      },
      service: {
        name: summary.replace('[BOOKING]', '').trim(),
        duration: durationMatch ? parseInt(durationMatch[1]) : 60,
        price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0,
      },
      date: dateStr,
      time: timeStr,
      guestNames,
      googleEventId: event.id,
      depositAmount: 0, // Manual events don't have deposit info
    };

    return appointmentData;
  } catch (error) {
    console.error('Error parsing calendar event:', error);
    return null;
  }
}
