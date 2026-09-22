const User = require('../models/User');
const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class AdminService {
  /**
   * GET /api/v1/admin/users
   */
  static async listUsers() {
    const users = await User.findAllUsers();
    return users.map((user) => user.toSafeObject());
  }

  /**
   * GET /api/v1/admin/users/:id
   * Includes small related-record counts (not full lists) so the
   * admin user-details screen has something useful to show without
   * needing a second heavy request.
   */
  static async getUserById(id) {
    const user = await User.findByIdSafe(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const [gigsCount, bookingsCount, transactionsCount] = await Promise.all([
      Gig.countDocuments({ freelancerId: user._id }),
      Booking.countDocuments({ $or: [{ clientId: user._id }, { freelancerId: user._id }] }),
      Transaction.countDocuments({ $or: [{ clientId: user._id }, { freelancerId: user._id }] })
    ]);

    return {
      ...user.toSafeObject(),
      gigsCount,
      bookingsCount,
      transactionsCount
    };
  }

  /**
   * PUT /api/v1/admin/users/:id
   * Allows an admin to correct a user's name, or move them between
   * CLIENT and FREELANCER. Deliberately does NOT allow promoting
   * anyone to ADMIN, or modifying an existing ADMIN account, through
   * this endpoint - admin creation stays a separate, deliberate,
   * script-driven action (see scripts/createAdmin.js), consistent
   * with how registration itself can never create an ADMIN.
   */
  static async updateUser(id, updates) {
    const user = await User.findByIdSafe(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ApiError(400, 'Admin accounts cannot be modified through this endpoint');
    }

    if (updates.role !== undefined) {
      if (!['CLIENT', 'FREELANCER'].includes(updates.role)) {
        throw new ApiError(400, 'Role must be CLIENT or FREELANCER');
      }
      user.role = updates.role;
    }

    if (updates.name !== undefined) {
      user.name = updates.name;
    }

    await user.save();

    logger.info('Admin updated user', { userId: user.id });

    return user.toSafeObject();
  }

  /**
   * DELETE /api/v1/admin/users/:id
   * Blocks deletion of a user who still has gigs or bookings, to
   * protect the integrity of that existing history (the same
   * reasoning that made gig deletion a soft delete in Phase B4).
   */
  static async deleteUser(id) {
    const user = await User.findByIdSafe(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ApiError(400, 'Admin accounts cannot be deleted through this endpoint');
    }

    const [gigCount, bookingCount] = await Promise.all([
      Gig.countDocuments({ freelancerId: user._id }),
      Booking.countDocuments({ $or: [{ clientId: user._id }, { freelancerId: user._id }] })
    ]);

    if (gigCount > 0 || bookingCount > 0) {
      throw new ApiError(
        400,
        'This user has existing gigs or bookings and cannot be deleted, to protect that history.'
      );
    }

    await User.findByIdAndDelete(user._id);

    logger.info('Admin deleted user', { userId: id });

    return user.toSafeObject();
  }

  /**
   * GET /api/v1/admin/gigs
   * System-wide gig visibility, including INACTIVE gigs - unlike the
   * public GET /gigs (ACTIVE only) or ?mine=true (one freelancer only),
   * this is the only place an admin can see every gig on the platform.
   */
  static async listAllGigs() {
    const gigs = await Gig.find({})
      .populate('freelancerId', 'name')
      .sort({ createdAt: -1 });

    return gigs.map((gig) => gig.toSafeObject());
  }
}

module.exports = AdminService;