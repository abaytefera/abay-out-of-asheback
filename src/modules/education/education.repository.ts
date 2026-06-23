import {
  Prisma,
  PromotionStatus,
  SupportMaterialType,
  NotificationType,
  NotificationPriority,
  UserRole,
} from "@prisma/client";
import prisma from "../../config/prisma";
import {
  CreateAcademicRecordDTO,
  UpdateAcademicRecordDTO,
  LogMaterialSupportDTO,
  UpdateMaterialSupportDTO,
  FileInputDTO,
} from "./education.dto";

// ─── Shared broadcast helper ──────────────────────────────────────────────────
//
// Writes BOTH a Notification AND an AuditLog row for every recipient in the
// deduplicated set: all active ADMINs + all active COUNTRY_DIRECTORs + the actor.

interface BroadcastParams {
  actorId: string;
  childId?: string;
  // Notification fields
  notificationType: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType: "AcademicRecord" | "MaterialSupport";
  relatedId?: string;
  // Audit log fields
  action: "CREATE" | "UPDATE" | "DELETE";
  resource: "AcademicRecord" | "MaterialSupport";
  resourceId: string;
  metadata?: object;
}

async function broadcastEducationEvent(params: BroadcastParams): Promise<void> {
  // 1. Collect all active ADMINs and COUNTRY_DIRECTORs
  const privileged = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR] },
      isActive: true,
    },
    select: { id: true },
  });

  // 2. Merge actor + deduplicate
  const recipientIds = Array.from(
    new Set([...privileged.map((u) => u.id), params.actorId])
  );

  // 3. Build notification rows
  const notifications: Prisma.NotificationCreateManyInput[] = recipientIds.map((userId) => ({
    userId,
    type: params.notificationType,
    priority: params.priority,
    title: params.title,
    message: params.message,
    entityType: params.entityType,
    relatedId: params.relatedId,
  }));

  // 4. Build audit log rows — one per recipient
  const auditLogs: Prisma.AuditLogCreateManyInput[] = recipientIds.map((userId) => ({
    userId,
    childId: params.childId ?? null,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
  }));

  // 5. Persist both in one transaction
  await prisma.$transaction([
    prisma.notification.createMany({ data: notifications }),
    prisma.auditLog.createMany({ data: auditLogs }),
  ]);
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class EducationRepository {
  // ── Academic Records ────────────────────────────────────────────────────────

  async createAcademicEntry(
    dto: CreateAcademicRecordDTO,
    filePayloads: FileInputDTO[],
    actorId: string
  ) {
    const record = await prisma.academicRecord.create({
      data: {
        childId: dto.childId,
        schoolName: dto.schoolName,
        academicYear: dto.academicYear,
        semester: dto.semester || null,
        grade: dto.grade,
        rank: dto.rank ?? null,
        averageScore: dto.averageScore ?? null,
        attendanceRate: dto.attendanceRate ?? null,
        nationalExamScore: dto.nationalExamScore ?? null,
        promotionStatus: (dto.promotionStatus as PromotionStatus) || PromotionStatus.PENDING,
        teacherNotes: dto.teacherNotes || null,
        files:
          filePayloads.length > 0
            ? {
                create: filePayloads.map((file) => ({
                  url: file.url,
                  publicId: file.publicId,
                  fileName: file.fileName || null,
                })),
              }
            : undefined,
      },
    });

    await broadcastEducationEvent({
      actorId,
      childId: dto.childId,
      notificationType: NotificationType.DATA_CREATE,
      priority: NotificationPriority.MEDIUM,
      title: "New Academic Record Created",
      message: `A new academic record for ${dto.academicYear} — ${dto.grade} at ${dto.schoolName} has been added.`,
      entityType: "AcademicRecord",
      relatedId: record.id,
      action: "CREATE",
      resource: "AcademicRecord",
      resourceId: record.id,
      metadata: {
        schoolName: dto.schoolName,
        academicYear: dto.academicYear,
        grade: dto.grade,
        rank: dto.rank ?? null,
        promotionStatus: dto.promotionStatus,
      },
    });

    return record;
  }

  async findAcademicEntryById(recordId: string) {
    return prisma.academicRecord.findUnique({
      where: { id: recordId },
      include: { files: true, alerts: true },
    });
  }

  async updateAcademicEntry(
    recordId: string,
    dto: UpdateAcademicRecordDTO,
    filePayloads: FileInputDTO[],
    actorId: string,
    childId: string
  ) {
    const updated = await prisma.academicRecord.update({
      where: { id: recordId },
      data: {
        ...(dto.schoolName !== undefined && { schoolName: dto.schoolName }),
        ...(dto.academicYear !== undefined && { academicYear: dto.academicYear }),
        ...(dto.semester !== undefined && { semester: dto.semester || null }),
        ...(dto.grade !== undefined && { grade: dto.grade }),
        ...(dto.rank !== undefined && { rank: dto.rank ?? null }),
        ...(dto.averageScore !== undefined && { averageScore: dto.averageScore }),
        ...(dto.attendanceRate !== undefined && { attendanceRate: dto.attendanceRate }),
        ...(dto.nationalExamScore !== undefined && { nationalExamScore: dto.nationalExamScore }),
        ...(dto.promotionStatus !== undefined && {
          promotionStatus: dto.promotionStatus as PromotionStatus,
        }),
        ...(dto.teacherNotes !== undefined && { teacherNotes: dto.teacherNotes || null }),
        files:
          filePayloads.length > 0
            ? {
                create: filePayloads.map((file) => ({
                  url: file.url,
                  publicId: file.publicId,
                  fileName: file.fileName || null,
                })),
              }
            : undefined,
      },
      include: { files: true, alerts: true },
    });

    await broadcastEducationEvent({
      actorId,
      childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority: NotificationPriority.LOW,
      title: "Academic Record Updated",
      message: `Academic record (${updated.grade} — ${updated.academicYear}) has been updated.`,
      entityType: "AcademicRecord",
      relatedId: recordId,
      action: "UPDATE",
      resource: "AcademicRecord",
      resourceId: recordId,
      metadata: { changes: dto },
    });

    return updated;
  }

  async deleteAcademicEntry(
    recordId: string,
    actorId: string,
    childId: string,
    meta: object
  ) {
    const deleted = await prisma.academicRecord.delete({ where: { id: recordId } });

    await broadcastEducationEvent({
      actorId,
      childId,
      notificationType: NotificationType.DATA_DELETE,
      priority: NotificationPriority.HIGH,
      title: "Academic Record Deleted",
      message: `An academic record has been permanently deleted.`,
      entityType: "AcademicRecord",
      relatedId: recordId,
      action: "DELETE",
      resource: "AcademicRecord",
      resourceId: recordId,
      metadata: meta,
    });

    return deleted;
  }

  async findRecordFileById(fileId: string) {
    return prisma.academicFile.findUnique({ where: { id: fileId } });
  }

  async deleteRecordFile(fileId: string) {
    return prisma.academicFile.delete({ where: { id: fileId } });
  }

  async clearUnresolvedAlertsForRecord(recordId: string) {
    return prisma.educationAlert.deleteMany({
      where: { academicRecordId: recordId, isResolved: false },
    });
  }

  async saveSystemAlerts(alerts: Prisma.EducationAlertCreateManyInput[]) {
    return prisma.educationAlert.createMany({ data: alerts });
  }

  async getAcademicHistoryByChild(childId: string) {
    return prisma.academicRecord.findMany({
      where: { childId },
      include: { alerts: true, files: true },
      orderBy: { academicYear: "desc" },
    });
  }

  async fetchPaginatedOpenAlerts(skip: number, limit: number) {
    return prisma.$transaction([
      prisma.educationAlert.findMany({
        where: { isResolved: false },
        include: {
          academicRecord: {
            include: {
              child: {
                select: { childCode: true, firstName: true, lastName: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.educationAlert.count({ where: { isResolved: false } }),
    ]);
  }

  async updateAlertResolution(alertId: string, resolvedById: string) {
    return prisma.educationAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedById,
        resolvedAt: new Date(),
      },
    });
  }

  // ── Material Support ────────────────────────────────────────────────────────

  async createMaterialSupportEntry(
    dto: LogMaterialSupportDTO,
    distributedById: string
  ) {
    const entry = await prisma.materialSupport.create({
      data: {
        childId: dto.childId,
        type: dto.type as SupportMaterialType,
        description: dto.description || null,
        quantity: dto.quantity ?? null,
        distributeDate: new Date(dto.distributeDate),
        distributedById,
        academicYear: dto.academicYear || null,
      },
    });

    await broadcastEducationEvent({
      actorId: distributedById,
      childId: dto.childId,
      notificationType: NotificationType.DATA_CREATE,
      priority: NotificationPriority.LOW,
      title: "Material Support Logged",
      message: `New material support (${dto.type}) has been logged for a child.`,
      entityType: "MaterialSupport",
      relatedId: entry.id,
      action: "CREATE",
      resource: "MaterialSupport",
      resourceId: entry.id,
      metadata: { type: dto.type, quantity: dto.quantity, academicYear: dto.academicYear },
    });

    return entry;
  }

  async findMaterialSupportById(materialId: string) {
    return prisma.materialSupport.findUnique({ where: { id: materialId } });
  }

  async updateMaterialSupportEntry(
    materialId: string,
    dto: UpdateMaterialSupportDTO,
    actorId: string,
    childId: string
  ) {
    const updated = await prisma.materialSupport.update({
      where: { id: materialId },
      data: {
        ...(dto.type !== undefined && { type: dto.type as SupportMaterialType }),
        ...(dto.description !== undefined && { description: dto.description || null }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.distributeDate !== undefined && {
          distributeDate: new Date(dto.distributeDate),
        }),
        ...(dto.academicYear !== undefined && { academicYear: dto.academicYear || null }),
      },
      include: {
        distributedBy: { select: { firstName: true, lastName: true } },
      },
    });

    await broadcastEducationEvent({
      actorId,
      childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority: NotificationPriority.LOW,
      title: "Material Support Updated",
      message: `A material support entry has been updated.`,
      entityType: "MaterialSupport",
      relatedId: materialId,
      action: "UPDATE",
      resource: "MaterialSupport",
      resourceId: materialId,
      metadata: { changes: dto },
    });

    return updated;
  }

  async deleteMaterialSupportEntry(
    materialId: string,
    actorId: string,
    childId: string,
    meta: object
  ) {
    const deleted = await prisma.materialSupport.delete({ where: { id: materialId } });

    await broadcastEducationEvent({
      actorId,
      childId,
      notificationType: NotificationType.DATA_DELETE,
      priority: NotificationPriority.MEDIUM,
      title: "Material Support Deleted",
      message: `A material support entry has been permanently deleted.`,
      entityType: "MaterialSupport",
      relatedId: materialId,
      action: "DELETE",
      resource: "MaterialSupport",
      resourceId: materialId,
      metadata: meta,
    });

    return deleted;
  }

  async getMaterialHistoryByChild(childId: string) {
    return prisma.materialSupport.findMany({
      where: { childId },
      include: {
        distributedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { distributeDate: "desc" },
    });
  }
}