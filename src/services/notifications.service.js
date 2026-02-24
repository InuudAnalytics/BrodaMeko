import { ENDPOINTS } from '../config/endpoints';
import api from './api';

export const getNotifications = async ({ page = 1, limit = 20, category, is_read } = {}) => {
  const params = {
    page: Number.isFinite(Number(page)) ? Number(page) : 1,
    limit: Number.isFinite(Number(limit)) ? Number(limit) : 20,
  };

  if (category !== undefined && String(category || '').trim()) {
    params.category = String(category).trim();
  }

  if (is_read !== undefined && is_read !== null && String(is_read).trim() !== '') {
    params.is_read = String(is_read).trim();
  }

  const response = await api.get(ENDPOINTS.notifications.all, { params });
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const safeNotificationId = String(notificationId || '').trim();
  if (!safeNotificationId) {
    throw new Error('notificationId is required.');
  }

  const response = await api.patch(ENDPOINTS.notifications.markRead(safeNotificationId), {});
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch(ENDPOINTS.notifications.markAllRead, {});
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const safeNotificationId = String(notificationId || '').trim();
  if (!safeNotificationId) {
    throw new Error('notificationId is required.');
  }

  const response = await api.delete(ENDPOINTS.notifications.delete(safeNotificationId));
  return response.data;
};

export default {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
