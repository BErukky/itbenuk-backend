const axios = require('axios');
const crypto = require('crypto');
const Registration = require('../entities/registration');
const Payment = require('../entities/payment'); // Already correct, but good to confirm
const Course = require('../entities/course'); // Already correct, but good to confirm
const { sendRegistrationConfirmation, sendAdminPaymentNotification } = require('../routes/emailService');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

/**
 * @desc    Create a new course registration and initialize payment
 * @route   POST /api/registrations
 * @access  Public/User
 */
const createRegistration = async (req, res) => {
  const { courseId, fullName, email, phone, message } = req.body;

  try {
    // 1. Validate input
    if (!courseId || !fullName || !email || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 2. Find the course to get the price
    const course = await Course.findById(courseId);
    if (!course || course.status !== 'active') {
      return res.status(404).json({ message: 'Course not found or is not active' });
    }

    // 3. Duplicate Registration Guard (BE-4-06)
    // Check for an existing pending registration for the same email and course
    const existingPending = await Registration.findOne({
      email,
      courseId,
      status: 'pending_payment'
    }).populate('paymentId');

    if (existingPending && existingPending.paymentId) {
      // If a pending registration with a payment link already exists, return that link.
      const paystackUrl = `https://checkout.paystack.com/${existingPending.paymentId.paystackAccessCode}`;
      return res.status(200).json({ authorization_url: paystackUrl, message: 'Existing pending registration found.' });
    }

    // 3. Create the registration record
    const registration = await Registration.create({
      courseId,
      fullName,
      email,
      phone,
      message,
      userId: req.user ? req.user._id : null, // Attach user if logged in
      ipAddress: req.ip,
    });

    // 4. Initialize Paystack transaction
    const paystackResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: registration.email,
        amount: course.priceNGN, // Amount in Kobo
        reference: registration.registrationId, // Use our unique ID as the reference
        callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
        metadata: {
          registration_id: registration._id.toString(),
          course_title: course.title,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url, access_code, reference } = paystackResponse.data.data;

    // 5. Create the payment record in our DB
    const payment = await Payment.create({
      registrationId: registration._id,
      paystackReference: reference,
      paystackAccessCode: access_code,
      amountKobo: course.priceNGN,
      status: 'initiated',
    });

    // 6. Link payment to registration
    registration.paymentId = payment._id;
    await registration.save();

    // 7. Send registration confirmation email (BE-6-02)
    await sendRegistrationConfirmation(registration, course, authorization_url);

    // 7. Return the payment URL to the client
    res.status(201).json({ authorization_url });
  } catch (error) {
    console.error('Registration Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
};

/**
 * @desc    Handle Paystack webhook events
 * @route   POST /api/registrations/payment/webhook
 * @access  Public (from Paystack)
 */
const handlePaystackWebhook = async (req, res) => {
  // 1. Validate the webhook signature for security
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) {
    return res.sendStatus(401); // Unauthorized
  }

  const event = req.body;

  // 2. Check if it's a successful charge event
  if (event.event === 'charge.success') {
    const { reference, status, channel, paid_at } = event.data;

    // 3. Find the corresponding payment and registration
    const payment = await Payment.findOne({ paystackReference: reference });
    if (!payment) {
      console.warn(`Webhook Warning: Payment with reference ${reference} not found.`);
      return res.sendStatus(200); // Acknowledge receipt but do nothing
    }

    const registration = await Registration.findById(payment.registrationId);
    if (!registration) {
      console.error(`Webhook Error: Registration for payment ${payment._id} not found.`);
      return res.sendStatus(200);
    }

    // 4. Update records if payment was successful
    if (status === 'success') {
      payment.status = 'success';
      payment.channel = channel;
      payment.verifiedAt = new Date(paid_at);
      payment.paystackPayload = event.data; // Store the full payload for audit
      await payment.save();

      registration.status = 'paid';
      await registration.save();

      await sendAdminPaymentNotification(registration, payment); // BE-6-04
    }
  }

  // 5. Acknowledge receipt of the webhook
  res.sendStatus(200);
};

module.exports = {
  createRegistration,
  handlePaystackWebhook,
};