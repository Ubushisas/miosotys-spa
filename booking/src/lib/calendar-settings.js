// Default settings - used when no environment variable is set
const DEFAULT_SETTINGS = {
  calendarEnabled: true,
  rooms: {
    individual: {
      enabled: true,
      name: 'Sala Individual',
      calendarId: '44b404aad9e13f877c9af362787bf2a0212fbcad1a073bfa3439392167bd0c5f@group.calendar.google.com',
    },
    principal: {
      enabled: true,
      name: 'Sala Principal',
      calendarId: '5f7b7d0630cdbfe75c87101e63c334ccc2a875971b4c26d4a39003210b5bf393@group.calendar.google.com',
    },
  },
  workingHours: {
    monday: { enabled: true, start: '08:00', end: '18:00' },
    tuesday: { enabled: true, start: '08:00', end: '18:00' },
    wednesday: { enabled: true, start: '08:00', end: '18:00' },
    thursday: { enabled: true, start: '08:00', end: '18:00' },
    friday: { enabled: true, start: '08:00', end: '18:00' },
    saturday: { enabled: true, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  },
  blockedDates: [], // Array of ISO date strings
  bufferTime: 15, // Minutes between appointments
  minimumAdvanceBookingHours: 12, // Minimum hours in advance required to book
};

// Get current settings from environment variable or use defaults
// This works on Vercel serverless without file system
export function getSettings() {
  const settingsJson = process.env.CALENDAR_SETTINGS;

  if (settingsJson) {
    try {
      return JSON.parse(settingsJson);
    } catch (error) {
      console.error('Error parsing CALENDAR_SETTINGS:', error);
      return DEFAULT_SETTINGS;
    }
  }

  return DEFAULT_SETTINGS;
}

// Update settings - NOTE: On Vercel, you need to manually update the environment variable
export function updateSettings(newSettings) {
  console.warn('Settings updates require manual environment variable changes on Vercel');
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  console.log('New settings JSON for CALENDAR_SETTINGS environment variable:');
  console.log(JSON.stringify(updated));
  return updated;
}

// Check if calendar is accepting bookings
export function isCalendarEnabled() {
  const settings = getSettings();
  return settings.calendarEnabled;
}

// Check if a specific room is available
export function isRoomEnabled(roomKey) {
  const settings = getSettings();
  return settings.rooms[roomKey]?.enabled || false;
}

// Check if a date is blocked
export function isDateBlocked(date) {
  const settings = getSettings();
  const dateStr = new Date(date).toISOString().split('T')[0];
  return settings.blockedDates.includes(dateStr);
}

// Get working hours for a specific day
export function getWorkingHours(dayOfWeek) {
  const settings = getSettings();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[dayOfWeek];
  return settings.workingHours[dayName];
}

// Check if booking is allowed at specific time
export function isBookingAllowed(date, service) {
  const settings = getSettings();

  // Check if calendar is globally enabled
  if (!settings.calendarEnabled) {
    return { allowed: false, reason: 'El calendario está deshabilitado temporalmente' };
  }

  // Check minimum advance booking time
  const bookingDate = new Date(date);
  const now = new Date();
  const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
  const minimumHours = settings.minimumAdvanceBookingHours || 0;

  if (hoursUntilBooking < minimumHours) {
    return {
      allowed: false,
      reason: `Debes reservar con al menos ${minimumHours} horas de anticipación`
    };
  }

  // Check if date is blocked
  if (isDateBlocked(date)) {
    return { allowed: false, reason: 'Esta fecha está bloqueada' };
  }

  // Check day working hours
  const dayOfWeek = new Date(date).getDay();
  const hours = getWorkingHours(dayOfWeek);
  if (!hours.enabled) {
    return { allowed: false, reason: 'No hay servicio este día' };
  }

  // Check if appropriate room is enabled
  const roomKey = service.minPeople ? 'principal' : 'individual';
  if (!isRoomEnabled(roomKey)) {
    return { allowed: false, reason: `La ${settings.rooms[roomKey].name} está deshabilitada` };
  }

  return { allowed: true };
}
