const AdminService = require('../services/adminService');

class AdminController {
  static async listUsers(req, res, next) {
    try {
      const users = await AdminService.listUsers();
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: { users }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req, res, next) {
    try {
      const user = await AdminService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const user = await AdminService.updateUser(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const user = await AdminService.deleteUser(req.params.id);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  static async listGigs(req, res, next) {
    try {
      const gigs = await AdminService.listAllGigs();
      res.status(200).json({
        success: true,
        message: 'Gigs retrieved successfully',
        data: { gigs }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;