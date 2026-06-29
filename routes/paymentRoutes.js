const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../entities/payment');
const Registration = require('../entities/registration');
const PaymentDTO = require('../dtos/PaymentDTO');
const RegistrationDTO = require('../dtos/RegistrationDTO');
const { protect, admin } = require('../middleware/authMiddleware');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment verification and management
 */

/**
 * @swagger
 * /api/payments/verify/{reference}:
 *   get:
 *     summary: Verify a payment by Paystack reference
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns payment result with status — success, pending, or failed
 *       404:
 *         description: Payment record not found
 */
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    // 1. Find our internal payment record first
    const payment = await Payment.findOne({ paystackReference: reference });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    // 2. If already verified as success, return immediately — no need to call Paystack again
    if (payment.status === 'success') {
      const registration = await Registration.findById(payment.registrationId).populate('courseId');
      return res.json({
        result: 'success',
        message: 'Payment already verified',
        registration: RegistrationDTO.format(registration),
      });
    }

    // 3. Call Paystack to get the real status
    let paystackData;
    try {
      const { data: paystackResponse } = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      paystackData = paystackResponse.data;
    } catch (paystackError) {
      console.error('Paystack verify error:', paystackError.response?.data || paystackError.message);
      return res.status(502).json({ message: 'Could not reach Paystack. Please try again.' });
    }

    const { status, channel, paid_at } = paystackData;

    // 4. Payment confirmed successful by Paystack
    if (status === 'success') {
      payment.status = 'success';
      payment.channel = channel;
      payment.verifiedAt = new Date(paid_at);
      payment.paystackPayload = paystackData;
      await payment.save();

      const registration = await Registration.findByIdAndUpdate(
        payment.registrationId,
        { status: 'paid' },
        { new: true }
      ).populate('courseId');

      return res.json({
        result: 'success',
        message: 'Payment successful',
        registration: RegistrationDTO.format(registration),
      });
    }

    // 5. Payment abandoned or failed
    if (status === 'failed' || status === 'abandoned') {
      payment.status = status;
      await payment.save();

      const registration = await Registration.findById(payment.registrationId).populate('courseId');
      return res.json({
        result: 'failed',
        message: status === 'abandoned' ? 'Payment was abandoned.' : 'Payment failed.',
        registration: RegistrationDTO.format(registration),
      });
    }

    // 6. Still pending — Paystack hasn't confirmed yet
    const registration = await Registration.findById(payment.registrationId).populate('courseId');
    return res.json({
      result: 'pending',
      message: 'Payment is still being processed.',
      registration: RegistrationDTO.format(registration),
    });

  } catch (error) {
    console.error('Payment Verification Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'An error occurred during payment verification.' });
  }
});

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get a list of all payments (Admin only)
 *     tags: [Payments, Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all payments.
 */
router.get('/', protect, admin, async (req, res) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 }).populate({ path: 'registrationId', populate: { path: 'courseId' } });
    res.json(PaymentDTO.format(payments));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
