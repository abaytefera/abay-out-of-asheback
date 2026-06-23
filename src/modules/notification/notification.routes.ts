import { Router }         from "express";
import { authenticate }   from "../../middleware/authenticate";

import { authorize } from "../../middleware/authorize";
import * as ctrl          from "./notification.controller";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

// FIX: was only ["SOCIAL_WORKER", "PROGRAM_MANAGER", "COUNTRY_DIRECTOR", "ADMIN"].
// The service notifies every role (EDUCATION_OFFICER, FINANCE_OFFICER,
// HEALTH_OFFICER, PSYCHOSOCIAL_OFFICER all receive notifications via
// academicAlert / financialApprovalRequest / dataChange / etc.), so those
// roles were getting a 403 trying to view their own notification bell.
// Notifications are already scoped to req.user.id inside the service
// (markRead/deleteNotification both verify n.userId === userId), so every
// authenticated role should be allowed to read/manage their own list.
const allowedRoles = [
  "SOCIAL_WORKER",
  "EDUCATION_OFFICER",
  "FINANCE_OFFICER",
  "HEALTH_OFFICER",
  "PSYCHOSOCIAL_OFFICER",
  "PROGRAM_MANAGER",
  "COUNTRY_DIRECTOR",
  "ADMIN",
] as const;

notificationsRouter.get(    "/",               authorize(...allowedRoles), ctrl.getMyNotifications);
notificationsRouter.get(    "/unread-count",   authorize(...allowedRoles), ctrl.getUnreadCount);
notificationsRouter.patch(  "/read-all",       authorize(...allowedRoles), ctrl.markAllNotificationsRead);
notificationsRouter.patch(  "/:id/read",       authorize(...allowedRoles), ctrl.markNotificationRead);
notificationsRouter.delete( "/:id",            authorize(...allowedRoles), ctrl.deleteNotification);
// Cron trigger stays ADMIN-only — this is an operational/system action, not a personal one.
notificationsRouter.post(   "/cron/reminders", authorize("ADMIN"),         ctrl.triggerReminderCron);

export default notificationsRouter;