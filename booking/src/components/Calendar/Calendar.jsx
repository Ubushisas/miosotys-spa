"use client";
import { useState, useEffect } from "react";
import "./Calendar.css";

const Calendar = ({ service, onSelectDateTime }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [dailyAvailability, setDailyAvailability] = useState({}); // Cache: { 'YYYY-MM-DD': hasSlots }

  useEffect(() => {
    // Load settings
    setLoadingAvailability(true);
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const colombiaTime = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' });
        console.log('🔧 SETTINGS LOADED:', data);
        console.log('📅 Buffer hours:', data.minimumAdvanceBookingHours);
        console.log('🕐 Current Colombia time:', colombiaTime);
        console.log('🌎 Your browser time:', new Date().toLocaleString());
        setSettings(data);
        setLoadingAvailability(false);
      })
      .catch(err => {
        console.error('Error loading settings:', err);
        setLoadingAvailability(false);
      });
  }, []);

  // Pre-fetch availability for all days in current month
  useEffect(() => {
    if (!settings || !service) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Fetch availability for each day
    const fetchPromises = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];

      fetchPromises.push(
        fetch('/api/calendar/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr, service })
        })
          .then(res => res.json())
          .then(data => {
            // The API returns { unavailableSlots: [...] }
            // We need to check if ALL possible slots are unavailable

            // Get day working hours
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[date.getDay()];
            const daySettings = settings.workingHours[dayName];

            if (!daySettings?.enabled) {
              return { dateStr, hasAvailableSlots: false };
            }

            // Generate all possible 30-min slots for this day
            const [startHour, startMin] = daySettings.start.split(':').map(Number);
            const [endHour, endMin] = daySettings.end.split(':').map(Number);

            let totalSlots = 0;
            let currentHour = startHour;
            let currentMin = 0;
            const now = new Date();
            const minimumAdvanceHours = settings.minimumAdvanceBookingHours || 12;

            while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
              const slotStart = new Date(date);
              slotStart.setHours(currentHour, currentMin, 0, 0);

              // Only count slots that are in the future and meet minimum advance time
              if (slotStart > now) {
                const hoursUntilBooking = (slotStart - now) / (1000 * 60 * 60);
                if (hoursUntilBooking >= minimumAdvanceHours) {
                  // Check if this slot is NOT blocked by checking unavailableSlots
                  const slotEnd = new Date(slotStart.getTime() + service.duration * 60000);
                  const isSlotBlocked = data.unavailableSlots?.some(blocked => {
                    const blockedStart = new Date(blocked.start);
                    const blockedEnd = new Date(blocked.end);
                    // Slot is blocked if it overlaps with any unavailable period
                    return slotStart < blockedEnd && slotEnd > blockedStart;
                  });

                  if (!isSlotBlocked) {
                    totalSlots++;
                  }
                }
              }

              currentMin += 30;
              if (currentMin >= 60) {
                currentMin = 0;
                currentHour++;
              }
            }

            return { dateStr, hasAvailableSlots: totalSlots > 0 };
          })
          .catch(err => {
            console.error(`Error fetching availability for ${dateStr}:`, err);
            return { dateStr, hasAvailableSlots: false };
          })
      );
    }

    Promise.all(fetchPromises).then(results => {
      const availabilityMap = {};
      results.forEach(({ dateStr, hasAvailableSlots }) => {
        availabilityMap[dateStr] = hasAvailableSlots;
      });
      console.log('📊 Daily Availability Map:', availabilityMap);
      setDailyAvailability(availabilityMap);
    });
  }, [currentMonth, settings, service]);

  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Convert Sunday=0 to Monday=0 format
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Sunday becomes last day

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Generate available time slots based on settings for selected day
  const generateTimeSlots = () => {
    if (!selectedDate || !settings) {
      // Default slots
      const slots = [];
      for (let hour = 8; hour < 18; hour++) {
        const hour12 = hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? 'AM' : 'PM';
        slots.push(`${hour12}:00 ${period}`);
        slots.push(`${hour12}:30 ${period}`);
      }
      return slots;
    }

    // Get day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[selectedDate.getDay()];
    const daySettings = settings.workingHours[dayName];

    // If day is disabled, return empty
    if (!daySettings?.enabled) {
      return [];
    }

    // Parse start and end times
    const [startHour, startMin] = daySettings.start.split(':').map(Number);
    const [endHour, endMin] = daySettings.end.split(':').map(Number);

    const slots = [];
    let currentHour = startHour;
    let currentMin = 0;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const hour12 = currentHour > 12 ? currentHour - 12 : (currentHour === 0 ? 12 : currentHour);
      const period = currentHour < 12 ? 'AM' : 'PM';
      slots.push(`${hour12}:${currentMin.toString().padStart(2, '0')} ${period}`);

      // Increment by 30 minutes
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  };

  const days = getDaysInMonth(currentMonth);
  const timeSlots = generateTimeSlots();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateClick = async (date) => {
    if (date && date >= today) {
      setSelectedDate(date);
      setSelectedTime(null); // Reset time when date changes

      // Fetch unavailable slots for this date
      setLoadingAvailability(true);
      try {
        const response = await fetch('/api/calendar/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: date.toISOString(),
            service: service,
          }),
        });

        const data = await response.json();
        setUnavailableSlots(data.unavailableSlots || []);

        // Move to time selection after loading availability
        setShowTimeSelection(true);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setUnavailableSlots([]);
      } finally {
        setLoadingAvailability(false);
      }
    }
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    if (selectedDate && onSelectDateTime) {
      onSelectDateTime({
        date: selectedDate,
        time: time,
        service: service
      });

      // Scroll to summary smoothly after selection
      setTimeout(() => {
        const summary = document.querySelector('.selection-summary');
        if (summary) {
          summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  // Get current time in Colombia timezone
  const getColombiaTime = () => {
    const colombiaTime = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' });
    return new Date(colombiaTime);
  };

  // Check if a specific day has ANY available time slots
  const dayHasAvailableSlots = (date) => {
    if (!settings) return false;

    // Get day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const daySettings = settings.workingHours[dayName];

    // If day is disabled, no slots available
    if (!daySettings?.enabled) return false;

    // Check if date is blocked
    const dateStr = date.toISOString().split('T')[0];
    if (settings.blockedDates.includes(dateStr)) return false;

    // Parse start and end times
    const [startHour, startMin] = daySettings.start.split(':').map(Number);
    const [endHour, endMin] = daySettings.end.split(':').map(Number);

    // Generate all 30-min slots for this day
    let currentHour = startHour;
    let currentMin = 0;
    const now = getColombiaTime(); // Use Colombia time!
    const minimumAdvanceHours = settings.minimumAdvanceBookingHours || 12;

    const dayNum = date.getDate();
    if (dayNum === 7 || dayNum === 8) {
      console.log(`🔍 Checking Nov ${dayNum}:`, {
        now: now.toLocaleString('es-CO'),
        minimumAdvanceHours,
        firstSlot: `${startHour}:${currentMin.toString().padStart(2, '0')}`
      });
    }

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      // Create slot datetime
      const slotStart = new Date(date);
      slotStart.setHours(currentHour, currentMin, 0, 0);

      // Check if slot is in the future
      if (slotStart > now) {
        // Check minimum advance booking time
        const hoursUntilBooking = (slotStart - now) / (1000 * 60 * 60);

        if (dayNum === 7 || dayNum === 8) {
          console.log(`  Slot ${currentHour}:${currentMin.toString().padStart(2, '0')}`, {
            slotStart: slotStart.toLocaleString('es-CO'),
            hoursUntil: hoursUntilBooking.toFixed(2),
            needsAtLeast: minimumAdvanceHours,
            available: hoursUntilBooking >= minimumAdvanceHours
          });
        }

        if (hoursUntilBooking >= minimumAdvanceHours) {
          // At least one slot is available
          if (dayNum === 7 || dayNum === 8) {
            console.log(`✅ Nov ${dayNum} HAS available slots`);
          }
          return true;
        }
      }

      // Increment by 30 minutes
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    // No slots available
    if (dayNum === 7 || dayNum === 8) {
      console.log(`❌ Nov ${dayNum} has NO available slots`);
    }
    return false;
  };

  // Check if a time slot is available
  const isTimeSlotAvailable = (time) => {
    // Convert time slot to datetime
    const [timeStr, period] = time.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    let hours24 = hours;
    if (period === 'PM' && hours !== 12) {
      hours24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hours24 = 0;
    }

    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours24, minutes, 0, 0);

    const now = getColombiaTime(); // Use Colombia time!

    // Check if slot is in the past
    if (slotStart <= now) {
      return false;
    }

    // Check minimum advance booking time (12 hours)
    const minimumAdvanceHours = settings?.minimumAdvanceBookingHours || 12;
    const hoursUntilBooking = (slotStart - now) / (1000 * 60 * 60);
    if (hoursUntilBooking < minimumAdvanceHours) {
      return false;
    }

    const slotEnd = new Date(slotStart.getTime() + service.duration * 60000);

    // Check if this slot overlaps with any unavailable slot
    if (unavailableSlots.length > 0) {
      for (const unavailable of unavailableSlots) {
        const bookedStart = new Date(unavailable.start);
        const bookedEnd = new Date(unavailable.end);

        // Check for overlap
        if (slotStart < bookedEnd && slotEnd > bookedStart) {
          return false;
        }
      }
    }

    return true;
  };

  return (
    <div className="calendar-container">
      {!showTimeSelection ? (
        /* Step 1: Date Selection */
        <div className="calendar-single-view">
          {!settings ? (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          ) : loadingAvailability && (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          )}
          {settings && <div className="calendar-section">
          <div className="calendar-header">
            <button className="month-nav" onClick={handlePrevMonth}>
              ←
            </button>
            <h3>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button className="month-nav" onClick={handleNextMonth}>
              →
            </button>
          </div>

          <div className="calendar-days-header">
            {dayNames.map(day => (
              <div key={day} className="day-name">{day}</div>
            ))}
          </div>

          <div className="calendar-days">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="calendar-day empty"></div>;
              }

              const isPast = date < today;
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());

              // Check if this day has ANY available time slots
              const dateStr = date.toISOString().split('T')[0];
              const cachedAvailability = dailyAvailability[dateStr];
              const hasAvailableSlots = !isPast && (cachedAvailability !== undefined ? cachedAvailability : dayHasAvailableSlots(date));
              const isDisabled = !hasAvailableSlots;

              return (
                <button
                  key={date.toISOString()}
                  className={`calendar-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && handleDateClick(date)}
                  disabled={isDisabled}
                  style={isDisabled ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>}
        </div>
      ) : (
        /* Step 2: Time Selection - Calendly Style */
        <div className="calendar-single-view calendly-style">
          <button
            className="back-button-simple"
            onClick={() => {
              setShowTimeSelection(false);
              setSelectedTime(null);
            }}
          >
            ←
          </button>

          <div className="time-view-header">
            <h2 className="time-view-day">
              {selectedDate && selectedDate.toLocaleDateString('es-CO', { weekday: 'long' })}
            </h2>
            <p className="time-view-date">
              {selectedDate && selectedDate.toLocaleDateString('es-CO', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            {service && (
              <p className="time-view-duration">Duración: {service.duration} min</p>
            )}
          </div>

          <div className="time-section-calendly">
            {loadingAvailability ? (
              <div className="time-placeholder">
                <div className="spinner-small"></div>
                <p>Cargando disponibilidad...</p>
              </div>
            ) : timeSlots.filter(time => isTimeSlotAvailable(time)).length === 0 ? (
              <div className="time-placeholder">
                <p>No hay horarios disponibles para esta fecha</p>
              </div>
            ) : (
              <div className="time-slots-calendly">
                {timeSlots.filter(time => isTimeSlotAvailable(time)).map(time => {
                  return (
                    <button
                      key={time}
                      className={`time-slot-calendly ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => handleTimeClick(time)}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedDate && selectedTime && (
        <div className="selection-summary">
          <p className="mono">Fecha y hora seleccionada</p>
          <p className="summary-text">
            <strong>{selectedDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            {' a las '}
            <strong>{selectedTime}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default Calendar;
