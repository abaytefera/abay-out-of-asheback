import { Request, Response, NextFunction } from "express";
import notificationService                 from "./notification.service";
import { NotificationType }                 from "@prisma/client";

// NOTE: assumes your `authenticate` middleware attaches `req.user` with at
// least `{ id, role }` (matching the JWT payload your frontend reads via
// `state.auth.user`). Adjust the cast below if your augmented Express
// Request type lives elsewhere.
const getUserId = (req: Request) => (req as any).user.id as string;

// ── GET /api/v1/notifications ───────────────────────────────────────────────
export async function getMyNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);

    const page  = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);

    // FIX: this is the piece that was missing entirely. `isRead` was being
    // parsed, but `type` was never read from the query string, so the
    // frontend's type filter had nothing to act on server-side even though
    // notificationService.getForUser() / repo.findByUser() already accept it.
    const filters: { isRead?: boolean; type?: NotificationType } = {};

    if (req.query.isRead !== undefined) {
      filters.isRead = req.query.isRead === "true";
    }
    if (req.query.type) {
      filters.type = req.query.type as NotificationType;
    }

    const result = await notificationService.getForUser(userId, page, limit, filters);

    // Returned as-is (not double-wrapped) — the frontend reads
    // response.data / response.total / response.unreadCount / response.totalPages
    // directly off this object.
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/notifications/unread-count ──────────────────────────────────
export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const result = await notificationService.getUnreadCount(userId);
    res.status(200).json(result); // { count }
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/v1/notifications/:id/read ────────────────────────────────────
export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await notificationService.markRead(id, userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/v1/notifications/read-all ────────────────────────────────────
export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const result = await notificationService.markAllRead(userId);
    res.status(200).json(result); // { success, updated }
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/v1/notifications/:id ─────────────────────────────────────────
export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await notificationService.deleteNotification(id, userId);
    res.status(200).json(result); // { success: true }
  } catch (err) {
    next(err);
  }
}

// ── POST /api/v1/notifications/cron/reminders (ADMIN only) ──────────────────
export async function triggerReminderCron(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.processNightlyReminders();
    res.status(200).json(result); // { processed, skipped }
  } catch (err) {
    next(err);
  }
}