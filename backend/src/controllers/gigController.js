const GigService = require('../services/gigService');

class GigController {
  /**
   * POST /api/v1/gigs
   * FREELANCER only
   */
  static async createGig(req, res, next) {
    try {
      const gig = await GigService.createGig(req.user.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Gig created successfully',
        data: { gig }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/gigs
   * Public by default (only ACTIVE gigs, optional ?category= filter).
   * ?mine=true - authenticated FREELANCER only - returns all of their
   * own gigs (ACTIVE and INACTIVE).
   */
  static async listGigs(req, res, next) {
    try {
      if (req.query.mine === 'true') {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required to view your own gigs.'
          });
        }

        if (req.user.role !== 'FREELANCER') {
          return res.status(403).json({
            success: false,
            message: 'Only freelancers have gigs to manage.'
          });
        }

        const gigs = await GigService.listOwnGigs(req.user.id);

        return res.status(200).json({
          success: true,
          message: 'Your gigs retrieved successfully',
          data: { gigs }
        });
      }

      const gigs = await GigService.listPublicGigs({ category: req.query.category });

      res.status(200).json({
        success: true,
        message: 'Gigs retrieved successfully',
        data: { gigs }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/gigs/:id
   * Public
   */
  static async getGig(req, res, next) {
    try {
      const gig = await GigService.getGigById(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Gig retrieved successfully',
        data: { gig }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/gigs/:id
   * Owning FREELANCER or ADMIN only
   */
  static async updateGig(req, res, next) {
    try {
      const gig = await GigService.updateGig(req.params.id, req.user, req.body);

      res.status(200).json({
        success: true,
        message: 'Gig updated successfully',
        data: { gig }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/gigs/:id
   * Owning FREELANCER or ADMIN only. Soft delete (status -> INACTIVE).
   */
  static async deleteGig(req, res, next) {
    try {
      const gig = await GigService.deleteGig(req.params.id, req.user);

      res.status(200).json({
        success: true,
        message: 'Gig deleted successfully',
        data: { gig }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GigController;