import Notification from '../models/Notification.js';
import { triggerEvent } from '../config/pusher.js';
import { emitToUser } from '../config/socket.js';

export const createNotification = async (recipientId, type, title, message = '', link = '', relatedId = null, meta = {}) => {
  const notification = await Notification.create({
    recipient: recipientId,
    type,
    senderName: meta.senderName || '',
    contentTitle: meta.contentTitle || '',
    contentType: meta.contentType || '',
    title,
    message,
    link,
    relatedId
  });

  const payload = notification.toObject();

  triggerEvent(`private-user-${recipientId.toString()}`, 'notification:new', payload);
  emitToUser(recipientId.toString(), 'notification:new', payload);

  return payload;
};

export const getNotifications = async (userId, limit = 20, before = null) => {
  const filter = { recipient: userId };
  if (before) {
    filter.createdAt = { $lt: new Date(before) };
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifications;
};

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) {
    throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  }
  return notification.toObject();
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { modifiedCount: result.modifiedCount };
};

export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId
  });
  if (!notification) {
    throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  }
  return { success: true };
};
