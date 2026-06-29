const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactTicket:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - subject
 *         - message
 *       properties:
 *         ticketId:
 *           type: string
 *           description: 'Human-readable ID e.g. TKT-6A2E445AE9844'
 *         fullName:
 *           type: string
 *           description: 'Submitter name'
 *         email:
 *           type: string
 *           description: 'Contact email'
 *         phone:
 *           type: string
 *           description: 'Contact phone (optional)'
 *         subject:
 *           type: string
 *           description: 'e.g. Partnership, Technical Issue'
 *         message:
 *           type: string
 *           description: 'Enquiry body'
 *         status:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *           default: 'open'
 *         ipAddress:
 *           type: string
 *           description: 'Submitter IP'
 */
const ContactTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, uppercase: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// Middleware to create a human-readable ticketId before saving
ContactTicketSchema.pre('validate', function () {
  if (this.isNew) {
    this.ticketId = `TKT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  }
});

module.exports = mongoose.model('ContactTicket', ContactTicketSchema);