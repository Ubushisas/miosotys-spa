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

  useEffect(() => {
    // Load settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error loading settings:', err));
  }, []);

  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

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

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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

    const now = new Date();

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
          {loadingAvailability && (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          )}
          <div className="calendar-section">
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

              // Check if day is disabled in settings
              const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              const dayName = dayNames[date.getDay()];
              const isDayDisabled = settings && !settings.workingHours[dayName]?.enabled;

              // Check if date is blocked
              const dateStr = date.toISOString().split('T')[0];
              const isBlocked = settings && settings.blockedDates.includes(dateStr);

              // Check if all times on this day are within the minimum advance booking window
              // Calculate hours until the LAST possible slot of the day (e.g., 5:30pm)
              const minimumAdvanceHours = settings?.minimumAdvanceBookingHours || 13;
              const dayEnd = new Date(date);
              const dayHours = settings?.workingHours[dayName];
              if (dayHours?.end) {
                const [endHour, endMin] = dayHours.end.split(':').map(Number);
                dayEnd.setHours(endHour, endMin, 0, 0);
              } else {
                dayEnd.setHours(17, 30, 0, 0); // Default to 5:30pm
              }
              const now = new Date();
              const hoursUntilLastSlot = (dayEnd - now) / (1000 * 60 * 60);
              // Block the ENTIRE day if even the last slot is within the advance window
              const isWithinAdvanceWindow = hoursUntilLastSlot < minimumAdvanceHours && hoursUntilLastSlot > 0;

              const isDisabled = isPast || isDayDisabled || isBlocked || isWithinAdvanceWindow;

              return (
                <button
                  key={date.toISOString()}
                  className={`calendar-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isDayDisabled || isBlocked || isWithinAdvanceWindow ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && handleDateClick(date)}
                  disabled={isDisabled}
                  style={isDayDisabled || isBlocked || isWithinAdvanceWindow ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
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
