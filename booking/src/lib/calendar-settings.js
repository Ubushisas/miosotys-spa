import { getSettings as getSettingsFromDB } from './db';

// Get current settings from Postgres
export async function getSettings() {
  try {
    const settings = await getSettingsFromDB();
    return settings || getDefaultSettings();
  } catch (error) {
    console.error('Error getting settings:', error);
    return getDefaultSettings();
  }
}

function getDefaultSettings() {
  return {
    calendarEnabled: true,
    rooms: {
      individual: {
        enabled: true,
        name: 'Sala Individual',
        calendarId: 'c_83f3b9184bb03652fe4f7b9858ba4dc022f6ae195245d233c9b7e3603d64dc9a@group.calendar.google.com',
      },
      principal: {
        enabled: true,
        name: 'Sala Principal',
        calendarId: 'c_388f36cd098bb4f42b02cd43b728000ddb283db209570fc4e80c626a177d1f74@group.calendar.google.com',
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
    blockedDates: [],
    bufferTime: 15,
    minimumAdvanceBookingHours: 12,
  };
}

// Check if calendar is accepting bookings
export async function isCalendarEnabled() {
  const settings = await getSettings();
  return settings.calendarEnabled;
}

// Check if a specific room is available
export async function isRoomEnabled(roomKey) {
  const settings = await getSettings();
  return settings.rooms[roomKey]?.enabled || false;
}

// Check if a date is blocked
export async function isDateBlocked(date) {
  const settings = await getSettings();
  const dateStr = new Date(date).toISOString().split('T')[0];
  return settings.blockedDates.includes(dateStr);
}

// Get working hours for a specific day
export async function getWorkingHours(dayOfWeek) {
  const settings = await getSettings();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[dayOfWeek];
  return settings.workingHours[dayName];
}

// Check if booking is allowed at specific time
export async function isBookingAllowed(date, service) {
  const settings = await getSettings();

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
  if (await isDateBlocked(date)) {
    return { allowed: false, reason: 'Esta fecha está bloqueada' };
  }

  // Check day working hours
  const dayOfWeek = new Date(date).getDay();
  const hours = await getWorkingHours(dayOfWeek);
  if (!hours.enabled) {
    return { allowed: false, reason: 'No hay servicio este día' };
  }

  // Check if appropriate room is enabled
  const roomKey = service.minPeople ? 'principal' : 'individual';
  if (!(await isRoomEnabled(roomKey))) {
    return { allowed: false, reason: `La ${settings.rooms[roomKey].name} está deshabilitada` };
  }

  return { allowed: true };
}
