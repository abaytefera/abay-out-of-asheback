// =============================================================================
// Model — ChildOtherRecord
// =============================================================================

import { prisma } from "../../config/prisma";
import {
  ChildOtherRecord,
  ChildOtherRecordFile,
  Prisma,
  UserRole,
  NotificationType,
  NotificationPriority,
} from "@prisma/client";

export interface FilePayload {
  url: string;
  publicId: string;
}

export type ChildOtherRecordWithFiles = ChildOtherRecord & {
  files: ChildOtherRecordFile[];
};

export type ChildOtherRecordFileWithRecord = ChildOtherRecordFile & {
  record: ChildOtherRecord;
};

// ── READ ──────────────────────────────────────────────────────────────────────

export const findRecordsByChildId = (childId: string): Promise<ChildOtherRecordWithFiles[]> =>
  prisma.childOtherRecord.findMany({
    where:   { childId },
    orderBy: { createdAt: "desc" },
    include: { files: { orderBy: { createdAt: "asc" } } },
  });

export const findRecordById = (recordId: string): Promise<ChildOtherRecordWithFiles | null> =>
  prisma.childOtherRecord.findUnique({
    where:   { id: recordId },
    include: { files: { orderBy: { createdAt: "asc" } } },
  });

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createRecord = (
  childId: string,
  title: string,
  description: string = "",
  files: FilePayload[] = []
): Promise<ChildOtherRecordWithFiles> =>
  prisma.childOtherRecord.create({
    data: {
      childId,
      title,
      description,
      files: files.length
        ? { create: files.map(({ url, publicId }) => ({ url, publicId })) }
        : undefined,
    },
    include: { files: true },
  });

// ── UPDATE ────────────────────────────────────────────────────────────────────

export const updateRecord = (
  recordId: string,
  data: { title?: string; description?: string }
): Promise<ChildOtherRecordWithFiles> =>
  prisma.childOtherRecord.update({
    where: { id: recordId },
    data: {
      ...(data.title       !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: { files: true },
  });

// ── APPEND FILES ──────────────────────────────────────────────────────────────

export const appendFiles = (
  recordId: string,
  files: FilePayload[]
): Promise<Prisma.BatchPayload> =>
  prisma.childOtherRecordFile.createMany({
    data: files.map(({ url, publicId }) => ({ recordId, url, publicId })),
  });

// ── DELETE FILE ───────────────────────────────────────────────────────────────

export const deleteFileByPublicId = (publicId: string): Promise<Prisma.BatchPayload> =>
  prisma.childOtherRecordFile.deleteMany({ where: { publicId } });

export const findFilesByRecordId = (recordId: string): Promise<ChildOtherRecordFile[]> =>
  prisma.childOtherRecordFile.findMany({ where: { recordId } });

// ── DELETE RECORD ─────────────────────────────────────────────────────────────

export const deleteRecord = (recordId: string): Promise<ChildOtherRecord> =>
  prisma.childOtherRecord.delete({ where: { id: recordId } });

// ── OWNERSHIP CHECK ───────────────────────────────────────────────────────────

export const findRecordByFilePublicId = async (
  publicId: string
): Promise<ChildOtherRecordFileWithRecord | null> =>
  prisma.childOtherRecordFile.findFirst({
    where:   { publicId },
    include: { record: true },
  }) as Promise<ChildOtherRecordFileWithRecord | null>;

// =============================================================================
// SHARED HELPERS — Notifications + Audit Logs
// Both follow the same rule:
//   • One row per recipient (actor + every active ADMIN + COUNTRY_DIRECTOR)
// =============================================================================

/**
 * Returns a deduplicated list of user IDs that must receive both a
 * notification AND an audit log row:
 *   1. Every active ADMIN
 *   2. Every active COUNTRY_DIRECTOR
 *   3. The user who performed the action (actingUserId)
 */
export async function resolveRecipients(actingUserId: string): Promise<string[]> {
  const privileged = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR] },
    },
    select: { id: true },
  });

  const ids = new Set<string>(privileged.map((u) => u.id));
  ids.add(actingUserId); // always include the actor — Set deduplicates if they are already admin/CD
  return Array.from(ids);
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface NotifyPayload {
  actingUserId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  relatedId: string;
}

/**
 * Creates one Notification row for every recipient (actor + ADMINs + COUNTRY_DIRECTORs).
 */
export async function sendNotifications(payload: NotifyPayload): Promise<void> {
  const recipientIds = await resolveRecipients(payload.actingUserId);

  await prisma.notification.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      type:       payload.type,
      priority:   payload.priority,
      title:      payload.title,
      message:    payload.message,
      entityType: "ChildOtherRecord",
      relatedId:  payload.relatedId,
    })),
    skipDuplicates: true,
  });
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export interface AuditPayload {
  actingUserId: string;
  childId: string | null;
  action: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates one AuditLog row for every recipient (actor + ADMINs + COUNTRY_DIRECTORs).
 * Each row has the same action/resource data but a different userId so every
 * admin and the actor can all see it in their own audit log view.
 */
export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  const recipientIds = await resolveRecipients(payload.actingUserId);

  await prisma.auditLog.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      childId:    payload.childId    ?? null,
      action:     payload.action,
      resource:   "ChildOtherRecord",
      resourceId: payload.resourceId,
      ipAddress:  payload.ipAddress  ?? null,
      userAgent:  payload.userAgent  ?? null,
      metadata:   payload.metadata
        ? (payload.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    })),
    skipDuplicates: true,
  });
}