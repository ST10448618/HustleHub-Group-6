const Gig = require('../models/Gig');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Only ever expose a freelancer's name alongside a gig - never email
// or any other private account information.
const PUBLIC_FREELANCER_FIELDS = 'name';

class GigService {
  /**
   * Creates a new gig owned by the given freelancer.
   * freelancerId always comes from the authenticated JWT identity -
   * never from the request body - so a user can never create a gig
   * under someone else's identity.
   */
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

    // Defensive second layer: even though the route already validates
    // that ?category is a plain string (see gigValidation.js), this
    // guard means the service itself can never pass a non-string
    // value (e.g. an object smuggled in via bracket-notation query
    // params) straight into a Mongo filter, regardless of how this
    // method is called in the future.
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

  /**
   * A single gig by id, for the public gig-details screen. Returns
   * the gig regardless of ACTIVE/INACTIVE status - a client following
   * an old link should see a real 404 only if the gig was truly
   * deleted, not if it's merely deactivated. (No such case exists yet
   * since deletion is a soft delete, but this keeps the behaviour
   * consistent and simple.)
   */
  static async getGigById(id) {
    const gig = await Gig.findById(id).populate('freelancerId', PUBLIC_FREELANCER_FIELDS);

    if (!gig) {
      throw new ApiError(404, 'Gig not found');
    }

    return gig.toSafeObject();
  }

  /**
   * Updates a gig. Only the owning freelancer or an admin may do this.
   * Uses load -> assign -> save() (rather than findByIdAndUpdate) so
   * that Mongoose's validators - including the deposit-vs-price
   * schema-level check - run against the fully merged document.
   */
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

  /**
   * "Deletes" a gig. This is a soft delete: the gig is marked
   * INACTIVE rather than removed from the database. This matters
   * once bookings exist (Phase B5) - a booking's gigId reference, and
   * the freelancer's own booking history for that gig, must remain
   * valid and auditable even after the gig is taken off the market.
   */
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

  /**
   * Ownership + RBAC check shared by update and delete. A valid
   * FREELANCER token proves who the user is, but not that they own
   * THIS gig - that second check happens here, comparing the gig's
   * stored freelancerId against the authenticated user's id.
   */
  static assertOwnerOrAdmin(gig, requestingUser) {
    const isOwner = gig.freelancerId.toString() === requestingUser.id;
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'You do not have permission to modify this gig');
    }
  }
}

module.exports = GigService;