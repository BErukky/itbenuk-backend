const express = require('express');
const router = express.Router();
const ContactTicket = require('../entities/ContactTicket');
const ContactTicketDTO = require('../dtos/ContactTicketDTO');
const { sendAdminContactNotification } = require('./emailService');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: ContactTickets
 *   description: Contact form submission management
 */

/**
 * @swagger
 * /api/contact-tickets:
 *   post:
 *     summary: Submit a new contact form/ticket
 *     tags: [ContactTickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactTicket'
 *     responses:
 *       201:
 *         description: Ticket submitted successfully.
 */
router.post('/', async (req, res) => {
  try {
    const ipAddress = req.ip;
    const newTicket = await ContactTicket.create({ ...req.body, ipAddress });

    // Trigger admin notification email (BE-7-02)
    await sendAdminContactNotification(newTicket);

    res.status(201).json(ContactTicketDTO.format(newTicket));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/contact-tickets:
 *   get:
 *     summary: Get all contact tickets (Admin only)
 *     tags: [ContactTickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all contact tickets.
 */
router.get('/', protect, admin, async (req, res) => {
  try {
    const tickets = await ContactTicket.find({}).sort({ createdAt: -1 });
    res.json(ContactTicketDTO.format(tickets));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/contact-tickets/{id}:
 *   get:
 *     summary: Get a single contact ticket by ID (Admin only)
 *     tags: [ContactTickets]
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
 *         description: Ticket details.
 */
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const ticket = await ContactTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ContactTicketDTO.format(ticket));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/contact-tickets/{id}/status:
 *   patch:
 *     summary: Update the status of a contact ticket (Admin only)
 *     tags: [ContactTickets]
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
 *                 enum: [open, in_progress, resolved, closed]
 *     responses:
 *       200:
 *         description: Ticket status updated.
 */
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const updatedTicket = await ContactTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedTicket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ContactTicketDTO.format(updatedTicket));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;