import { NextResponse } from 'next/server';
import { getEventById } from '@/lib/calendar';
import {
  deleteAppointmentFromSheet,
  updateAppointmentDetails,
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

    // For 'exists' or 'not_exists' states, we need to fetch recent changes
    if (resourceState === 'exists' || resourceState === 'not_exists') {
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

      // Parse the request body to get the event ID if provided
      let eventId = null;
      try {
        const body = await request.json();
        eventId = body.eventId;
      } catch (e) {
        // Body might be empty, that's okay
      }

      // If we have an event ID, process it
      if (eventId) {
        await processEventChange(eventId, calendarId, resourceState);
      } else {
        console.log('⚠️ No event ID in webhook payload, skipping sync');
      }
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

// Process an event change (created, updated, or deleted)
async function processEventChange(eventId, calendarId, resourceState) {
  try {
    console.log(`🔄 Processing event ${eventId} (state: ${resourceState})`);

    // If the resource doesn't exist, the event was deleted
    if (resourceState === 'not_exists') {
      console.log('🗑️ Event deleted, removing from Google Sheets...');
      await deleteAppointmentFromSheet(eventId);
      return;
    }

    // Try to get the event details
    try {
      const event = await getEventById(eventId, calendarId);

      // Check if event was cancelled
      if (event.status === 'cancelled') {
        console.log('❌ Event cancelled, removing from Google Sheets...');
        await deleteAppointmentFromSheet(eventId);
        return;
      }

      // Check if event was rescheduled (start time changed)
      console.log('📝 Event updated, checking for time changes...');

      // Extract new date and time
      const startDateTime = new Date(event.start.dateTime || event.start.date);

      // Format date
      const newDate = startDateTime.toISOString().split('T')[0];

      // Format time to 12-hour format
      let hours = startDateTime.getHours();
      const minutes = startDateTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const newTime = `${hours}:${String(minutes).padStart(2, '0')} ${period}`;

      // Update the appointment in Google Sheets
      await updateAppointmentDetails(eventId, newDate, newTime);

      console.log('✅ Event updated in Google Sheets');
    } catch (eventError) {
      // If we can't fetch the event, it was probably deleted
      if (eventError.code === 404 || eventError.message?.includes('404')) {
        console.log('🗑️ Event not found (deleted), removing from Google Sheets...');
        await deleteAppointmentFromSheet(eventId);
      } else {
        throw eventError;
      }
    }
  } catch (error) {
    console.error('Error processing event change:', error);
    throw error;
  }
}
