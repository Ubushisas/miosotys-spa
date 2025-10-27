import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Calendar IDs for the two rooms
const CALENDAR_IDS = {
  individual: 'c_83f3b9184bb03652fe4f7b9858ba4dc022f6ae195245d233c9b7e3603d64dc9a@group.calendar.google.com',
  principal: 'c_388f36cd098bb4f42b02cd43b728000ddb283db209570fc4e80c626a177d1f74@group.calendar.google.com',
};

const TOKEN_PATH = path.join(process.cwd(), 'google-oauth-token.json');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getCalendarClient() {
  const oauth2Client = getOAuth2Client();

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oauth2Client.setCredentials(token);
  } else {
    throw new Error('OAuth token not found');
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const calendar = getCalendarClient();

    // Default to next 30 days if no dates provided
    const timeMin = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const timeMax = endDate
      ? new Date(endDate).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch events from both calendars
    const [individualEvents, principalEvents] = await Promise.all([
      calendar.events.list({
        calendarId: CALENDAR_IDS.individual,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      }),
      calendar.events.list({
        calendarId: CALENDAR_IDS.principal,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      }),
    ]);

    // Combine and format events
    const allEvents = [
      ...(individualEvents.data.items || []).map((event) => ({
        ...event,
        calendarType: 'individual',
        calendarName: 'Sala Individual',
      })),
      ...(principalEvents.data.items || []).map((event) => ({
        ...event,
        calendarType: 'principal',
        calendarName: 'Sala Principal',
      })),
    ];

    // Sort by start time
    allEvents.sort((a, b) => {
      const aStart = new Date(a.start.dateTime || a.start.date);
      const bStart = new Date(b.start.dateTime || b.start.date);
      return aStart - bStart;
    });

    return NextResponse.json({
      success: true,
      events: allEvents,
      count: allEvents.length,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments', details: error.message },
      { status: 500 }
    );
  }
}
