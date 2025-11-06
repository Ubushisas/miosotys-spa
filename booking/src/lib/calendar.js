import { google } from 'googleapis';

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
    const calendarId = getCalendarId(service);

    // Convert date and 12-hour time to ISO datetime in Colombia timezone
    const startDateTime = convertToISODateTime(date, time);
    const endDateTime = new Date(new Date(startDateTime).getTime() + service.duration * 60000).toISOString();

    // Query for events during this time
    const response = await calendar.events.list({
      calendarId,
      timeMin: startDateTime,
      timeMax: endDateTime,
      singleEvents: true,
      orderBy: 'startTime',
    });

    // If there are any events, the slot is not available
    return response.data.items.length === 0;
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
}

// Get all unavailable time slots for a specific date
export async function getUnavailableSlots(date, service) {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId(service);

    // Get start and end of day in Colombia timezone
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId,
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // Load buffer time from environment variable or use default
    const bufferTime = parseInt(process.env.CALENDAR_BUFFER_TIME || '15'); // in minutes

    // Extract booked time ranges and add buffer time
    const bookedSlots = response.data.items.map(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);

      // Add buffer time after the event
      const endWithBuffer = new Date(eventEnd.getTime() + bufferTime * 60000);

      return {
        start: eventStart,
        end: endWithBuffer,
      };
    });

    return bookedSlots;
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
      description: `✨ RESERVA DE ${service.name.toUpperCase()} ✨\n\n📋 Detalles del Servicio:\n${durationText}\n${priceText}${peopleText}${guestsText}\n\n👤 Información de Contacto:\nNombre: ${customerInfo.name}\nTeléfono: ${customerInfo.phone}\nEmail: ${customerInfo.email}\n\n🏨 Miosotys Spa - Colombia`,
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

    const response = await calendar.events.insert({
      calendarId,
      resource: event,
      sendUpdates: 'all', // Send email to attendees
    });

    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Helper function to convert date and 12-hour time to ISO datetime
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

  // Create date object and set time
  const dateTime = new Date(date);
  dateTime.setHours(hours24, minutes, 0, 0);

  return dateTime.toISOString();
}
