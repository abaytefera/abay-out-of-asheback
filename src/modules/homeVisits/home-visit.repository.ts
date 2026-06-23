import { Prisma, NotificationType, NotificationPriority, UserRole } from "@prisma/client";
import prisma from "../../config/prisma";
import { HomeVisitInput, HomeVisitUpdateInput } from "./home-visit.dto";
import fs from "fs";
import path from "path";

export interface ActorContext {
  id: string;
  role: string;
  ipAddress?: string;
  userAgent?: string;
}

const TX_OPTS = { maxWait: 10000, timeout: 15000 };

const resolveDiskPath = (photo: { publicId: string; url: string }): string => {
  if (photo.publicId && photo.publicId.trim() !== "") {
    return photo.publicId;
  }
  return path.join("uploads", "homevisits", path.basename(photo.url));
};

const unlinkSafe = (diskPath: string, tag: string): void => {
  try {
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    } else {
      console.warn(`[${tag}] File not found on disk, skipping: ${diskPath}`);
    }
  } catch (err) {
    console.error(`[${tag}] Failed to delete file ${diskPath}:`, err);
  }
};

const diffFields = <T extends Record<string, any>>(
  before: T,
  after: Partial<T>
): Record<string, { before: unknown; after: unknown }> => {
  const out: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (after[key] !== undefined && after[key] !== before[key]) {
      out[key] = { before: before[key], after: after[key] };
    }
  }
  return out;
};

// ─── Shared broadcast helper ──────────────────────────────────────────────────
//
// Writes BOTH a Notification AND an AuditLog row for every recipient in the
// deduplicated set: all active ADMINs + all active COUNTRY_DIRECTORs + the actor.
//
// Optional extraRecipientId — used to include the original visit's staffId when
// someone else (e.g. a PM) edits or deletes the visit.

interface BroadcastParams {
  actor: ActorContext;
  extraRecipientId?: string | null;
  // Notification
  notificationType: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  entityType: string;
  relatedId: string;
  // Audit log
  action: "CREATE" | "UPDATE" | "DELETE";
  resource: string;
  resourceId: string;
  childId?: string | null;
  metadata?: Record<string, unknown>;
}

const broadcastHomeVisitEvent = async (
  tx: Prisma.TransactionClient,
  params: BroadcastParams
): Promise<void> => {
  // 1. All active ADMINs + COUNTRY_DIRECTORs
  const privileged = await tx.user.findMany({
    where: { role: { in: [UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR] }, isActive: true },
    select: { id: true },
  });

  // 2. Merge: privileged + actor + optional extra, then deduplicate
  const recipientIds = Array.from(
    new Set([
      ...privileged.map((u) => u.id),
      params.actor.id,
      ...(params.extraRecipientId ? [params.extraRecipientId] : []),
    ])
  );

  // 3. Notifications — one per recipient
  await tx.notification.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      type:       params.notificationType,
      priority:   params.priority ?? NotificationPriority.MEDIUM,
      title:      params.title,
      message:    params.message,
      entityType: params.entityType,
      relatedId:  params.relatedId,
    })),
  });

  // 4. Audit logs — one per recipient
  await tx.auditLog.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      childId:    params.childId ?? null,
      action:     params.action,
      resource:   params.resource,
      resourceId: params.resourceId,
      ipAddress:  params.actor.ipAddress,
      userAgent:  params.actor.userAgent,
      metadata:   (params.metadata ?? {}) as Prisma.InputJsonValue,
    })),
  });
};

// ─── Repository ───────────────────────────────────────────────────────────────

export class HomeVisitRepository {

  // ── Create ────────────────────────────────────────────────────────────────
  async create(dto: HomeVisitInput, actor: ActorContext, files: Express.Multer.File[]) {
    const { visitDate, followUpDate, isFollowUpDone, ...visitData } = dto;

    const photoData = files.map((f) => ({
      url:      `/uploads/homevisits/${f.filename}`,
      publicId: f.path,
    }));

    return prisma.$transaction(async (tx) => {
      const visit = await tx.homeVisit.create({
        data: {
          ...visitData,
          staffId:        actor.id,
          visitDate:      new Date(visitDate),
          followUpDate:   followUpDate ? new Date(followUpDate) : null,
          isFollowUpDone: isFollowUpDone || false,
          photos: photoData.length > 0 ? { create: photoData } : undefined,
        },
        include: {
          child:  { select: { childCode: true, firstName: true, lastName: true } },
          staff:  { select: { firstName: true, lastName: true } },
          photos: true,
        },
      });

      const workerName     = visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : "A Social Worker";
      const visitDateLabel = new Date(visit.visitDate).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
      const childName = visit.child ? `${visit.child.firstName} ${visit.child.lastName}` : "a child";

      await broadcastHomeVisitEvent(tx, {
        actor,
        notificationType: NotificationType.NEW_VISIT_LOGGED,
        priority:         NotificationPriority.MEDIUM,
        title:            "New home visit logged",
        message:          `${workerName} logged a ${visit.purpose} visit for ${childName} on ${visitDateLabel}`,
        entityType:       "HomeVisit",
        relatedId:        visit.id,
        action:           "CREATE",
        resource:         "HomeVisit",
        resourceId:       visit.id,
        childId:          visit.childId,
        metadata: {
          purpose:    visit.purpose,
          visitDate:  visit.visitDate,
          photoCount: photoData.length,
        },
      });

      return visit;
    }, TX_OPTS);
  }

  // ── Find one visit (with photos) ──────────────────────────────────────────
  async findById(id: string) {
    return prisma.homeVisit.findUnique({
      where:   { id },
      include: {
        photos: true,
        child:  { select: { id: true, childCode: true, firstName: true, lastName: true } },
        staff:  { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // ── Delete whole visit + ALL attached local files ─────────────────────────
  async deleteWithFiles(
    record: Prisma.HomeVisitGetPayload<{
      include: { photos: true; child: true; staff: true };
    }>,
    actor: ActorContext
  ) {
    // File deletion before the transaction — disk I/O is not transactional.
    for (const photo of record.photos ?? []) {
      unlinkSafe(resolveDiskPath(photo), "deleteWithFiles");
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.homeVisit.delete({ where: { id: record.id } });

      const childName = record.child
        ? `${record.child.firstName} ${record.child.lastName}`
        : "a child";

      await broadcastHomeVisitEvent(tx, {
        actor,
        // Include original staff member in the recipient set if they aren't the actor
        extraRecipientId: record.staffId,
        notificationType: NotificationType.DATA_DELETE,
        priority:         NotificationPriority.HIGH,
        title:            "Home visit deleted",
        message:          `A home visit for ${childName} was deleted`,
        entityType:       "HomeVisit",
        relatedId:        record.id,
        action:           "DELETE",
        resource:         "HomeVisit",
        resourceId:       record.id,
        childId:          record.childId,
        metadata: {
          deletedRecord: {
            purpose:    record.purpose,
            visitDate:  record.visitDate,
            photoCount: record.photos?.length ?? 0,
          },
        },
      });

      return deleted;
    }, TX_OPTS);
  }

  // ── Find all visits for a child ───────────────────────────────────────────
  async findManyByChild(childId: string) {
    return prisma.homeVisit.findMany({
      where:   { childId },
      include: {
        staff:  { select: { firstName: true, lastName: true } },
        photos: true,
      },
      orderBy: { visitDate: "desc" },
    });
  }

  // ── Dashboard metrics ─────────────────────────────────────────────────────
  async getDashboardMetrics(sevenDaysAgo: Date, today: Date, nextWeek: Date) {
    return prisma.$transaction([
      prisma.homeVisit.count({
        where: { visitDate: { gte: sevenDaysAgo, lte: today } },
      }),
      prisma.homeVisit.count({
        where: { followUpDate: { lt: today }, isFollowUpDone: false },
      }),
      prisma.homeVisit.findMany({
        where:   { followUpDate: { gte: today, lte: nextWeek } },
        include: { child: { select: { childCode: true, firstName: true, lastName: true } } },
        take:    20,
        orderBy: { followUpDate: "asc" },
      }),
    ]);
  }

  // ── Mark follow-up done ───────────────────────────────────────────────────
  async updateFollowUpStatus(id: string, isDone: boolean, actor: ActorContext) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.homeVisit.findUnique({ where: { id } });
      if (!before) throw new Error("Home visit not found");

      const updated = await tx.homeVisit.update({
        where: { id },
        data:  { isFollowUpDone: isDone },
      });

      await broadcastHomeVisitEvent(tx, {
        actor,
        extraRecipientId: before.staffId,
        notificationType: NotificationType.DATA_UPDATE,
        priority:         NotificationPriority.LOW,
        title:            "Follow-up marked complete",
        message:          `A home visit follow-up has been marked as done`,
        entityType:       "HomeVisit",
        relatedId:        id,
        action:           "UPDATE",
        resource:         "HomeVisit",
        resourceId:       id,
        childId:          before.childId,
        metadata: {
          isFollowUpDone: { before: before.isFollowUpDone, after: isDone },
        },
      });

      return updated;
    }, TX_OPTS);
  }

  // ── Update visit fields + optionally append new photos ────────────────────
  async update(id: string, dto: HomeVisitUpdateInput, files: Express.Multer.File[], actor: ActorContext) {
    const { visitDate, followUpDate, isFollowUpDone, ...rest } = dto;

    const newPhotos = files.map((f) => ({
      url:      `/uploads/homevisits/${f.filename}`,
      publicId: f.path,
    }));

    return prisma.$transaction(async (tx) => {
      const before = await tx.homeVisit.findUnique({ where: { id } });
      if (!before) throw new Error("Home visit not found");

      const updated = await tx.homeVisit.update({
        where: { id },
        data: {
          ...rest,
          ...(visitDate      !== undefined ? { visitDate: new Date(visitDate) } : {}),
          ...(followUpDate   !== undefined ? { followUpDate: followUpDate ? new Date(followUpDate) : null } : {}),
          ...(isFollowUpDone !== undefined ? { isFollowUpDone } : {}),
          ...(newPhotos.length > 0 ? { photos: { create: newPhotos } } : {}),
        },
        include: {
          child:  { select: { childCode: true, firstName: true, lastName: true } },
          staff:  { select: { firstName: true, lastName: true } },
          photos: true,
        },
      });

      const changes       = diffFields(before as any, dto as any);
      const changedFields = Object.keys(changes);

      if (changedFields.length > 0 || newPhotos.length > 0) {
        const childName = updated.child
          ? `${updated.child.firstName} ${updated.child.lastName}`
          : "a child";

        await broadcastHomeVisitEvent(tx, {
          actor,
          extraRecipientId: before.staffId,
          notificationType: NotificationType.DATA_UPDATE,
          priority:         NotificationPriority.MEDIUM,
          title:            "Home visit updated",
          message:          `The home visit for ${childName} was updated (${changedFields.join(", ") || "photos added"})`,
          entityType:       "HomeVisit",
          relatedId:        id,
          action:           "UPDATE",
          resource:         "HomeVisit",
          resourceId:       id,
          childId:          before.childId,
          metadata: {
            changes,
            photosAdded: newPhotos.length,
          },
        });
      }

      return updated;
    }, TX_OPTS);
  }

  // ── Find one photo record ─────────────────────────────────────────────────
  async findPhoto(photoId: string) {
    return prisma.homeVisitPhoto.findUnique({ where: { id: photoId } });
  }

  // ── Delete one photo: removes local file from disk + DB row ──────────────
  async deletePhoto(photoId: string, actor: ActorContext) {
    const photo = await prisma.homeVisitPhoto.findUnique({
      where:   { id: photoId },
      include: { homeVisit: { select: { childId: true, staffId: true } } },
    });
    if (!photo) return null;

    // File deletion before the transaction.
    unlinkSafe(resolveDiskPath(photo), "deletePhoto");

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.homeVisitPhoto.delete({ where: { id: photoId } });

      await broadcastHomeVisitEvent(tx, {
        actor,
        extraRecipientId: photo.homeVisit?.staffId,
        notificationType: NotificationType.DATA_DELETE,
        priority:         NotificationPriority.LOW,
        title:            "Home visit photo deleted",
        message:          `A photo was removed from a home visit`,
        entityType:       "HomeVisitPhoto",
        relatedId:        photoId,
        action:           "DELETE",
        resource:         "HomeVisitPhoto",
        resourceId:       photoId,
        childId:          photo.homeVisit?.childId,
        metadata: {
          deletedPhotoUrl: photo.url,
        },
      });

      return deleted;
    }, TX_OPTS);
  }
}