const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API Health Check
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check the health of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 */
router.get('/', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

module.exports = router;