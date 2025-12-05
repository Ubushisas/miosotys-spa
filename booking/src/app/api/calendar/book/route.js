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
    const bookingCheck = await isBookingAllowed(dateObj, service);
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

    // Calculate total price based on number of people
    const peopleCount = guestNames && guestNames.length > 0 ? guestNames.length : (service.minPeople ? service.minPeople : 1);
    const totalPrice = service.price * peopleCount;
    const depositAmount = totalPrice * 0.5;

    // Save to Google Sheets
    await saveAppointmentToSheet({
      customerInfo,
      service,
      date,
      time,
      guestNames,
      googleEventId: booking.id,
      depositAmount,
      totalPrice,
      peopleCount,
    });

    // Send WhatsApp confirmation message
    try {
      const formattedDate = new Date(date).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Format prices
      const formattedTotal = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(totalPrice);

      const formattedDeposit = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(depositAmount);

      const confirmationMessage = `¡Hola ${customerInfo.name}! ✨\n\nTu reserva ha sido confirmada:\n\n📅 Servicio: ${service.name}\n⏰ Fecha: ${formattedDate}\n🕐 Hora: ${time}\n👥 Personas: ${peopleCount}\n💰 Total: ${formattedTotal}\n💳 Depósito (50%): ${formattedDeposit}\n📍 Myosotis Spa, Colombia\n\n¡Te esperamos! 🌿`;

      // Use correct production URL for Vercel deployment
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                      'http://localhost:3002';

      await fetch(`${baseUrl}/api/whatsapp/send-message`, {
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
