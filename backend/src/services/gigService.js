const Gig = require('../models/Gig');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Only ever expose a freelancer's name alongside a gig - never email
// or any other private account information.
const PUBLIC_FREELANCER_FIELDS = 'name';

class GigService {
  static async createGig(freelancerId, data) {
    const gig = await Gig.create({
      freelancerId,
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price,
      depositAmount: data.depositAmount
    });

    await gig.populate('freelancerId', PUBLIC_FREELANCER_FIELDS);

    logger.info('Gig created', { gigId: gig.id, freelancerId });

    return gig.toSafeObject();
  }

  /**
   * Public marketplace listing: only ACTIVE gigs, optionally filtered
   * by category. This is what unauthenticated visitors and clients see.
   */
  static async listPublicGigs(filters = {}) {
    const query = { status: 'ACTIVE' };
    if (filters.category && typeof filters.category === 'string') {
      query.category = filters.category;
    }

    const gigs = await Gig.find(query)
      .populate('freelancerId', PUBLIC_FREELANCER_FIELDS)
      .sort({ createdAt: -1 });

    return gigs.map((gig) => gig.toSafeObject());
  }

  /**
   * A freelancer's own gigs, ACTIVE and INACTIVE alike, so they can
   * manage their full history from "My Gigs".
   */
  static async listOwnGigs(freelancerId) {
    const gigs = await Gig.find({ freelancerId })
      .populate('freelancerId', PUBLIC_FREELANCER_FIELDS)
      .sort({ createdAt: -1 });

    return gigs.map((gig) => gig.toSafeObject());
  }

  static async getGigById(id) {
    const gig = await Gig.findById(id).populate('freelancerId', PUBLIC_FREELANCER_FIELDS);

    if (!gig) {
      throw new ApiError(404, 'Gig not found');
    }

    return gig.toSafeObject();
  }

  static async updateGig(id, requestingUser, updates) {
    const gig = await Gig.findById(id);

    if (!gig) {
      throw new ApiError(404, 'Gig not found');
    }

    GigService.assertOwnerOrAdmin(gig, requestingUser);

    const allowedFields = ['title', 'description', 'category', 'price', 'depositAmount'];
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        gig[field] = updates[field];
      }
    });

    await gig.save();
    await gig.populate('freelancerId', PUBLIC_FREELANCER_FIELDS);

    logger.info('Gig updated', { gigId: gig.id, updatedBy: requestingUser.id });

    return gig.toSafeObject();
  }

  static async deleteGig(id, requestingUser) {
    const gig = await Gig.findById(id);

    if (!gig) {
      throw new ApiError(404, 'Gig not found');
    }

    GigService.assertOwnerOrAdmin(gig, requestingUser);

    gig.status = 'INACTIVE';
    await gig.save();
    await gig.populate('freelancerId', PUBLIC_FREELANCER_FIELDS);

    logger.info('Gig deactivated', { gigId: gig.id, deactivatedBy: requestingUser.id });

    return gig.toSafeObject();
  }

  static assertOwnerOrAdmin(gig, requestingUser) {
    const isOwner = gig.freelancerId.toString() === requestingUser.id;
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'You do not have permission to modify this gig');
    }
  }
}

module.exports = GigService;