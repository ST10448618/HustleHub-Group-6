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
  (req, res) => {
    const users = User.findAll().map(u => u.toSafeObject());
    
    logger.info('Admin viewed all users', { userId: req.user.id });
    
    res.status(200).json({
      success: true,
      data: users
    });
  }
);

module.exports = router;