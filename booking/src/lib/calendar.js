import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Calendar IDs for the two rooms
const CALENDAR_IDS = {
  individual: 'c_83f3b9184bb03652fe4f7b9858ba4dc022f6ae195245d233c9b7e3603d64dc9a@group.calendar.google.com', // Sala privada
  principal: 'c_388f36cd098bb4f42b02cd43b728000ddb283db209570fc4e80c626a177d1f74@group.calendar.google.com', // Sala grupal
};

// Path to store OAuth tokens
const TOKEN_PATH = path.join(process.cwd(), 'google-oauth-token.json');

// Initialize OAuth2 client
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Get authenticated calendar client using stored token
function getCalendarClient() {
  const oauth2Client = getOAuth2Client();

  // Load token from file
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oauth2Client.setCredentials(token);
  } else {
    throw new Error('OAuth token not found. Please authorize the application first.');
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

// Exchange authorization code for tokens and save them
export async function saveTokenFromCode(code) {
  const oauth2Client = getOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Save tokens to file
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

  return tokens;
}

// Check if token exists and is valid
export function isAuthorized() {
  return fs.existsSync(TOKEN_PATH);
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

    // Load buffer time from settings
    const settingsPath = path.join(process.cwd(), 'calendar-settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const bufferTime = settings.bufferTime || 0; // in minutes

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
