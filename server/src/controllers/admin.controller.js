import * as adminService from '../services/admin.service.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await adminService.getUsers(parseInt(page), parseInt(limit), search);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const toggleUserActive = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserActive(req.params.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const toggleUserAdmin = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserAdmin(req.params.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const user = await adminService.blockUser(req.params.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const user = await adminService.unblockUser(req.params.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const verifyUserEmail = async (req, res, next) => {
  try {
    const user = await adminService.verifyUserEmail(req.params.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const suspendUserChat = async (req, res, next) => {
  try {
    const user = await adminService.suspendUserChat(req.params.userId, req.body);
    res.json({ success: true, data: user, message: 'Chat disabled for this user.' });
  } catch (error) {
    next(error);
  }
};

export const restoreUserChat = async (req, res, next) => {
  try {
    const user = await adminService.restoreUserChat(req.params.userId);
    res.json({ success: true, data: user, message: 'Chat enabled for this user.' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.userId, req.user?._id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
