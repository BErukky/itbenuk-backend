const express = require('express');
const router = express.Router();
const Course = require('../entities/Course');
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
 *     summary: Get a list of all active courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: A list of courses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
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
 *     summary: Get a list of all courses (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all courses.
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
 * /api/courses/{slug}:
 *   get:
 *     summary: Get a single course by slug
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details.
 *       404:
 *         description: Course not found.
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
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       201:
 *         description: Course created successfully.
 */
router.post('/', protect, admin, async (req, res) => {
  try {
    const newCourse = await Course.create(req.body);
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       200:
 *         description: Course updated successfully.
 */
router.put('/:id', protect, admin, async (req, res) => {
  try {
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

module.exports = router;