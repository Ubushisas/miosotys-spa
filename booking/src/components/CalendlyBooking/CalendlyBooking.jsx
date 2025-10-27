"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, ChevronDown, Clock, MapPin, Calendar as CalendarIcon, Globe } from "lucide-react";
import "./CalendlyBooking.css";

export default function CalendlyBooking({ onBack, preselectedService }) {
  const [settings, setSettings] = useState(null);
  const [step, setStep] = useState(preselectedService ? 2 : 1); // Skip to step 2 if service is preselected
  const [dateTimeSubStep, setDateTimeSubStep] = useState('date'); // 'date', 'time', 'people', or 'guests'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [peopleCount, setPeopleCount] = useState(null); // For group packages
  const [guestNames, setGuestNames] = useState([]); // Names of all guests
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [activeCategory, setActiveCategory] = useState("");
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if service requires people count selection (group packages only, excluding couples and fixed-count services)
  const requiresPeopleCount = (service) => {
    if (!service || !service.minPeople) return false;
    // Only show person count for services with 3+ people OR services with flexible count (min != max)
    // This excludes couples (2 people fixed) and includes group packages like amigas, familia, eventos
    return service.minPeople >= 3 || (service.minPeople !== service.maxPeople && service.minPeople >= 2);
  };

  // Check if form is complete and valid
  const isFormComplete =
    formData.name.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.email.includes('@') &&
    formData.phone.trim().length === 10 &&
    /^\d+$/.test(formData.phone.trim());

  // Load settings
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error("Error loading settings:", err));
  }, []);

  // Rotate loading messages every 5 seconds
  useEffect(() => {
    if (loadingTimes) {
      setLoadingMessage(0);
      const interval = setInterval(() => {
        setLoadingMessage((prev) => (prev + 1) % 2);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [loadingTimes]);

  // Fetch available times when date is selected
  useEffect(() => {
    if (selectedDate && selectedService && settings) {
      setLoadingTimes(true);
      fetch("/api/calendar/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          service: selectedService,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          // Generate time slots and filter out unavailable ones
          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const dayName = dayNames[selectedDate.getDay()];
          const daySettings = settings.workingHours[dayName];

          if (!daySettings?.enabled) {
            setAvailableTimes([]);
            setLoadingTimes(false);
            return;
          }

          // Parse start and end times
          const [startHour] = daySettings.start.split(":").map(Number);
          const [endHour] = daySettings.end.split(":").map(Number);

          const slots = [];
          for (let hour = startHour; hour < endHour; hour++) {
            const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const period = hour < 12 ? "AM" : "PM";
            slots.push(`${hour12}:00 ${period}`);
            slots.push(`${hour12}:30 ${period}`);
          }

          // Filter out unavailable slots
          const unavailableSlots = data.unavailableSlots || [];
          const minimumAdvanceHours = settings.minimumAdvanceBookingHours || 0;

          const availableSlots = slots.filter((timeSlot) => {
            const [timeStr, period] = timeSlot.split(" ");
            const [hours, minutes] = timeStr.split(":").map(Number);
            let hours24 = hours;
            if (period === "PM" && hours !== 12) hours24 = hours + 12;
            else if (period === "AM" && hours === 12) hours24 = 0;

            const slotStart = new Date(selectedDate);
            slotStart.setHours(hours24, minutes, 0, 0);

            // Check if in the past
            if (slotStart <= new Date()) return false;

            // Check minimum advance booking time
            const now = new Date();
            const hoursUntilSlot = (slotStart - now) / (1000 * 60 * 60);
            if (hoursUntilSlot < minimumAdvanceHours) return false;

            const slotEnd = new Date(slotStart.getTime() + selectedService.duration * 60000);

            // Check for overlap with booked slots
            for (const unavailable of unavailableSlots) {
              const bookedStart = new Date(unavailable.start);
              const bookedEnd = new Date(unavailable.end);
              if (slotStart < bookedEnd && slotEnd > bookedStart) return false;
            }

            return true;
          });

          setAvailableTimes(availableSlots);
          setLoadingTimes(false);
        })
        .catch((err) => {
          console.error("Error fetching times:", err);
          setLoadingTimes(false);
        });
    }
  }, [selectedDate, selectedService, settings]);

  // Generate categories dynamically from settings
  const getCategoryDisplayName = (categoryId) => {
    const nameMap = {
      individual: "Experiencias Individuales",
      parejas: "Experiencias en Pareja",
      amigas: "Entre Amigas",
      familia: "En Familia",
      eventos: "Eventos Especiales",
      premium: "Premium",
      elite: "Elite"
    };
    // If not in map, capitalize first letter
    return nameMap[categoryId] || categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  };

  const getCategoryRoom = (categoryId) => {
    // Individual uses individual room, everything else uses principal
    return categoryId === "individual" ? "individual" : "principal";
  };

  const categories = settings && settings.services
    ? Object.keys(settings.services).map(categoryId => ({
        id: categoryId,
        name: getCategoryDisplayName(categoryId),
        room: getCategoryRoom(categoryId)
      }))
    : [];

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const formatPrice = (price) => {
    return `$${(price / 1000).toFixed(0)}k COP`;
  };

  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateAvailable = (date) => {
    if (!date || !settings) return false;
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[date.getDay()];
    const daySettings = settings.workingHours[dayName];
    return daySettings?.enabled === true;
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    // If service requires people count, show people selector first
    if (requiresPeopleCount(service)) {
      setDateTimeSubStep('people');
      setPeopleCount(null); // Reset count
    } else {
      setDateTimeSubStep('date');
      setPeopleCount(null); // Not needed for this service
    }
    setStep(2);
  };

  const handlePeopleCountSelect = (count) => {
    setPeopleCount(count);
    // Skip guest names and go directly to date selection
    setDateTimeSubStep('date');
  };

  // Handle guest names completion
  const handleGuestNamesComplete = () => {
    setStep(3); // Go to contact details form
  };

  // Set first category as active when settings load
  useEffect(() => {
    if (settings && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [settings]);

  // Auto-select service when preselectedService is provided
  useEffect(() => {
    if (settings && preselectedService && !selectedService) {
      // Search for the service across all categories
      for (const categoryId of Object.keys(settings.services)) {
        const services = settings.services[categoryId].filter(s => s.enabled);
        const matchingService = services.find(s =>
          s.name.toLowerCase() === preselectedService.toLowerCase()
        );

        if (matchingService) {
          setSelectedService(matchingService);
          setSelectedCategory(categoryId);
          setActiveCategory(categoryId);

          // Always start with date selection
          setDateTimeSubStep('date');

          break;
        }
      }
    }
  }, [settings, preselectedService]);

  const handleDateSelect = (date) => {
    if (isPastDate(date) || !isDateAvailable(date)) return;
    setSelectedDate(date);
    setDateTimeSubStep('time'); // Move to time selection view
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    // If service requires people count, go to people selection, otherwise go to details
    if (selectedService && requiresPeopleCount(selectedService)) {
      setDateTimeSubStep('people');
    } else {
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Revalidate the selected time before submitting
    const [timeStr, period] = selectedTime.split(" ");
    const [hours, minutes] = timeStr.split(":").map(Number);
    let hours24 = hours;
    if (period === "PM" && hours !== 12) hours24 = hours + 12;
    else if (period === "AM" && hours === 12) hours24 = 0;

    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours24, minutes, 0, 0);

    const now = new Date();
    const hoursUntilSlot = (slotStart - now) / (1000 * 60 * 60);
    const minimumAdvanceHours = settings.minimumAdvanceBookingHours || 0;

    if (hoursUntilSlot < minimumAdvanceHours) {
      setErrorModal({
        show: true,
        message: `Este horario ya no está disponible. Debes reservar con al menos ${minimumAdvanceHours} horas de anticipación.`
      });
      setIsSubmitting(false);
      return;
    }

    if (slotStart <= now) {
      setErrorModal({
        show: true,
        message: 'Este horario ya no está disponible. Por favor selecciona otro horario.'
      });
      setIsSubmitting(false);
      return;
    }

    const bookingData = {
      service: selectedService,
      date: selectedDate.toISOString(),
      time: selectedTime,
      customerInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
      guestNames: guestNames.filter(name => name.trim()),
      peopleCount: peopleCount,
    };

    try {
      const response = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        setStep(4);
      } else {
        const error = await response.json();
        console.error("Booking error:", error);
        setErrorModal({ show: true, message: error.error || 'Error desconocido' });
      }
    } catch (error) {
      console.error("Booking error:", error);
      setErrorModal({ show: true, message: 'Error de conexión al crear la reserva' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings) {
    return (
      <div className="calendly-loading">
        <div className="calendly-spinner"></div>
      </div>
    );
  }

  return (
    <div className="calendly-container">
      <div className="calendly-layout">
        {/* Left sidebar - Info panel */}
        <div className="calendly-sidebar">
          <div className="calendly-brand">
            <h1>Miosotys Spa</h1>
            <p>Experiencias de bienestar</p>
          </div>

          {selectedService && (
            <div className="calendly-selection-info">
              <h3>{selectedService.name}</h3>
              <div className="calendly-info-items">
                <div className="calendly-info-item">
                  <Clock className="w-4 h-4" />
                  <span>{selectedService.duration} minutos</span>
                </div>
                <div className="calendly-info-item">
                  <MapPin className="w-4 h-4" />
                  <span>Miosotys Spa, Colombia</span>
                </div>
              </div>
              {selectedDate && selectedTime && (
                <div className="calendly-datetime-display">
                  <CalendarIcon className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">
                      {selectedDate.toLocaleDateString("es-CO", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-sm" style={{color: 'rgb(102, 102, 102)'}}>{selectedTime}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel - Booking flow */}
        <div className="calendly-main">
          <Card className="calendly-card">
            {/* Step 1: Select Service */}
            {step === 1 && (
              <div className="calendly-step">
                {!preselectedService && (
                  <button
                    onClick={onBack}
                    className="calendly-back-btn"
                    title="Volver al inicio"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="calendly-step-title">Selecciona tu experiencia</h2>
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="calendly-tabs">
                  <TabsList className="calendly-tabs-list">
                    {categories.map((category) => {
                      const isRoomEnabled = settings.rooms[category.room]?.enabled;
                      const services = settings.services?.[category.id]?.filter((s) => s.enabled) || [];

                      if (!isRoomEnabled || services.length === 0) return null;

                      return (
                        <TabsTrigger key={category.id} value={category.id} className="calendly-tab-trigger">
                          {category.name}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <div className="calendly-tabs-content-wrapper">
                    {categories.map((category) => {
                      const isRoomEnabled = settings.rooms[category.room]?.enabled;
                      const services = settings.services?.[category.id]?.filter((s) => s.enabled) || [];

                      if (!isRoomEnabled || services.length === 0) return null;

                      return (
                        <TabsContent key={category.id} value={category.id} className="calendly-tab-content">
                          <div className="calendly-services-list">
                            {services.map((service) => (
                              <button
                                key={service.id}
                                onClick={() => handleServiceSelect(service)}
                                className="calendly-service-card"
                              >
                                <div className="calendly-service-info">
                                  <h4>{service.name}</h4>
                                  <div className="calendly-service-meta">
                                    <span>{service.duration} min</span>
                                    <span>•</span>
                                    <span>{formatPrice(service.price)}</span>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5" style={{color: 'rgb(136, 136, 136)'}} />
                              </button>
                            ))}
                          </div>
                        </TabsContent>
                      );
                    })}
                  </div>
                </Tabs>
              </div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
              <div className="calendly-step">
                {/* Back button logic based on current substep */}
                {dateTimeSubStep === 'time' && (
                  <button
                    onClick={() => setDateTimeSubStep('date')}
                    className="calendly-back-btn"
                    title="Volver a selección de fecha"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {dateTimeSubStep === 'people' && (
                  <button
                    onClick={() => setDateTimeSubStep('time')}
                    className="calendly-back-btn"
                    title="Volver a selección de hora"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {dateTimeSubStep === 'guests' && (
                  <button
                    onClick={() => setDateTimeSubStep('people')}
                    className="calendly-back-btn"
                    title="Volver a selección de personas"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="calendly-step-title">
                  {dateTimeSubStep === 'people'
                    ? '¿Cuántas personas asistirán?'
                    : dateTimeSubStep === 'guests'
                    ? 'Nombres de los invitados'
                    : dateTimeSubStep === 'date'
                    ? 'Selecciona una fecha'
                    : 'Selecciona una hora'}
                </h2>

                {/* People count selection view */}
                {dateTimeSubStep === 'people' && selectedService && (
                  <div className="calendly-unified-picker">
                    <div className="calendly-people-selector">
                      <div className="calendly-people-grid">
                        {Array.from(
                          { length: (selectedService.maxPeople || 6) - (selectedService.minPeople || 2) + 1 },
                          (_, i) => (selectedService.minPeople || 2) + i
                        ).map((count) => (
                          <button
                            key={count}
                            onClick={() => handlePeopleCountSelect(count)}
                            className="calendly-people-option"
                          >
                            <span className="calendly-people-count">{count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Guest names collection view */}
                {dateTimeSubStep === 'guests' && selectedService && (
                  <div className="calendly-unified-picker">
                    <div className="calendly-guests-form">
                      <p className="calendly-guests-description">
                        Por favor ingresa el nombre completo de cada persona que asistirá a {selectedService.name}
                      </p>
                      <div className="calendly-guests-grid">
                        {guestNames.map((name, index) => (
                          <div key={index} className="calendly-guest-input-group">
                            <label htmlFor={`guest-${index}`}>
                              Persona {index + 1}
                            </label>
                            <input
                              type="text"
                              id={`guest-${index}`}
                              value={name}
                              onChange={(e) => {
                                const newNames = [...guestNames];
                                newNames[index] = e.target.value;
                                setGuestNames(newNames);
                              }}
                              placeholder="Nombre completo"
                              className="calendly-guest-input"
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleGuestNamesComplete}
                        disabled={guestNames.some(name => !name.trim())}
                        className="calendly-guests-continue-btn"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {/* Date selection view */}
                {dateTimeSubStep === 'date' && (
                  <div className="calendly-unified-picker">
                    <div className="calendly-unified-calendar">
                      <div className="calendly-calendar-header">
                        <button
                          onClick={() =>
                            setCurrentMonth(
                              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                            )
                          }
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3>
                          {currentMonth.toLocaleDateString("es-CO", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h3>
                        <button
                          onClick={() =>
                            setCurrentMonth(
                              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                            )
                          }
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="calendly-calendar-grid">
                        <div className="calendly-weekdays">
                          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                            <div key={day} className="calendly-weekday">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="calendly-days">
                          {getDaysInMonth(currentMonth).map((date, index) => {
                            if (!date) {
                              return <div key={index} className="calendly-day empty"></div>;
                            }

                            const isToday =
                              date.toDateString() === new Date().toDateString();
                            const isSelected =
                              selectedDate &&
                              date.toDateString() === selectedDate.toDateString();
                            const isPast = isPastDate(date);
                            const isAvailable = isDateAvailable(date);

                            if (isPast || !isAvailable) {
                              return (
                                <div key={index} className="calendly-day unavailable">
                                  {date.getDate()}
                                </div>
                              );
                            }

                            return (
                              <button
                                key={index}
                                onClick={() => handleDateSelect(date)}
                                className={`calendly-day ${isToday ? "today" : ""} ${
                                  isSelected ? "selected" : ""
                                }`}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timezone display */}
                      <div className="calendly-timezone">
                        <Globe className="w-4 h-4" />
                        <span>Ibagué, Colombia (UTC-5)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Time selection view */}
                {dateTimeSubStep === 'time' && selectedDate && (
                  <div className="calendly-unified-picker">
                    <div className="calendly-unified-times" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <button
                          onClick={() => {
                            setDateTimeSubStep('date');
                            setSelectedTime(null);
                          }}
                          className="calendly-back-btn"
                          style={{ marginRight: '0.5rem' }}
                          title="Volver a selección de fecha"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="calendly-times-title" style={{ margin: 0 }}>
                          {selectedDate.toLocaleDateString("es-CO", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </h3>
                      </div>
                      {loadingTimes ? (
                        <div className="calendly-loading-times">
                          <div className="calendly-spinner-small"></div>
                          <p className="calendly-loading-message">
                            {loadingMessage === 0
                              ? "Cargando horarios disponibles..."
                              : "Casi listo, un momento más..."}
                          </p>
                        </div>
                      ) : availableTimes.length > 0 ? (
                        <div className="calendly-time-slots">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              onClick={() => handleTimeSelect(time)}
                              className="calendly-time-slot"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="calendly-no-times">
                          No hay horarios disponibles para esta fecha
                        </p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Step 3: Enter Details */}
            {step === 3 && (
              <div className="calendly-step">
                <button
                  onClick={() => {
                    setStep(2);
                    // Go back to guest names if service requires people count, otherwise to time selection
                    if (selectedService && requiresPeopleCount(selectedService)) {
                      setDateTimeSubStep('guests');
                    } else {
                      setDateTimeSubStep('time');
                      setSelectedTime(null);
                    }
                  }}
                  className="calendly-back-btn"
                  title="Volver"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="calendly-step-title">Ingresa tus datos</h2>

                <form onSubmit={handleSubmit} className="calendly-form">
                  <div className="calendly-form-group">
                    <label htmlFor="name">Nombre completo *</label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div className="calendly-form-group">
                    <label htmlFor="email">Correo electrónico *</label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="calendly-form-group">
                    <label htmlFor="phone">Teléfono (WhatsApp) *</label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="3001234567"
                    />
                  </div>

                  <Button
                    type="submit"
                    className={`calendly-submit-btn ${isFormComplete && !isSubmitting ? 'calendly-submit-btn-active' : ''}`}
                    disabled={!isFormComplete || isSubmitting}
                  >
                    {isSubmitting ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="calendly-spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div>
                        <span>Confirmando reserva...</span>
                      </div>
                    ) : (
                      'Confirmar reserva'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="calendly-step calendly-confirmation">
                <div className="calendly-success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{width: '50px', height: '50px'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="calendly-step-title">¡Reserva confirmada!</h2>
                <p className="calendly-confirmation-text">
                  Recibirás un mensaje de confirmación por WhatsApp con todos los detalles de tu
                  cita.
                </p>
                <div className="calendly-confirmation-details">
                  <h3>{selectedService.name}</h3>
                  <p>
                    {selectedDate.toLocaleDateString("es-CO", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p style={{color: 'rgb(17, 17, 17)', fontWeight: 600}}>{selectedTime}</p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Hacer otra reserva
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.show && (
        <div className="calendly-modal-overlay" onClick={() => setErrorModal({ show: false, message: "" })}>
          <div className="calendly-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendly-modal-icon-error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="calendly-modal-title">Error al crear la reserva</h3>
            <p className="calendly-modal-message">{errorModal.message}</p>
            <Button
              onClick={() => setErrorModal({ show: false, message: "" })}
              className="calendly-modal-button"
            >
              Entendido
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
