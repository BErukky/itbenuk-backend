const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 465, // Default to 465 for Zoho with SSL
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // For Zoho, ensure you are using an App-Specific Password if 2FA is enabled.
    // For production, use a dedicated transactional email service like SendGrid, Mailgun, or AWS SES.
  });

  // 2. Define the email options
  const mailOptions = {
    from: `iTbenuk <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
    // text: options.text // You can add a plain text version as well
  };

  // 3. Actually send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    // In a production app, you might re-throw the error or add it to a queue for retry
    // For now, we just log it and don't block the main thread.
  }
};

const sendRegistrationConfirmation = async (registration, course, paymentUrl) => {
  const subject = `Your Registration for ${course.title}`;
  const html = `
    <h1>Thank you for registering, ${registration.fullName}!</h1>
    <p>You have successfully started the registration process for the course: <strong>${course.title}</strong>.</p>
    <p>Your Registration ID is: <strong>${registration.registrationId}</strong></p>
    <p>To complete your enrollment, please proceed with the payment using the link below:</p>
    <a href="${paymentUrl}">Complete Payment</a>
    <p>If you have any questions, please contact our support team.</p>
  `;
  await sendEmail({ email: registration.email, subject, html });
};

const sendAdminContactNotification = async (ticket) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not set. Skipping contact ticket notification.');
    return;
  }

  const subject = `New Contact Ticket [${ticket.ticketId}]: ${ticket.subject}`;
  const html = `
    <h1>New Contact Ticket Received</h1>
    <p>A new enquiry has been submitted via the contact form.</p>
    <ul>
      <li><strong>Ticket ID:</strong> ${ticket.ticketId}</li>
      <li><strong>From:</strong> ${ticket.fullName} (${ticket.email})</li>
      <li><strong>Subject:</strong> ${ticket.subject}</li>
    </ul>
    <p><strong>Message:</strong><br/>${ticket.message.replace(/\n/g, '<br>')}</p>
    <p>Please log in to the admin panel to respond.</p>
  `;
  await sendEmail({ email: adminEmail, subject, html });
};

const sendAdminPaymentNotification = async (registration, payment) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not set. Skipping payment notification.');
    return;
  }

  const subject = `New Payment Received for ${registration.registrationId}`;
  const html = `
    <h1>New Payment Received!</h1>
    <p>A payment has been successfully processed.</p>
    <ul>
      <li><strong>Registration ID:</strong> ${registration.registrationId}</li>
      <li><strong>Student Name:</strong> ${registration.fullName}</li>
      <li><strong>Amount:</strong> NGN ${(payment.amountKobo / 100).toFixed(2)}</li>
      <li><strong>Paystack Reference:</strong> ${payment.paystackReference}</li>
    </ul>
    <p>Please log in to the admin panel for more details.</p>
  `;
  await sendEmail({ email: adminEmail, subject, html });
};

module.exports = { sendEmail, sendRegistrationConfirmation, sendAdminContactNotification, sendAdminPaymentNotification };