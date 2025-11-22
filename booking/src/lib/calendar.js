import { google } from 'googleapis';
import { getSettings } from './calendar-settings';

// Master calendar receives ALL bookings
const MASTER_CALENDAR_ID = 'myosotisbymo@gmail.com';

// Using room-specific calendars for bookings
const CALENDAR_IDS = {
  individual: '44b404aad9e13f877c9af362787bf2a0212fbcad1a073bfa3439392167bd0c5f@group.calendar.google.com', // Sala Individual
  principal: '5f7b7d0630cdbfe75c87101e63c334ccc2a875971b4c26d4a39003210b5bf393@group.calendar.google.com', // Sala Grupal (Principal)
};

// Initialize OAuth2 client
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Get authenticated calendar client using token from environment variable
function getCalendarClient() {
  const oauth2Client = getOAuth2Client();

  // Load token from environment variable instead of file system
  // This makes it work on Vercel serverless
  const tokenJson = process.env.GOOGLE_OAUTH_TOKEN;

  if (tokenJson) {
    try {
      const token = JSON.parse(tokenJson);
      oauth2Client.setCredentials(token);
    } catch (error) {
      console.error('Error parsing GOOGLE_OAUTH_TOKEN:', error);
      throw new Error('Invalid OAuth token format. Please check GOOGLE_OAUTH_TOKEN environment variable.');
    }
  } else {
    throw new Error('OAuth token not found. Please set GOOGLE_OAUTH_TOKEN environment variable.');
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Generate authorization URL
export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  return authUrl;
}

// Exchange authorization code for tokens
// NOTE: In production, manually set the GOOGLE_OAUTH_TOKEN environment variable
export async function saveTokenFromCode(code) {
  const oauth2Client = getOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Return tokens as JSON string to be manually added to environment variables
  console.log('IMPORTANT: Add this to your .env.local and Vercel environment variables:');
  console.log('GOOGLE_OAUTH_TOKEN=' + JSON.stringify(tokens));

  return tokens;
}

// Check if token exists and is valid
export function isAuthorized() {
  return !!process.env.GOOGLE_OAUTH_TOKEN;
}

// Determine which calendar to use based on service type
export function getCalendarId(service) {
  // Individual services use Sala Individual, group services use Sala Principal
  return service.minPeople ? CALENDAR_IDS.principal : CALENDAR_IDS.individual;
}

// Check if a time slot is available for a given service
export async function checkAvailability(date, time, service) {
  try {
    const calendar = getCalendarClient();
    const roomCalendarId = getCalendarId(service);

    // Convert date and 12-hour time to ISO datetime in Colombia timezone
    const startDateTime = convertToISODateTime(date, time);
    const endDateTime = new Date(new Date(startDateTime).getTime() + service.duration * 60000).toISOString();

    // Check BOTH room calendar AND master calendar
    let roomResponse, masterResponse;
    try {
      [roomResponse, masterResponse] = await Promise.all([
        calendar.events.list({
          calendarId: roomCalendarId,
          timeMin: startDateTime,
          timeMax: endDateTime,
          singleEvents: true,
          orderBy: 'startTime',
        }),
        calendar.events.list({
          calendarId: MASTER_CALENDAR_ID,
          timeMin: startDateTime,
          timeMax: endDateTime,
          singleEvents: true,
          orderBy: 'startTime',
        }),
      ]);
    } catch (calError) {
      console.error('Calendar API error in checkAvailability:', calError);
      // If master calendar fails, just check room calendar
      roomResponse = await calendar.events.list({
        calendarId: roomCalendarId,
        timeMin: startDateTime,
        timeMax: endDateTime,
        singleEvents: true,
        orderBy: 'startTime',
      });
      masterResponse = { data: { items: [] } };
    }

    // If there are ANY events on either calendar, the slot is not available
    return roomResponse.data.items.length === 0 && masterResponse.data.items.length === 0;
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
}

// Get all unavailable time slots for a specific date
export async function getUnavailableSlots(date, service) {
  try {
    const calendar = getCalendarClient();
    const roomCalendarId = getCalendarId(service);

    // Get start and end of day in Colombia timezone
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Check BOTH room calendar AND master calendar
    let roomResponse, masterResponse;
    console.log(`🔍 Checking calendars:`, {
      room: roomCalendarId,
      master: MASTER_CALENDAR_ID,
      dayStart: dayStart.toISOString(),
      dayEnd: dayEnd.toISOString()
    });

    try {
      [roomResponse, masterResponse] = await Promise.all([
        calendar.events.list({
          calendarId: roomCalendarId,
          timeMin: dayStart.toISOString(),
          timeMax: dayEnd.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        }),
        calendar.events.list({
          calendarId: MASTER_CALENDAR_ID,
          timeMin: dayStart.toISOString(),
          timeMax: dayEnd.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        }),
      ]);

      console.log(`📊 Events found:`, {
        room: roomResponse.data.items.map(e => ({ summary: e.summary, start: e.start.dateTime })),
        master: masterResponse.data.items.map(e => ({ summary: e.summary, start: e.start.dateTime }))
      });
    } catch (calError) {
      console.error('Calendar API error:', calError);
      console.error('Calendar API error details:', {
        message: calError.message,
        code: calError.code,
        errors: calError.errors
      });
      // If master calendar fails, just use room calendar
      roomResponse = await calendar.events.list({
        calendarId: roomCalendarId,
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      masterResponse = { data: { items: [] } };
    }

    // Combine events from both calendars
    const allEvents = [...roomResponse.data.items, ...masterResponse.data.items];

    // Debug logging
    const dateStr = date.toISOString().split('T')[0];
    console.log(`📅 getUnavailableSlots for ${dateStr}:`, {
      roomEvents: roomResponse.data.items.length,
      masterEvents: masterResponse.data.items.length,
      totalEvents: allEvents.length
    });

    // Load buffer time from database settings
    const settings = await getSettings();
    const bufferTime = settings.bufferTime || 30; // in minutes

    // Extract booked time ranges and add buffer time
    const bookedSlots = allEvents.map(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);

      // Add buffer time after the event
      const endWithBuffer = new Date(eventEnd.getTime() + bufferTime * 60000);

      return {
        start: eventStart,
        end: endWithBuffer,
      };
    });

    // Add lunch break (12:30 PM - 2:00 PM) as an unavailable slot
    const lunchStart = new Date(date);
    lunchStart.setHours(12, 30, 0, 0);

    const lunchEnd = new Date(date);
    lunchEnd.setHours(14, 0, 0, 0);

    const lunchSlot = {
      start: lunchStart,
      end: lunchEnd,
    };

    return [...bookedSlots, lunchSlot];
  } catch (error) {
    console.error('Error getting unavailable slots:', error);
    throw error;
  }
}

// Create a booking in Google Calendar
export async function createBooking(date, time, service, guestNames, customerInfo) {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId(service);

    const startDateTime = convertToISODateTime(date, time);
    const endDateTime = new Date(new Date(startDateTime).getTime() + service.duration * 60000).toISOString();

    // Format service details
    const durationText = `Duración: ${service.duration} minutos`;
    const priceText = service.price ? `Precio: $${service.price.toLocaleString('es-CO')} COP` : '';

    // Format guest names for description
    const peopleCount = guestNames.length > 0 ? guestNames.length : (service.minPeople || 1);
    const peopleText = peopleCount > 1 ? `\nNúmero de personas: ${peopleCount}` : '';
    const guestsText = guestNames.length > 0 ? `\n\nNombres de los asistentes:\n${guestNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}` : '';

    const event = {
      summary: `${service.name}`,
      description: `[BOOKING]\n\n✨ RESERVA DE ${service.name.toUpperCase()} ✨\n\n📋 Detalles del Servicio:\n${durationText}\n${priceText}${peopleText}${guestsText}\n\n👤 Información de Contacto:\nNombre: ${customerInfo.name}\nTeléfono: ${customerInfo.phone}\nEmail: ${customerInfo.email}\n\n🏨 Myosotis Spa - Colombia`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Bogota',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Bogota',
      },
      attendees: customerInfo.email ? [{ email: customerInfo.email }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    // Create event on room-specific calendar
    const response = await calendar.events.insert({
      calendarId,
      resource: event,
      sendUpdates: 'all', // Send email to attendees
    });

    // Also create on master calendar (myosotisbymo@gmail.com) for complete overview
    try {
      await calendar.events.insert({
        calendarId: MASTER_CALENDAR_ID,
        resource: event,
        sendUpdates: 'none', // Don't send duplicate emails
      });
    } catch (masterError) {
      console.error('Warning: Failed to sync to master calendar:', masterError);
      // Don't fail the booking if master calendar sync fails
    }

    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Helper function to convert date and 12-hour time to ISO datetime in Colombia timezone
function convertToISODateTime(date, time12h) {
  // Parse 12-hour time format (e.g., "2:30 PM")
  const [timeStr, period] = time12h.split(' ');
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Convert to 24-hour format
  let hours24 = hours;
  if (period === 'PM' && hours !== 12) {
    hours24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hours24 = 0;
  }

  // Create date string in Colombia timezone format (YYYY-MM-DD)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(hours24).padStart(2, '0');
  const minute = String(minutes).padStart(2, '0');

  // Format as ISO string with Colombia timezone offset (-05:00)
  return `${year}-${month}-${day}T${hour}:${minute}:00-05:00`;
}

// Get event details by ID
export async function getEventById(eventId, calendarId) {
  try {
    const calendar = getCalendarClient();

    const response = await calendar.events.get({
      calendarId: calendarId || CALENDAR_IDS.individual,
      eventId,
    });

    return response.data;
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
}

// Get recent events from calendar (for webhook sync)
export async function getRecentEvents(calendarId, updatedMin) {
  try {
    const calendar = getCalendarClient();

    const response = await calendar.events.list({
      calendarId: calendarId || CALENDAR_IDS.individual,
      updatedMin,
      singleEvents: true,
      orderBy: 'updated',
      maxResults: 250,
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error getting recent events:', error);
    throw error;
  }
}

// Register webhook for calendar changes
export async function registerCalendarWebhook(webhookUrl) {
  try {
    const calendar = getCalendarClient();

    // Register for both calendars
    const channels = [];

    for (const [roomName, calendarId] of Object.entries(CALENDAR_IDS)) {
      const response = await calendar.events.watch({
        calendarId,
        requestBody: {
          id: `miosotys-${roomName}-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
        },
      });

      channels.push({
        room: roomName,
        calendarId,
        channel: response.data,
      });
    }

    return channels;
  } catch (error) {
    console.error('Error registering webhook:', error);
    throw error;
  }
}

// Stop watching a calendar channel
export async function stopCalendarWatch(channelId, resourceId) {
  try {
    const calendar = getCalendarClient();

    await calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error stopping watch:', error);
    throw error;
  }
}
