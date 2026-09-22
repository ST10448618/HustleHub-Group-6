const express = require('express');
const router = express.Router();
const GigController = require('../controllers/gigController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
  validateCreateGig,
  validateUpdateGig,
  validateGigIdParam,
  validateListGigsQuery
} = require('../validation/gigValidation');

/**
 * GET /api/v1/gigs
 * Public marketplace browsing (only ACTIVE gigs).
 * Supports ?category=Design and, for a logged-in FREELANCER,
 * ?mine=true to see their own gigs instead (any status).
 * optionalAuthenticate never blocks the request - it only attaches
 * req.user if a valid token happens to be present.
 */
router.get(
  '/',
  optionalAuthenticate,
  validateListGigsQuery,
  handleValidationErrors,
  GigController.listGigs
);

/**
 * GET /api/v1/gigs/:id
 * Public gig details page.
 */
router.get(
  '/:id',
  validateGigIdParam,
  handleValidationErrors,
  GigController.getGig
);

/**
 * POST /api/v1/gigs
 * FREELANCER only. freelancerId is derived from the authenticated
 * user - never trusted from the request body.
 */
router.post(
  '/',
  authenticate,
  authorize('FREELANCER'),
  validateCreateGig,
  handleValidationErrors,
  GigController.createGig
);

/**
 * PUT /api/v1/gigs/:id
 * Owning FREELANCER or ADMIN only - ownership is checked inside
 * gigService, not just role.
 */
router.put(
  '/:id',
  authenticate,
  authorize('FREELANCER', 'ADMIN'),
  validateGigIdParam,
  validateUpdateGig,
  handleValidationErrors,
  GigController.updateGig
);

/**
 * DELETE /api/v1/gigs/:id
 * Owning FREELANCER or ADMIN only. Soft delete (status -> INACTIVE).
 */
router.delete(
  '/:id',
  authenticate,
  authorize('FREELANCER', 'ADMIN'),
  validateGigIdParam,
  handleValidationErrors,
  GigController.deleteGig
);

module.exports = router;