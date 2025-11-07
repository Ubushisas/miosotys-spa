import { google } from 'googleapis';

const APPOINTMENTS_SHEET_ID = '1DuM7pokDbek98srwPamsDGNVqD6hXafO3RHwj9gPTVw';
const MESSAGES_SHEET_ID = '1LxE0we_tfkjr7I2TplF5VALGEQRz6-zjgZxdLcsteT4';

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

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

  return oauth2Client;
}

function getSheetsClient() {
  const auth = getOAuth2Client();
  return google.sheets({ version: 'v4', auth });
}

// Initialize sheet headers if empty
export async function initializeAppointmentsSheet() {
  try {
    const sheets = getSheetsClient();

    const headers = [
      'Fecha Creación',
      'Fecha Cita',
      'Hora',
      'Nombre Cliente',
      'Teléfono',
      'Email',
      'Servicio',
      'Duración (min)',
      'Precio',
      'Personas',
      'Invitados',
      'Estado',
      'Depósito Pagado',
      'Monto Depósito',
      'Recordatorio 24h',
      'Recordatorio 1h',
      'Google Calendar ID',
      'Notas'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      range: 'A1:R1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    console.log('✅ Appointments sheet initialized');
  } catch (error) {
    console.error('Error initializing appointments sheet:', error);
    throw error;
  }
}

export async function initializeMessagesSheet() {
  try {
    const sheets = getSheetsClient();

    const headers = [
      'Fecha',
      'Hora',
      'Teléfono',
      'Dirección',
      'Tipo Mensaje',
      'Contenido',
      'Estado',
      'Twilio SID',
      'Error'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: MESSAGES_SHEET_ID,
      range: 'A1:I1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    console.log('✅ Messages sheet initialized');
  } catch (error) {
    console.error('Error initializing messages sheet:', error);
    throw error;
  }
}

// Save appointment to Google Sheets
export async function saveAppointmentToSheet(appointmentData) {
  try {
    const sheets = getSheetsClient();

    const {
      customerInfo,
      service,
      date,
      time,
      guestNames = [],
      googleEventId,
      depositAmount,
    } = appointmentData;

    const now = new Date();
    const appointmentDate = new Date(date);

    // Format creation date/time in Colombia timezone
    const creationDateTime = now.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const row = [
      creationDateTime,
      appointmentDate.toLocaleDateString('es-CO'),
      time,
      customerInfo.name,
      customerInfo.phone,
      customerInfo.email || '',
      service.name,
      service.duration,
      service.price,
      guestNames.length > 0 ? guestNames.length + 1 : 1,
      guestNames.join(', '),
      'Pendiente',
      'No',
      depositAmount || '',
      'No',
      'No',
      googleEventId || '',
      ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      range: 'A:R',
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    console.log('✅ Appointment saved to Google Sheets');
    return { success: true };
  } catch (error) {
    console.error('Error saving appointment to sheets:', error);
    return { success: false, error: error.message };
  }
}

// Save WhatsApp message to Google Sheets
export async function saveMessageToSheet(messageData) {
  try {
    const sheets = getSheetsClient();

    const {
      phoneNumber,
      direction,
      body,
      status,
      messageType,
      twilioSid,
      errorMessage,
    } = messageData;

    const now = new Date();

    const row = [
      now.toLocaleDateString('es-CO'),
      now.toLocaleTimeString('es-CO'),
      phoneNumber,
      direction === 'outbound-api' ? 'Enviado' : 'Recibido',
      messageType || 'Manual',
      body,
      status,
      twilioSid || '',
      errorMessage || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: MESSAGES_SHEET_ID,
      range: 'A:I',
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    console.log('✅ Message saved to Google Sheets');
    return { success: true };
  } catch (error) {
    console.error('Error saving message to sheets:', error);
    return { success: false, error: error.message };
  }
}

// Get all appointments from sheet (for webhook sync)
export async function getAppointmentsFromSheet() {
  try {
    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      range: 'A:R',
    });

    const rows = response.data.values || [];

    if (rows.length <= 1) {
      return []; // No appointments (only header row)
    }

    // Skip header row, map to appointment objects
    const appointments = rows.slice(1).map((row, idx) => ({
      rowIndex: idx + 2, // +2 because: +1 for skipping header, +1 for 1-based index
      createdAt: row[0] || '',
      date: row[1] || '',
      time: row[2] || '',
      customerName: row[3] || '',
      phone: row[4] || '',
      email: row[5] || '',
      serviceName: row[6] || '',
      duration: row[7] || '',
      price: row[8] || '',
      peopleCount: row[9] || '',
      guests: row[10] || '',
      status: row[11] || '',
      depositPaid: row[12] || '',
      depositAmount: row[13] || '',
      reminder24h: row[14] || '',
      reminder1h: row[15] || '',
      googleEventId: row[16] || '',
      notes: row[17] || '',
    }));

    return appointments;
  } catch (error) {
    console.error('Error getting appointments from sheet:', error);
    throw error;
  }
}

// Update appointment status
export async function updateAppointmentStatus(googleEventId, status, updates = {}) {
  try {
    const sheets = getSheetsClient();

    // Get all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      range: 'A:R',
    });

    const rows = response.data.values || [];

    // Find row with matching Google Calendar ID (column Q = index 16)
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[16] === googleEventId);

    if (rowIndex === -1) {
      console.log('Appointment not found in sheet');
      return { success: false };
    }

    // Update status (column L = index 11)
    if (status) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: APPOINTMENTS_SHEET_ID,
        range: `L${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[status]],
        },
      });
    }

    // Update other fields
    if (updates.depositPaid !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: APPOINTMENTS_SHEET_ID,
        range: `M${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[updates.depositPaid ? 'Sí' : 'No']],
        },
      });
    }

    if (updates.reminder24h) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: APPOINTMENTS_SHEET_ID,
        range: `O${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Sí']],
        },
      });
    }

    if (updates.reminder1h) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: APPOINTMENTS_SHEET_ID,
        range: `P${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Sí']],
        },
      });
    }

    if (updates.reminder5min) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: APPOINTMENTS_SHEET_ID,
        range: `P${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Sí']],
        },
      });
    }

    console.log('✅ Appointment status updated in Google Sheets');
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return { success: false, error: error.message };
  }
}

// Delete appointment from Google Sheets (only future appointments)
export async function deleteAppointmentFromSheet(googleEventId) {
  try {
    const sheets = getSheetsClient();

    // Get all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      range: 'A:R',
    });

    const rows = response.data.values || [];

    // Find row with matching Google Calendar ID (column Q = index 16)
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[16] === googleEventId);

    if (rowIndex === -1) {
      console.log('Appointment not found in sheet');
      return { success: false };
    }

    // Check if appointment is in the future
    const appointmentDateStr = rows[rowIndex][1]; // Column B = Fecha Cita
    const appointmentTimeStr = rows[rowIndex][2]; // Column C = Hora

    // Parse appointment date and time
    const [day, month, year] = appointmentDateStr.split('/');
    const appointmentDate = new Date(`${year}-${month}-${day}`);

    // Parse time (e.g., "2:30 PM")
    const [timeStr, period] = appointmentTimeStr.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    let hours24 = hours;
    if (period === 'PM' && hours !== 12) hours24 = hours + 12;
    else if (period === 'AM' && hours === 12) hours24 = 0;

    appointmentDate.setHours(hours24, minutes, 0, 0);

    const now = new Date();

    // Only delete future appointments
    if (appointmentDate < now) {
      console.log('Cannot delete past appointment from sheet');
      return { success: false, reason: 'past_appointment' };
    }

    // Delete the row using batchUpdate
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // First sheet
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    console.log('✅ Appointment deleted from Google Sheets');
    return { success: true };
  } catch (error) {
    console.error('Error deleting appointment from sheet:', error);
    return { success: false, error: error.message };
  }
}

// Update appointment details when rescheduled
export async function updateAppointmentDetails(googleEventId, newDate, newTime) {
  try {
    const sheets = getSheetsClient();

    // Get all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      range: 'A:R',
    });

    const rows = response.data.values || [];

    // Find row with matching Google Calendar ID (column Q = index 16)
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[16] === googleEventId);

    if (rowIndex === -1) {
      console.log('Appointment not found in sheet');
      return { success: false };
    }

    // Update date (column B = index 1)
    if (newDate) {
      const appointmentDate = new Date(newDate);
      await sheets.spreadsheets.values.update({
        spreadsheetId: APPOINTMENTS_SHEET_ID,
        range: `B${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[appointmentDate.toLocaleDateString('es-CO')]],
        },
      });
    }

    // Update time (column C = index 2)
    if (newTime) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: APPOINTMENTS_SHEET_ID,
        range: `C${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[newTime]],
        },
      });
    }

    // Reset reminder flags when rescheduled
    await sheets.spreadsheets.values.update({
      spreadsheetId: APPOINTMENTS_SHEET_ID,
      range: `O${rowIndex + 1}:P${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['No', 'No']],
      },
    });

    console.log('✅ Appointment details updated in Google Sheets');
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment details:', error);
    return { success: false, error: error.message };
  }
}
