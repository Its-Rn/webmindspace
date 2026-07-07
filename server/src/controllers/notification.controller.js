import * as notificationService from '../services/notification.service.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { limit, before } = req.query;
    const notifications = await notificationService.getNotifications(req.user.id, parseInt(limit) || 20, before);
    const unreadCount = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationService.markAsRead(notificationId, req.user.id);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const result = await notificationService.deleteNotification(notificationId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
