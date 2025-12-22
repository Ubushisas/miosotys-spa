import nodemailer from 'nodemailer';

/**
 * Create email transporter using Gmail
 * Uses App Password for authentication
 */
function createTransporter() {
  // Use Gmail SMTP
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'myosotisbymo@gmail.com',
      pass: process.env.EMAIL_PASSWORD, // Gmail App Password
    },
  });
}

/**
 * Send booking confirmation email to spa owner
 */
export async function sendOwnerNotification(bookingDetails) {
  const {
    customerInfo,
    service,
    date,
    time,
    guestNames = [],
    totalPrice,
    depositAmount,
    peopleCount,
  } = bookingDetails;

  const transporter = createTransporter();

  // Format date
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
    minimumFractionDigits: 0,
  }).format(totalPrice);

  const formattedDeposit = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(depositAmount);

  // Build guest list
  const guestList = guestNames.length > 0
    ? `<p><strong>Asistentes:</strong><br>${guestNames.map((name, i) => `${i + 1}. ${name}`).join('<br>')}</p>`
    : '';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 5px; }
        .label { color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .value { font-size: 16px; font-weight: bold; color: #333; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🆕 Nueva Reserva</h1>
          <p style="margin: 5px 0 0 0;">Myosotis Spa</p>
        </div>

        <div class="content">
          <div class="alert">
            <strong>⚠️ Acción Requerida:</strong> Nueva reserva confirmada. Revisa los detalles a continuación.
          </div>

          <div class="info-box">
            <div class="label">Servicio</div>
            <div class="value">${service.name}</div>
          </div>

          <div class="info-box">
            <div class="label">Fecha y Hora</div>
            <div class="value">${formattedDate}</div>
            <div class="value">${time}</div>
          </div>

          <div class="info-box">
            <div class="label">Cliente</div>
            <div class="value">${customerInfo.name}</div>
            <p style="margin: 10px 0 0 0;">
              📱 <a href="tel:${customerInfo.phone}">${customerInfo.phone}</a><br>
              📧 <a href="mailto:${customerInfo.email}">${customerInfo.email}</a>
            </p>
          </div>

          ${guestList ? `<div class="info-box">${guestList}</div>` : ''}

          <div class="info-box">
            <div class="label">Información Financiera</div>
            <div class="value">
              Personas: ${peopleCount}<br>
              Total: ${formattedTotal}<br>
              Depósito (50%): ${formattedDeposit}
            </div>
          </div>

          <div class="info-box">
            <div class="label">Duración</div>
            <div class="value">${service.duration} minutos</div>
          </div>

          <div class="footer">
            <p>Este evento también fue agregado al calendario de Google.</p>
            <p>Sistema de Reservas Myosotis Spa</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Myosotis Spa - Reservas" <${process.env.EMAIL_USER || 'myosotisbymo@gmail.com'}>`,
    to: 'myosotisbymo@gmail.com', // Spa owner email
    subject: `🆕 Nueva Reserva: ${service.name} - ${formattedDate}`,
    html: emailHtml,
    text: `Nueva Reserva en Myosotis Spa

Servicio: ${service.name}
Fecha: ${formattedDate}
Hora: ${time}

Cliente: ${customerInfo.name}
Teléfono: ${customerInfo.phone}
Email: ${customerInfo.email}

Personas: ${peopleCount}
Total: ${formattedTotal}
Depósito: ${formattedDeposit}

Este evento también fue agregado al calendario de Google.
`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to spa owner:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email to spa owner:', error);
    throw error;
  }
}

/**
 * Send booking confirmation email to customer
 */
export async function sendCustomerConfirmation(bookingDetails) {
  const {
    customerInfo,
    service,
    date,
    time,
    totalPrice,
    depositAmount,
    peopleCount,
  } = bookingDetails;

  const transporter = createTransporter();

  // Format date
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
    minimumFractionDigits: 0,
  }).format(totalPrice);

  const formattedDeposit = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(depositAmount);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✨ Reserva Confirmada</h1>
          <p style="margin: 5px 0 0 0;">Myosotis Spa</p>
        </div>

        <div class="content">
          <p>Hola <strong>${customerInfo.name}</strong>,</p>
          <p>¡Tu reserva ha sido confirmada! Aquí están los detalles:</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">📅 ${service.name}</h3>
            <p><strong>Fecha:</strong> ${formattedDate}<br>
            <strong>Hora:</strong> ${time}<br>
            <strong>Duración:</strong> ${service.duration} minutos</p>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0;">💰 Información de Pago</h3>
            <p><strong>Personas:</strong> ${peopleCount}<br>
            <strong>Total:</strong> ${formattedTotal}<br>
            <strong>Depósito (50%):</strong> ${formattedDeposit}</p>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0;">📍 Ubicación</h3>
            <p>Myosotis Spa<br>Colombia</p>
          </div>

          <p><strong>¿Necesitas hacer cambios?</strong><br>
          Contáctanos al número de teléfono del spa.</p>

          <p>¡Te esperamos! 🌿</p>

          <div class="footer">
            <p>Este correo es una confirmación automática.</p>
            <p>Myosotis Spa © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Myosotis Spa" <${process.env.EMAIL_USER || 'myosotisbymo@gmail.com'}>`,
    to: customerInfo.email,
    subject: `✨ Confirmación de Reserva - Myosotis Spa`,
    html: emailHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent to customer:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    throw error;
  }
}
