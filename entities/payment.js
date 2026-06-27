const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - registrationId
 *         - paystackReference
 *         - amountKobo
 *       properties:
 *         registrationId:
 *           type: string
 *           description: 'FK to registrations._id'
 *         paystackReference:
 *           type: string
 *           description: 'Paystack transaction reference'
 *         paystackAccessCode:
 *           type: string
 *           description: 'Access code from Paystack initialize'
 *         amountKobo:
 *           type: number
 *           description: 'Amount in kobo (e.g., 2500000 = ₦25,000)'
 *         currency:
 *           type: string
 *           default: 'NGN'
 *         channel:
 *           type: string
 *           description: 'e.g., card, bank_transfer, ussd'
 *         status:
 *           type: string
 *           enum: [initiated, success, failed, abandoned]
 *           default: 'initiated'
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           description: 'Timestamp of Paystack verify API confirmation'
 *         paystackPayload:
 *           type: object
 *           description: 'Raw Paystack verify response (for audit)'
 */
const PaymentSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    paystackReference: { type: String, required: true, unique: true },
    paystackAccessCode: { type: String },
    amountKobo: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    channel: { type: String },
    status: { type: String, enum: ['initiated', 'success', 'failed', 'abandoned'], default: 'initiated' },
    verifiedAt: { type: Date },
    paystackPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);