"use client";
import { useState, useEffect } from "react";
import "./BookingFlow.css";
import Copy from "@/components/Copy/Copy";
import AnimatedButton from "@/components/AnimatedButton/AnimatedButton";
import Calendar from "@/components/Calendar/Calendar";

// Services will be loaded from settings

const BookingFlow = () => {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [service, setService] = useState(null);
  const [numPeople, setNumPeople] = useState(2);
  const [guestNames, setGuestNames] = useState([]);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [errors, setErrors] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [customerErrors, setCustomerErrors] = useState([]);
  const [bookingStatus, setBookingStatus] = useState(null); // null, 'loading', 'success', 'error'
  const [bookingError, setBookingError] = useState("");
  const [settings, setSettings] = useState(null);

  // Load settings on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error loading settings:', err));
  }, []);

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setStep(2);
  };

  const handleServiceSelect = (svc) => {
    setService(svc);
    // Always go to calendar first
    setStep(3);
  };

  const handlePeopleSelect = (num) => {
    setNumPeople(num);
    setGuestNames([]); // No need to collect guest names
    setStep(4.5); // Go to contact info
  };

  const handleGuestNameChange = (index, value) => {
    const newNames = [...guestNames];
    newNames[index] = value;
    setGuestNames(newNames);
  };

  const handleContinueToCalendar = () => {
    // Validate all names are filled
    const emptyIndices = [];
    guestNames.forEach((name, idx) => {
      if (name.trim() === "") {
        emptyIndices.push(idx);
      }
    });

    if (emptyIndices.length > 0) {
      setErrors(emptyIndices);
      return;
    }

    setErrors([]);
    setStep(4);
  };

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContinueToConfirmation = () => {
    // Validate customer info
    const requiredFields = ['name', 'phone', 'email'];
    const empty = requiredFields.filter(field => !customerInfo[field].trim());

    if (empty.length > 0) {
      setCustomerErrors(empty);
      return;
    }

    setCustomerErrors([]);
    setStep(5); // Confirmation step
  };

  const handleConfirmBooking = async () => {
    setBookingStatus('loading');
    setBookingError('');

    try {
      const response = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDateTime.date.toISOString(),
          time: selectedDateTime.time,
          service,
          guestNames,
          customerInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la reserva');
      }

      // Send WhatsApp confirmation
      try {
        await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: customerInfo.phone,
            type: 'confirmation',
            bookingDetails: {
              customerName: customerInfo.name,
              serviceName: service.name,
              date: selectedDateTime.date.toLocaleDateString('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }),
              time: selectedDateTime.time,
              numberOfPeople: service.minPeople ? numPeople : 1,
              guestNames: guestNames.filter(n => n),
              deposit: service.price * 0.5,
            },
          }),
        });
        console.log('✅ WhatsApp confirmation sent');
      } catch (whatsappError) {
        console.error('⚠️ WhatsApp notification failed:', whatsappError);
        // Don't fail the booking if WhatsApp fails
      }

      setBookingStatus('success');
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus('error');
      setBookingError(error.message);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="booking-flow-container">
      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="booking-step">
          <Copy delay={0.1}>
            <p className="mono">Paso 1 de 4</p>
          </Copy>
          <Copy delay={0.2}>
            <h2>¿Qué tipo de experiencia buscas?</h2>
          </Copy>

          <div className="category-grid">
            <button
              className={`category-card ${settings && !settings.rooms?.individual?.enabled ? 'disabled' : ''}`}
              onClick={() => handleCategorySelect("individual")}
              disabled={settings && !settings.rooms?.individual?.enabled}
            >
              <h3>Individual</h3>
              <p>Masajes, faciales y tratamientos personales</p>
            </button>
            <button
              className={`category-card ${settings && !settings.rooms?.principal?.enabled ? 'disabled' : ''}`}
              onClick={() => handleCategorySelect("parejas")}
              disabled={settings && !settings.rooms?.principal?.enabled}
            >
              <h3>Para Parejas</h3>
              <p>Experiencias románticas para dos</p>
            </button>
            <button
              className={`category-card ${settings && !settings.rooms?.principal?.enabled ? 'disabled' : ''}`}
              onClick={() => handleCategorySelect("amigas")}
              disabled={settings && !settings.rooms?.principal?.enabled}
            >
              <h3>Para Amigas</h3>
              <p>Momentos especiales entre amigas</p>
            </button>
            <button
              className={`category-card ${settings && !settings.rooms?.principal?.enabled ? 'disabled' : ''}`}
              onClick={() => handleCategorySelect("familia")}
              disabled={settings && !settings.rooms?.principal?.enabled}
            >
              <h3>Para Familias</h3>
              <p>Bienestar familiar compartido</p>
            </button>
            <button
              className={`category-card ${settings && !settings.rooms?.principal?.enabled ? 'disabled' : ''}`}
              onClick={() => handleCategorySelect("eventos")}
              disabled={settings && !settings.rooms?.principal?.enabled}
            >
              <h3>Eventos Especiales</h3>
              <p>Celebraciones y ocasiones únicas</p>
            </button>
          </div>

          <button className="back-button" onClick={() => window.location.href = '/'}>
            ← Volver al inicio
          </button>
        </div>
      )}

      {/* Step 2: Service Selection */}
      {step === 2 && category && settings?.services && (
        <div className="booking-step">
          <Copy delay={0.1}>
            <p className="mono">Paso 2 de 4</p>
          </Copy>
          <Copy delay={0.2}>
            <h2>Elige tu servicio</h2>
          </Copy>

          <div className="service-selection">
            {settings.services[category]?.filter(svc => svc.enabled).map((svc, idx) => (
              <button
                key={svc.id}
                className="service-option"
                onClick={() => handleServiceSelect(svc)}
              >
                <div className="service-option-content">
                  <h3>{svc.name}</h3>
                  <div className="service-option-details">
                    <span>{svc.duration} min</span>
                    <span>{formatPrice(svc.price)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button className="back-button" onClick={() => setStep(1)}>
            ← Volver a categorías
          </button>
        </div>
      )}

      {/* Step 3: Calendar (for all services) */}
      {step === 3 && service && (
        <div className="booking-step">
          <Copy delay={0.1}>
            <p className="mono">Paso 3 de {service.minPeople ? '5' : '4'}</p>
          </Copy>
          {service && (
            <p className="service-name-indicator">{service.name}</p>
          )}
          <Copy delay={0.2}>
            <h2>Selecciona fecha y hora</h2>
          </Copy>

          <Calendar
            service={service}
            onSelectDateTime={(dateTime) => setSelectedDateTime(dateTime)}
          />

          {selectedDateTime && (
            <div className="confirmation-actions">
              <div onClick={() => setStep(service.minPeople ? 4 : 4.5)}>
                <AnimatedButton
                  label="Continuar"
                  animate={false}
                />
              </div>
            </div>
          )}

          <button className="back-button" onClick={() => setStep(2)}>
            ← Volver a servicios
          </button>
        </div>
      )}

      {/* Step 3.5: Guest Names */}
      {step === 3.5 && service && guestNames.length > 0 && (
        <div className="booking-step">
          <Copy delay={0.1}>
            <p className="mono">Paso 3 de 4</p>
          </Copy>
          {service && (
            <p className="service-name-indicator">{service.name}</p>
          )}
          <Copy delay={0.2}>
            <h2>Nombres de las personas</h2>
          </Copy>
          <p className="step-subtitle">
            Por favor ingresa los nombres de todas las personas que asistirán
          </p>

          <div className="guest-names-form">
            {guestNames.map((name, idx) => (
              <div key={idx} className={`form-group ${errors.includes(idx) ? 'error' : ''}`}>
                <label>Persona {idx + 1}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    handleGuestNameChange(idx, e.target.value);
                    // Clear error when user starts typing
                    if (errors.includes(idx)) {
                      setErrors(errors.filter(i => i !== idx));
                    }
                  }}
                  placeholder="Nombre completo"
                  required
                />
                {errors.includes(idx) && (
                  <span className="error-message">* Campo obligatorio</span>
                )}
              </div>
            ))}
          </div>

          <div className="step-actions">
            <button className="back-button" onClick={() => setStep(3)}>
              ← Volver
            </button>
            <div onClick={handleContinueToCalendar}>
              <AnimatedButton
                label="Continuar"
                animate={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Number of People (for group services only) */}
      {step === 4 && service && service.minPeople && selectedDateTime && (
        <div className="booking-step">
          <Copy delay={0.1}>
            <p className="mono">Paso 4 de 5</p>
          </Copy>
          {service && (
            <p className="service-name-indicator">{service.name}</p>
          )}
          <Copy delay={0.2}>
            <h2>¿Cuántas personas asistirán?</h2>
          </Copy>
          <p className="step-subtitle">
            {service.minPeople} a {service.maxPeople} personas
          </p>

          <div className="people-selector">
            {Array.from(
              { length: service.maxPeople - service.minPeople + 1 },
              (_, i) => service.minPeople + i
            ).map((num) => (
              <button
                key={num}
                className={`people-option ${numPeople === num ? "active" : ""}`}
                onClick={() => handlePeopleSelect(num)}
              >
                <span className="people-number">{num}</span>
                <span className="people-label">
                  {num === 1 ? "persona" : "personas"}
                </span>
              </button>
            ))}
          </div>

          <button className="back-button" onClick={() => setStep(3)}>
            ← Volver al calendario
          </button>
        </div>
      )}

      {/* Step 4.5: Customer Information */}
      {step === 4.5 && service && selectedDateTime && (
        <div className="booking-step">
          <Copy delay={0.1}>
            <p className="mono">Paso {service.minPeople ? '5' : '4'} de {service.minPeople ? '5' : '4'}</p>
          </Copy>
          {service && (
            <p className="service-name-indicator">{service.name}</p>
          )}
          <Copy delay={0.2}>
            <h2>Información de contacto</h2>
          </Copy>
          <p className="step-subtitle">
            Por favor ingresa tus datos de contacto para confirmar la reserva
          </p>

          <div className="guest-names-form">
            <div className={`form-group ${customerErrors.includes('name') ? 'error' : ''}`}>
              <label>Nombre completo</label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => {
                  handleCustomerInfoChange('name', e.target.value);
                  if (customerErrors.includes('name')) {
                    setCustomerErrors(customerErrors.filter(f => f !== 'name'));
                  }
                }}
                placeholder="Tu nombre completo"
                required
              />
              {customerErrors.includes('name') && (
                <span className="error-message">* Campo obligatorio</span>
              )}
            </div>

            <div className={`form-group ${customerErrors.includes('phone') ? 'error' : ''}`}>
              <label>Teléfono</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => {
                  handleCustomerInfoChange('phone', e.target.value);
                  if (customerErrors.includes('phone')) {
                    setCustomerErrors(customerErrors.filter(f => f !== 'phone'));
                  }
                }}
                placeholder="Tu número de teléfono"
                required
              />
              {customerErrors.includes('phone') && (
                <span className="error-message">* Campo obligatorio</span>
              )}
            </div>

            <div className={`form-group ${customerErrors.includes('email') ? 'error' : ''}`}>
              <label>Correo electrónico</label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => {
                  handleCustomerInfoChange('email', e.target.value);
                  if (customerErrors.includes('email')) {
                    setCustomerErrors(customerErrors.filter(f => f !== 'email'));
                  }
                }}
                placeholder="tucorreo@ejemplo.com"
                required
              />
              {customerErrors.includes('email') && (
                <span className="error-message">* Campo obligatorio</span>
              )}
            </div>
          </div>

          <div className="step-actions">
            <button className="back-button" onClick={() => setStep(service.minPeople ? 4 : 3)}>
              ← Volver
            </button>
            <div onClick={handleContinueToConfirmation}>
              <AnimatedButton
                label="Continuar"
                animate={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Final Confirmation */}
      {step === 5 && service && selectedDateTime && (
        <div className="booking-step">
          {bookingStatus === 'success' ? (
            <div className="confirmation-message">
              <Copy delay={0.1}>
                <p className="mono">Reserva confirmada</p>
              </Copy>
              <Copy delay={0.2}>
                <h3>¡Tu reserva ha sido confirmada!</h3>
              </Copy>
              <Copy delay={0.3}>
                <p>
                  Hemos enviado un correo de confirmación a <strong>{customerInfo.email}</strong> con
                  todos los detalles de tu reserva.
                </p>
                <p>
                  Recibirás un recordatorio 24 horas antes de tu cita.
                </p>
              </Copy>
              <div className="confirmation-note">
                <p>¡Nos vemos pronto en Miosotys Spa!</p>
              </div>
              <div className="confirmation-actions">
                <div onClick={() => window.location.href = '/'}>
                  <AnimatedButton
                    label="Volver al inicio"
                    animate={false}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <Copy delay={0.1}>
                <p className="mono">Confirmación final</p>
              </Copy>
              {service && (
                <p className="service-name-indicator">{service.name}</p>
              )}
              <Copy delay={0.2}>
                <h2>Revisa tu reserva</h2>
              </Copy>

              <div className="booking-summary">
                <h3>Resumen de tu reserva</h3>
                <div className="summary-item">
                  <span>Servicio:</span>
                  <span>{service.name}</span>
                </div>
                <div className="summary-item">
                  <span>Fecha:</span>
                  <span>
                    {selectedDateTime.date.toLocaleDateString('es-CO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="summary-item">
                  <span>Hora:</span>
                  <span>{selectedDateTime.time}</span>
                </div>
                <div className="summary-item">
                  <span>Duración:</span>
                  <span>{service.duration} minutos</span>
                </div>
                {service.minPeople && (
                  <>
                    <div className="summary-item">
                      <span>Personas:</span>
                      <span>{numPeople}</span>
                    </div>
                    {guestNames.length > 0 && (
                      <div className="summary-item">
                        <span>Nombres:</span>
                        <span>{guestNames.filter((n) => n).join(", ")}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="summary-item">
                  <span>Nombre:</span>
                  <span>{customerInfo.name}</span>
                </div>
                <div className="summary-item">
                  <span>Teléfono:</span>
                  <span>{customerInfo.phone}</span>
                </div>
                <div className="summary-item">
                  <span>Email:</span>
                  <span>{customerInfo.email}</span>
                </div>
                <div className="summary-item total">
                  <span>Total:</span>
                  <span>{formatPrice(service.price)}</span>
                </div>
                <div className="summary-item deposit">
                  <span>Depósito requerido (50%):</span>
                  <span>{formatPrice(service.price * 0.5)}</span>
                </div>
              </div>

              {bookingStatus === 'error' && (
                <div className="error-message" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '1rem' }}>
                  Error: {bookingError}
                </div>
              )}

              <div className="step-actions">
                <button className="back-button" onClick={() => setStep(4.5)}>
                  ← Volver
                </button>
                <div onClick={handleConfirmBooking}>
                  <AnimatedButton
                    label={bookingStatus === 'loading' ? 'Procesando...' : 'Confirmar reserva'}
                    animate={false}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingFlow;
