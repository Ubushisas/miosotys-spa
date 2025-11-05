import { NextResponse } from 'next/server';
import { createBooking, checkAvailability } from '@/lib/calendar';
import { saveAppointmentToSheet } from '@/lib/google-sheets';
import { isBookingAllowed } from '@/lib/calendar-settings';

export async function POST(request) {
  try {
    const { date, time, service, guestNames, customerInfo } = await request.json();

    if (!date || !time || !service) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert date string to Date object and incorporate the time
    const dateObj = new Date(date);

    // Parse the time string (e.g., "2:00 PM") and set it on the date
    const [timeStr, period] = time.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    let hours24 = hours;
    if (period === 'PM' && hours !== 12) hours24 = hours + 12;
    else if (period === 'AM' && hours === 12) hours24 = 0;

    dateObj.setHours(hours24, minutes, 0, 0);

    // Check if booking is allowed based on settings
    const bookingCheck = isBookingAllowed(dateObj, service);
    if (!bookingCheck.allowed) {
      return NextResponse.json(
        { error: bookingCheck.reason },
        { status: 403 }
      );
    }

    // Double-check availability before creating booking
    const isAvailable = await checkAvailability(dateObj, time, service);

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Create the booking
    const booking = await createBooking(
      dateObj,
      time,
      service,
      guestNames || [],
      customerInfo || {}
    );

    // Save to Google Sheets
    const depositAmount = service.price ? service.price * 0.5 : 0;
    await saveAppointmentToSheet({
      customerInfo,
      service,
      date,
      time,
      guestNames,
      googleEventId: booking.id,
      depositAmount,
    });

    // Send WhatsApp confirmation message
    try {
      const formattedDate = new Date(date).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const confirmationMessage = `¡Hola ${customerInfo.name}! ✨\n\nTu reserva ha sido confirmada:\n\n📅 Servicio: ${service.name}\n⏰ Fecha: ${formattedDate}\n🕐 Hora: ${time}\n📍 Miosotys Spa, Colombia\n\n¡Te esperamos! 🌿`;

      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: customerInfo.phone,
          message: confirmationMessage,
        }),
      });
    } catch (whatsappError) {
      console.error('Error sending WhatsApp confirmation:', whatsappError);
      // Don't fail the booking if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      booking,
      message: 'Reserva creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
