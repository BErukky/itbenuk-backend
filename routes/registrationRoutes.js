const express = require('express');
const router = express.Router();
const Registration = require('../entities/Registration');
const Payment = require('../entities/Payment');
const RegistrationDTO = require('../dtos/RegistrationDTO');
const PaymentDTO = require('../dtos/PaymentDTO');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');
const { createRegistration, handlePaystackWebhook } = require('../controllers/registrationController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Registration:
 *       type: object
 *       required: [courseId, fullName, email, phone]
 *       properties:
 *         registrationId: { type: string }
 *         userId: { type: string }
 *         courseId: { type: string }
 *         fullName: { type: string }
 *         email: { type: string }
 *         phone: { type: string }
 *         message: { type: string }
 *         status:
 *           type: string
 *           enum: [pending_payment, paid, cancelled, refunded]
 *         paymentId: { type: string }
 *         ipAddress: { type: string }
 *     Payment:
 *       type: object
 *       properties:
 *         registrationId: { type: string }
 *         paystackReference: { type: string }
 *         paystackAccessCode: { type: string }
 *         amountKobo: { type: number }
 *         currency: { type: string }
 *         channel: { type: string }
 *         status:
 *           type: string
 *           enum: [initiated, success, failed, abandoned]
 *         verifiedAt: { type: string, format: 'date-time' }
 *         paystackPayload: { type: object }
 */

/**
 * @swagger
 * tags:
 *   name: Registrations
 *   description: Course registration and payment management
 */

/**
 * @swagger
 * /api/registrations:
 *   post:
 *     summary: Create a new course registration
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Registration'
 *     responses:
 *       201:
 *         description: Registration created, returns payment link
 */
router.post('/', optionalProtect, createRegistration);

/**
 * @swagger
 * /api/registrations/all:
 *   get:
 *     summary: List all registration records (Admin only)
 *     tags: [Registrations, Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of registrations
 */
router.get('/all', protect, admin, async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 }).populate('courseId userId');
    res.json(RegistrationDTO.format(registrations));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/registrations/status/{registrationId}:
 *   get:
 *     summary: Get registration status by its public ID
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration status details
 */
router.get('/status/:registrationId', async (req, res) => {
  try {
    const registration = await Registration.findOne({ registrationId: req.params.registrationId.toUpperCase() })
      .populate('courseId', 'title slug priceNGN');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    res.json(RegistrationDTO.format(registration));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/registrations/{id}:
 *   get: 
 *     summary: View a registration record by ID (Admin only)
 *     tags: [Registrations, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration details
 *       404:
 *         description: Registration not found
 */
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('courseId userId paymentId');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    res.json(RegistrationDTO.format(registration));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/registrations/{id}/status:
 *   patch:
 *     summary: Manually update a registration's status (Admin only)
 *     tags: [Registrations, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending_payment, paid, cancelled, refunded]
 *     responses:
 *       200:
 *         description: Registration status updated successfully
 */
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const registration = await Registration.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });

    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    res.json(RegistrationDTO.format(registration));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/registrations/payment/webhook:
 *   post:
 *     summary: Paystack webhook for payment verification
 *     tags: [Registrations]
 *     requestBody:
 *       description: Payload from Paystack
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/payment/webhook', handlePaystackWebhook);

module.exports = router;
