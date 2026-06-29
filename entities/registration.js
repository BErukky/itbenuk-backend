const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * @swagger
 * components:
 *   schemas:
 *     Registration:
 *       type: object
 *       required: [courseId, fullName, email, phone]
 *       properties:
 *         registrationId:
 *           type: string
 *           description: 'Human-readable ID e.g. ITB-6A2ADD869FA2E'
 *         userId:
 *           type: string
 *           description: 'FK to users._id (nullable for guest checkout)'
 *         courseId:
 *           type: string
 *           description: 'FK to courses._id'
 *         fullName:
 *           type: string
 *           description: 'Denormalised name at time of registration'
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         message:
 *           type: string
 *           description: 'Optional note from student'
 *         status:
 *           type: string
 *           enum: [pending_payment, paid, cancelled, refunded]
 *           default: pending_payment
 *         paymentId:
 *           type: string
 *           description: 'FK to payments._id (set after payment)'
 *         ipAddress:
 *           type: string
 *           description: 'IP at registration time (for fraud reference)'
 */
const RegistrationSchema = new mongoose.Schema(
  {
    registrationId: { type: String, required: true, unique: true, uppercase: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'cancelled', 'refunded'],
      default: 'pending_payment',
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// Middleware to create a human-readable registrationId before saving
RegistrationSchema.pre('validate', function () {
  if (this.isNew) {
    this.registrationId = `ITB-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  }
});

module.exports = mongoose.model('Registration', RegistrationSchema);