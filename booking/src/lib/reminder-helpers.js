import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const APPOINTMENTS_SHEET_ID = '1DuM7pokDbek98srwPamsDGNVqD6hXafO3RHwj9gPTVw';
const TOKEN_PATH = path.join(process.cwd(), 'google-oauth-token.json');

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oauth2Client.setCredentials(token);
  } else {
    throw new Error('OAuth token not found');
  }

  return oauth2Client;
}

function getSheetsClient() {
  const auth = getOAuth2Client();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Get appointments that need reminders
 * @param {string} reminderType - '24h' for 24-hour reminders (tomorrow's appointments)
 *                                 '2h' for 2-hour reminders (today's appointments within 2-3 hours)
 * @returns {Promise<Array>} Appointments needing reminders
 */
export async function getAppointmentsNeedingReminders(reminderType) {
  try {
    const sheets = getSheetsClient();

    // Get all appointments
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      range: 'A:R',
    });

    const rows = response.data.values || [];

    if (rows.length <= 1) {
      return []; // No appointments (only headers or empty)
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // For 24h: check tomorrow's appointments
    // For 2h: check today's appointments
    const targetDate = reminderType === '24h' ? tomorrow : today;
    const reminderColumn = reminderType === '24h' ? 14 : 15; // O=14 for 24h, P=15 for 2h

    const appointments = [];

    // Skip header row (index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Parse appointment date (column B = index 1)
      const appointmentDateStr = row[1];
      if (!appointmentDateStr) continue;

      // Parse date from "DD/MM/YYYY" format
      const dateParts = appointmentDateStr.split('/');
      if (dateParts.length !== 3) continue;

      const appointmentDate = new Date(
        parseInt(dateParts[2]), // year
        parseInt(dateParts[1]) - 1, // month (0-indexed)
        parseInt(dateParts[0]) // day
      );
      appointmentDate.setHours(0, 0, 0, 0);

      // Check if appointment is for target date
      if (appointmentDate.getTime() !== targetDate.getTime()) {
        continue;
      }

      // For 2h reminders, also check if appointment is within 2-3 hours from now
      if (reminderType === '2h') {
        const timeStr = row[2] || ''; // Column C - time
        if (!timeStr) continue;

        // Parse time "HH:MM"
        const timeParts = timeStr.split(':');
        if (timeParts.length !== 2) continue;

        const appointmentDateTime = new Date(appointmentDate);
        appointmentDateTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);

        // Calculate hours until appointment
        const hoursUntil = (appointmentDateTime - now) / (1000 * 60 * 60);

        // Only send if appointment is 2-3 hours away
        if (hoursUntil < 2 || hoursUntil > 3) {
          continue;
        }
      }

      // Check if reminder already sent
      const reminderSent = row[reminderColumn] === 'Sí' || row[reminderColumn] === 'Si';
      if (reminderSent) {
        continue;
      }

      // Check if appointment is not cancelled
      const status = row[11]; // Column L
      if (status === 'Cancelada' || status === 'Cancelado') {
        continue;
      }

      appointments.push({
        rowIndex: i + 1, // +1 because sheets are 1-indexed
        date: appointmentDateStr,
        time: row[2] || '', // Column C
        customerName: row[3] || '', // Column D
        phone: row[4] || '', // Column E
        service: row[6] || '', // Column G
        status: status || 'Pendiente',
        reminderType,
      });
    }

    return appointments;
  } catch (error) {
    console.error('Error getting appointments for reminders:', error);
    throw error;
  }
}

/**
 * Mark reminder as sent in Google Sheets
 * @param {number} rowIndex - Row number in the sheet (1-indexed)
 * @param {string} reminderType - '24h' or '2h'
 */
export async function markReminderSent(rowIndex, reminderType) {
  try {
    const sheets = getSheetsClient();

    const column = reminderType === '24h' ? 'O' : 'P';
    const range = `${column}${rowIndex}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Sí']],
      },
    });

    console.log(`✅ Reminder marked as sent for row ${rowIndex}`);
    return { success: true };
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
    throw error;
  }
}
