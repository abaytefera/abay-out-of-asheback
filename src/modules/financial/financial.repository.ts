
import { Prisma, FinancialSupportType, UserRole, NotificationType, NotificationPriority } from "@prisma/client";
import prisma from "../../config/prisma";
import { DisbursementInput, UpdateDisbursementInput } from "./financial.dto";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads", "financial");

// =============================================================================
// SHARED HELPERS
// Both sendNotifications and writeAuditLog follow the same rule:
//   ONE ROW PER RECIPIENT = actor + every active ADMIN + every active COUNTRY_DIRECTOR
// =============================================================================

/**
 * Returns a deduplicated list of user IDs that must receive both a
 * Notification row AND an AuditLog row:
 *   1. Every active ADMIN
 *   2. Every active COUNTRY_DIRECTOR
 *   3. The user who performed the action (actingUserId)
 *
 * The Set deduplicates automatically when the actor is already ADMIN/COUNTRY_DIRECTOR.
 */
async function resolveRecipients(actingUserId: string): Promise<string[]> {
  const privileged = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR] },
    },
    select: { id: true },
  });

  const ids = new Set<string>(privileged.map((u) => u.id));
  ids.add(actingUserId); // always include the actor
  return Array.from(ids);
}

// ── Notification ──────────────────────────────────────────────────────────────

interface NotifyPayload {
  actingUserId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  relatedId: string;
}

/**
 * Creates ONE Notification row per recipient.
 */
async function sendNotifications(payload: NotifyPayload): Promise<void> {
  const recipientIds = await resolveRecipients(payload.actingUserId);

  await prisma.notification.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      type:       payload.type,
      priority:   payload.priority,
      title:      payload.title,
      message:    payload.message,
      entityType: "FinancialSupport",
      relatedId:  payload.relatedId,
    })),
    skipDuplicates: true,
  });
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

interface AuditPayload {
  actingUserId: string;
  childId: string | null;
  action: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates ONE AuditLog row per recipient (same recipients as notifications).
 * Every admin and country director gets their own row so they can see it
 * in their own audit log view — exactly the same as notifications.
 */
async function writeAuditLog(payload: AuditPayload): Promise<void> {
  const recipientIds = await resolveRecipients(payload.actingUserId);

  await prisma.auditLog.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      childId:    payload.childId    ?? null,
      action:     payload.action,
      resource:   "FinancialSupport",
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

// ── Request context forwarded from the controller ─────────────────────────────

export interface RequestContext {
  actingUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ── Repository ────────────────────────────────────────────────────────────────

export class FinancialRepository {

  // ── Create ───────────────────────────────────────────────────────────────────
  async create(
    dto: DisbursementInput,
    disbursedById: string,
    files: Express.Multer.File[],
    ctx: RequestContext
  ) {
    const record = await prisma.financialSupport.create({
      data: {
        childId:      dto.childId,
        supportType:  dto.supportType,
        amount:       dto.amount,
        currency:     dto.currency,
        disbursedDate: dto.disbursedDate,
        academicYear: dto.academicYear || null,
        notes:        dto.notes        || null,
        disbursedById,
        files: files.length > 0
          ? {
              create: files.map((file) => ({
                url:      `/uploads/financial/${file.filename}`,
                publicId: file.filename,
                fileName: file.originalname,
              })),
            }
          : undefined,
      },
      include: {
        child:       { select: { childCode: true, firstName: true, lastName: true } },
        disbursedBy: { select: { firstName: true, lastName: true } },
        files: true,
      },
    });

    const childName = `${record.child.firstName} ${record.child.lastName}`;

    await Promise.all([
      writeAuditLog({
        actingUserId: ctx.actingUserId,
        childId:      record.childId,
        action:       "CREATE",
        resourceId:   record.id,
        ipAddress:    ctx.ipAddress,
        userAgent:    ctx.userAgent,
        metadata: {
          supportType:   record.supportType,
          amount:        record.amount,
          currency:      record.currency,
          disbursedDate: record.disbursedDate,
          academicYear:  record.academicYear,
          filesAttached: files.length,
        },
      }),
      sendNotifications({
        actingUserId: ctx.actingUserId,
        type:         NotificationType.DATA_CREATE,
        priority:     NotificationPriority.MEDIUM,
        title:        "Financial Support Created",
        message:      `A new ${record.supportType} disbursement of ${record.currency} ${record.amount} was recorded for ${childName} (${record.child.childCode}).`,
        relatedId:    record.id,
      }),
    ]);

    return record;
  }

  // ── Update metadata ───────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateDisbursementInput, ctx: RequestContext) {
    const before = await prisma.financialSupport.findUnique({
      where:   { id },
      include: { child: { select: { childCode: true, firstName: true, lastName: true } } },
    });

    const record = await prisma.financialSupport.update({
      where: { id },
      data: {
        ...(dto.supportType   !== undefined && { supportType:   dto.supportType }),
        ...(dto.amount        !== undefined && { amount:        parseFloat(dto.amount as any) }),
        ...(dto.currency      !== undefined && { currency:      dto.currency }),
        ...(dto.disbursedDate !== undefined && { disbursedDate: new Date(dto.disbursedDate) }),
        ...(dto.academicYear  !== undefined && { academicYear:  dto.academicYear }),
        ...(dto.notes         !== undefined && { notes:         dto.notes }),
      },
      include: {
        child:       { select: { childCode: true, firstName: true, lastName: true } },
        disbursedBy: { select: { firstName: true, lastName: true } },
        files: true,
      },
    });

    const childName = `${record.child.firstName} ${record.child.lastName}`;

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (before) {
      if (dto.supportType   !== undefined && before.supportType   !== record.supportType)
        changes.supportType   = { from: before.supportType,   to: record.supportType };
      if (dto.amount        !== undefined && before.amount        !== record.amount)
        changes.amount        = { from: before.amount,        to: record.amount };
      if (dto.currency      !== undefined && before.currency      !== record.currency)
        changes.currency      = { from: before.currency,      to: record.currency };
      if (dto.disbursedDate !== undefined)
        changes.disbursedDate = { from: before.disbursedDate, to: record.disbursedDate };
      if (dto.academicYear  !== undefined && before.academicYear  !== record.academicYear)
        changes.academicYear  = { from: before.academicYear,  to: record.academicYear };
      if (dto.notes         !== undefined && before.notes         !== record.notes)
        changes.notes         = { from: before.notes,         to: record.notes };
    }

    await Promise.all([
      writeAuditLog({
        actingUserId: ctx.actingUserId,
        childId:      record.childId,
        action:       "UPDATE",
        resourceId:   record.id,
        ipAddress:    ctx.ipAddress,
        userAgent:    ctx.userAgent,
        metadata:     { changes },
      }),
      sendNotifications({
        actingUserId: ctx.actingUserId,
        type:         NotificationType.DATA_UPDATE,
        priority:     NotificationPriority.MEDIUM,
        title:        "Financial Support Updated",
        message:      `The ${record.supportType} disbursement record for ${childName} (${record.child.childCode}) was updated.`,
        relatedId:    record.id,
      }),
    ]);

    return record;
  }

  // ── Find by id ────────────────────────────────────────────────────────────────
  async findById(id: string) {
    return prisma.financialSupport.findUnique({
      where:   { id },
      include: {
        files: true,
        child: { select: { childCode: true, firstName: true, lastName: true } },
      },
    });
  }

  // ── Find a single file ────────────────────────────────────────────────────────
  async findFile(fileId: string) {
    return prisma.financialSupportFile.findUnique({ where: { id: fileId } });
  }

  // ── Delete whole record + disk files ─────────────────────────────────────────
  async deleteWithFiles(
    record: Prisma.FinancialSupportGetPayload<{
      include: {
        files: true;
        child: { select: { childCode: true; firstName: true; lastName: true } };
      };
    }>,
    ctx: RequestContext
  ) {
    if (record.files?.length > 0) {
      record.files.forEach((file) => {
        const filePath = path.join(uploadDir, file.publicId);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    const childName = `${record.child.firstName} ${record.child.lastName}`;

    // Write audit log BEFORE the DB row is gone so resourceId is still valid
    await writeAuditLog({
      actingUserId: ctx.actingUserId,
      childId:      record.childId,
      action:       "DELETE",
      resourceId:   record.id,
      ipAddress:    ctx.ipAddress,
      userAgent:    ctx.userAgent,
      metadata: {
        supportType:   record.supportType,
        amount:        record.amount,
        currency:      record.currency,
        disbursedDate: record.disbursedDate,
        filesDeleted:  record.files.length,
      },
    });

    const deleted = await prisma.financialSupport.delete({ where: { id: record.id } });

    // Send notifications after deletion
    await sendNotifications({
      actingUserId: ctx.actingUserId,
      type:         NotificationType.DATA_DELETE,
      priority:     NotificationPriority.HIGH,
      title:        "Financial Support Deleted",
      message:      `The ${record.supportType} disbursement of ${record.currency} ${record.amount} for ${childName} (${record.child.childCode}) was permanently deleted.`,
      relatedId:    record.id,
    });

    return deleted;
  }

  // ── Append files to an existing record ───────────────────────────────────────
  async appendFiles(
    recordId: string,
    files: Express.Multer.File[],
    ctx: RequestContext
  ) {
    const record = await prisma.financialSupport.update({
      where: { id: recordId },
      data: {
        files: {
          create: files.map((file) => ({
            url:      `/uploads/financial/${file.filename}`,
            publicId: file.filename,
            fileName: file.originalname,
          })),
        },
      },
      include: {
        child:       { select: { childCode: true, firstName: true, lastName: true } },
        disbursedBy: { select: { firstName: true, lastName: true } },
        files: true,
      },
    });

    const childName = `${record.child.firstName} ${record.child.lastName}`;

    await Promise.all([
      writeAuditLog({
        actingUserId: ctx.actingUserId,
        childId:      record.childId,
        action:       "ADD_FILES",
        resourceId:   recordId,
        ipAddress:    ctx.ipAddress,
        userAgent:    ctx.userAgent,
        metadata:     { filesAdded: files.length },
      }),
      sendNotifications({
        actingUserId: ctx.actingUserId,
        type:         NotificationType.DATA_UPDATE,
        priority:     NotificationPriority.LOW,
        title:        "Files Added to Financial Record",
        message:      `${files.length} file(s) were added to the ${record.supportType} record for ${childName} (${record.child.childCode}).`,
        relatedId:    recordId,
      }),
    ]);

    return record;
  }

  // ── Delete a single file from disk + DB ──────────────────────────────────────
  async deleteFile(
    file: { id: string; publicId: string; financialSupportId: string },
    ctx: RequestContext
  ) {
    const filePath = path.join(uploadDir, file.publicId);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const result = await prisma.financialSupportFile.delete({
      where: { id: file.id },
      select: {
        financialSupport: {
          select: {
            childId:     true,
            supportType: true,
            child: { select: { childCode: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    const { childId, supportType, child } = result.financialSupport;
    const childName = `${child.firstName} ${child.lastName}`;

    await Promise.all([
      writeAuditLog({
        actingUserId: ctx.actingUserId,
        childId,
        action:       "DELETE_FILE",
        resourceId:   file.financialSupportId,
        ipAddress:    ctx.ipAddress,
        userAgent:    ctx.userAgent,
        metadata:     { deletedFileId: file.id, publicId: file.publicId },
      }),
      sendNotifications({
        actingUserId: ctx.actingUserId,
        type:         NotificationType.DATA_DELETE,
        priority:     NotificationPriority.LOW,
        title:        "File Removed from Financial Record",
        message:      `A file was removed from the ${supportType} record for ${childName} (${child.childCode}).`,
        relatedId:    file.financialSupportId,
      }),
    ]);

    return result;
  }

  // ── List by child ─────────────────────────────────────────────────────────────
  async getByChildId(childId: string) {
    const records = await prisma.financialSupport.findMany({
      where:   { childId },
      include: {
        disbursedBy: { select: { firstName: true, lastName: true } },
        files: true,
      },
      orderBy: { disbursedDate: "desc" },
    });

    const totalByType = await prisma.financialSupport.groupBy({
      by:      ["supportType"],
      where:   { childId },
      _sum:    { amount: true },
      orderBy: { supportType: "asc" },
    });

    return { records, totalByType };
  }

  // ── Paginated report ──────────────────────────────────────────────────────────
  async getPaginatedReport(
    where: Prisma.FinancialSupportWhereInput,
    skip: number,
    limit: number
  ) {
    return prisma.$transaction([
      prisma.financialSupport.findMany({
        where,
        skip,
        take:    limit,
        include: {
          child: { select: { childCode: true, firstName: true, lastName: true } },
          files: true,
        },
        orderBy: { disbursedDate: "desc" },
      }),
      prisma.financialSupport.count({ where }),
      prisma.financialSupport.aggregate({
        where,
        _sum: { amount: true },
        _avg: { amount: true },
      }),
    ]);
  }
}
