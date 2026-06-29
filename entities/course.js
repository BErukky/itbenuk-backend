const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - durationHours
 *         - priceNGN
 *       properties:
 *         title:
 *           type: string
 *           description: 'e.g. Product Management with AI'
 *         slug:
 *           type: string
 *           description: URL-safe identifier, auto-generated from title
 *         description:
 *           type: string
 *           description: Short course description
 *         durationHours:
 *           type: number
 *           description: 'e.g. 4'
 *         priceNGN:
 *           type: number
 *           description: Price in Naira kobo base (e.g. 2500000 = ₦25,000)
 *         status:
 *           type: string
 *           enum: [active, coming_soon, archived]
 *           default: active
 *         curriculum:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of module/topic names
 */
const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    durationHours: { type: Number, required: true },
    priceNGN: { type: Number, required: true },
    status: { type: String, enum: ['active', 'coming_soon', 'archived'], default: 'active' },
    curriculum: [String]
  },
  { timestamps: true }
);

// Slug is generated in the route handler but this acts as a safety net
CourseSchema.pre('validate', function () {
  if ((this.isNew || this.isModified('title')) && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

module.exports = mongoose.model('Course', CourseSchema);