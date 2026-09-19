const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get all users (Admin only)
 * GET /api/v1/admin/users
 */
router.get(
  '/admin/users',
  authenticate,
  authorize('ADMIN'),
  async (req, res, next) => {
    try {
      const users = await User.findAllUsers();

      logger.info('Admin viewed all users', { userId: req.user.id });

      res.status(200).json({
        success: true,
        data: users.map((u) => u.toSafeObject())
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;