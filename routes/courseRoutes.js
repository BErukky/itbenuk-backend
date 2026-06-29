const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const Course = require('../entities/course');
const CourseDTO = require('../dtos/CourseDTO');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course catalogue management
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all active courses (public)
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of active courses
 */
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json(CourseDTO.format(courses));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/courses/all:
 *   get:
 *     summary: Get ALL courses — all statuses (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all courses
 *       401:
 *         description: Not authorized
 */
router.get('/all', protect, admin, async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    res.json(CourseDTO.format(courses));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, durationHours, priceNGN]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Product Management with AI
 *               description:
 *                 type: string
 *                 example: Master Product Management in an intensive 4-hour live sprint.
 *               durationHours:
 *                 type: number
 *                 example: 4
 *               priceNGN:
 *                 type: number
 *                 example: 2500000
 *               status:
 *                 type: string
 *                 enum: [active, coming_soon, archived]
 *                 example: active
 *               curriculum:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["AI Tools", "Product Roadmaps", "Sprint Planning"]
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, description, durationHours, priceNGN, status, curriculum } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const slug = slugify(title, { lower: true, strict: true });
    const newCourse = await Course.create({ title, description, durationHours, priceNGN, status, curriculum, slug });
    res.status(201).json(CourseDTO.format(newCourse));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course by ID (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB _id of the course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               durationHours:
 *                 type: number
 *               priceNGN:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, coming_soon, archived]
 *               curriculum:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 *       401:
 *         description: Not authorized
 */
router.put('/:id', protect, admin, async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    }
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedCourse) return res.status(404).json({ message: 'Course not found' });
    res.json(CourseDTO.format(updatedCourse));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/courses/{slug}:
 *   get:
 *     summary: Get a single course by slug (public)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: URL slug of the course e.g. product-management-with-ai
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:slug', async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(CourseDTO.format(course));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
