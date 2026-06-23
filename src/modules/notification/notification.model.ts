import prisma from "../../config/prisma";
import { NotificationType, NotificationPriority, UserRole, Prisma } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  entityType?: string;
  relatedId?: string;
}

export class NotificationRepository {
  // ── Create a single notification ─────────────────────────────────────────
  async create(data: CreateNotificationInput) {
    return prisma.notification.create({ data });
  }

  // ── Create multiple notifications in one transaction ─────────────────────
  async createMany(notifications: CreateNotificationInput[]) {
    return prisma.$transaction(
      notifications.map((n) => prisma.notification.create({ data: n }))
    );
  }

  // ── Find all users with a given role ─────────────────────────────────────
  async findUsersByRole(role: UserRole) {
    return prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
  }

  // ── Get notifications for a specific user (paginated + filtered) ─────────
  // NOTE: this already correctly filters by `type` (see below). It was never
  // the broken link in the chain — the controller simply wasn't passing
  // `type` down from req.query. See notification.controller.ts.
  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
    filters?: { isRead?: boolean; type?: NotificationType }
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.NotificationWhereInput = { userId };
    if (filters?.isRead !== undefined) where.isRead = filters.isRead;
    if (filters?.type) where.type = filters.type;

    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ── Count unread notifications for a user ────────────────────────────────
  async countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  // ── Find a single notification by ID ─────────────────────────────────────
  async findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }

  // ── Mark one notification as read ────────────────────────────────────────
  async markOneRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // ── Mark ALL notifications as read for a user ────────────────────────────
  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // ── Delete a single notification ─────────────────────────────────────────
  async delete(id: string) {
    return prisma.notification.delete({ where: { id } });
  }

  // ── Delete all notifications for a user ──────────────────────────────────
  async deleteAllForUser(userId: string) {
    return prisma.notification.deleteMany({ where: { userId } });
  }

  // ── Find pending appointments due for reminders (cron) ───────────────────
  // HomeVisitAppointment has: id, childId, assignedToId, appointmentDate, status, notes
  async findAppointmentsForReminders() {
    return prisma.homeVisitAppointment.findMany({
      where: { status: "PENDING" },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        child:      { select: { id: true, childCode: true } },
      },
    });
  }

  // ── Find all active social workers ───────────────────────────────────────
  async findActiveSocialWorkers() {
    return prisma.user.findMany({
      where: { role: "SOCIAL_WORKER", isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    });
  }
}