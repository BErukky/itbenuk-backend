const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../entities/Payment');
const Registration = require('../entities/Registration');
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
 *     summary: Verify a payment transaction from the client-side
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully, returns updated registration.
 *       400:
 *         description: Payment failed or was not successful.
 *       404:
 *         description: Payment reference not found.
 */
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    // 1. Verify transaction with Paystack
    const { data: paystackResponse } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const { status, channel, paid_at } = paystackResponse.data;

    // 2. Find our internal payment record
    const payment = await Payment.findOne({ paystackReference: reference });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    // 3. If successful, update our records (idempotent check)
    if (status === 'success' && payment.status !== 'success') {
      payment.status = 'success';
      payment.channel = channel;
      payment.verifiedAt = new Date(paid_at);
      payment.paystackPayload = paystackResponse.data;
      await payment.save();

      const registration = await Registration.findByIdAndUpdate(
        payment.registrationId,
        { status: 'paid' },
        { new: true }
      ).populate('courseId');

      // TODO: Send confirmation email

      return res.json({
        message: 'Payment successful',
        registration: RegistrationDTO.format(registration),
      });
    } else if (payment.status === 'success') {
      // Already verified by webhook, just return success
      const registration = await Registration.findById(payment.registrationId).populate('courseId');
      return res.json({
        message: 'Payment already verified',
        registration: RegistrationDTO.format(registration),
      });
    }

    res.status(400).json({ message: 'Payment was not successful.' });
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
    // TODO: Add filtering and pagination as per BE-5-05
    const payments = await Payment.find({}).sort({ createdAt: -1 }).populate({ path: 'registrationId', populate: { path: 'courseId' } });
    res.json(PaymentDTO.format(payments));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;