import path from "path";
import fs from "fs";
import { Prisma, NotificationType, NotificationPriority, UserRole } from "@prisma/client";
import prisma from "../../config/prisma";
import { HealthRecordInput, VaccinationInput, NutritionInput } from "./health.dto";

const UPLOAD_ROOTS: Record<string, string> = {
  health:  path.join(process.cwd(), "uploads", "health"),
  vaccine: path.join(process.cwd(), "uploads", "vaccine"),
};

function unlinkSafe(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch { /* ignore */ }
}

// ─── Shared broadcast helper ──────────────────────────────────────────────────
//
// Writes BOTH a Notification AND an AuditLog row for every recipient in the
// deduplicated set: all active ADMINs + all active COUNTRY_DIRECTORs + the actor.

interface BroadcastParams {
  actorId: string;
  childId?: string | null;
  // Notification
  notificationType: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType: "HealthRecord" | "Vaccination" | "NutritionRecord" | "HealthRecordFile" | "VaccinationFile";
  relatedId: string;
  // Audit log
  action: "CREATE" | "UPDATE" | "DELETE";
  resource: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

async function broadcastHealthEvent(params: BroadcastParams): Promise<void> {
  // 1. All active ADMINs + COUNTRY_DIRECTORs
  const privileged = await prisma.user.findMany({
    where: { role: { in: [UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR] }, isActive: true },
    select: { id: true },
  });

  // 2. Merge actor + deduplicate
  const recipientIds = Array.from(
    new Set([...privileged.map((u) => u.id), params.actorId])
  );

  // 3. Notifications + audit logs in one transaction
  await prisma.$transaction([
    prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type:       params.notificationType,
        priority:   params.priority,
        title:      params.title,
        message:    params.message,
        entityType: params.entityType,
        relatedId:  params.relatedId,
      })),
    }),
    prisma.auditLog.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        childId:    params.childId ?? null,
        action:     params.action,
        resource:   params.resource,
        resourceId: params.resourceId,
        metadata:   (params.metadata ?? {}) as Prisma.InputJsonValue,
      })),
    }),
  ]);
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class HealthRepository {

  // ── CREATE ────────────────────────────────────────────────────

  async createHealthRecord(dto: HealthRecordInput, actorId: string, files: Express.Multer.File[]) {
    const record = await prisma.healthRecord.create({
      data: {
        childId:             dto.childId,
        recordDate:          new Date(dto.recordDate),
        knownDisabilities:   dto.knownDisabilities   || null,
        hospitalVisitReason: dto.hospitalVisitReason || null,
        hospitalName:        dto.hospitalName        || null,
        notes:               dto.notes               || null,
        recordedById:        actorId,
        files: files.length > 0 ? {
          create: files.map((f) => ({
            url:      `/uploads/health/${f.filename}`,
            publicId: f.filename,
            fileName: f.originalname,
          })),
        } : undefined,
      },
      include: { files: true },
    });

    await broadcastHealthEvent({
      actorId,
      childId:          dto.childId,
      notificationType: NotificationType.DATA_CREATE,
      priority:         NotificationPriority.MEDIUM,
      title:            "New health record created",
      message:          `A health record was added for a child (${dto.recordDate.slice(0, 10)}).`,
      entityType:       "HealthRecord",
      relatedId:        record.id,
      action:           "CREATE",
      resource:         "HealthRecord",
      resourceId:       record.id,
      metadata: {
        hospitalName:        dto.hospitalName        || null,
        hospitalVisitReason: dto.hospitalVisitReason || null,
        fileCount:           files.length,
      },
    });

    return record;
  }

  async createVaccination(dto: VaccinationInput, actorId: string, files: Express.Multer.File[]) {
    const record = await prisma.vaccination.create({
      data: {
        childId:        dto.childId,
        vaccineName:    dto.vaccineName,
        dateGiven:      new Date(dto.dateGiven),
        nextDueDate:    dto.nextDueDate ? new Date(dto.nextDueDate) : null,
        administeredBy: dto.administeredBy || null,
        notes:          dto.notes          || null,
        files: files.length > 0 ? {
          create: files.map((f) => ({
            url:      `/uploads/vaccine/${f.filename}`,
            publicId: f.filename,
            fileName: f.originalname,
          })),
        } : undefined,
      },
      include: { files: true },
    });

    await broadcastHealthEvent({
      actorId,
      childId:          dto.childId,
      notificationType: NotificationType.DATA_CREATE,
      priority:         NotificationPriority.MEDIUM,
      title:            "Vaccination recorded",
      message:          `Vaccination "${dto.vaccineName}" was recorded for a child.`,
      entityType:       "Vaccination",
      relatedId:        record.id,
      action:           "CREATE",
      resource:         "Vaccination",
      resourceId:       record.id,
      metadata: {
        vaccineName:    dto.vaccineName,
        dateGiven:      dto.dateGiven,
        administeredBy: dto.administeredBy || null,
      },
    });

    return record;
  }

  async createNutritionRecord(dto: NutritionInput, bmi: number | null, actorId: string) {
    const record = await prisma.nutritionRecord.create({
      data: {
        childId:     dto.childId,
        recordDate:  new Date(dto.recordDate),
        heightCm:    dto.heightCm ?? null,
        weightKg:    dto.weightKg ?? null,
        bmi,
        notes:       dto.notes || null,
        recordedById: actorId,
      },
    });

    await broadcastHealthEvent({
      actorId,
      childId:          dto.childId,
      notificationType: NotificationType.DATA_CREATE,
      priority:         NotificationPriority.LOW,
      title:            "Nutrition record saved",
      message:          `A nutrition record was saved for a child (${dto.recordDate.slice(0, 10)}).`,
      entityType:       "NutritionRecord",
      relatedId:        record.id,
      action:           "CREATE",
      resource:         "NutritionRecord",
      resourceId:       record.id,
      metadata: { heightCm: dto.heightCm, weightKg: dto.weightKg, bmi },
    });

    return record;
  }

  // ── READ ──────────────────────────────────────────────────────

  async findHealthHistoryByChild(childId: string) {
    return prisma.healthRecord.findMany({
      where:   { childId },
      include: { files: true, recordedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { recordDate: "desc" },
    });
  }

  async findVaccinationsByChild(childId: string) {
    return prisma.vaccination.findMany({
      where:   { childId },
      include: { files: true },
      orderBy: { dateGiven: "desc" },
    });
  }

  async findNutritionHistoryByChild(childId: string) {
    return prisma.nutritionRecord.findMany({
      where:   { childId },
      include: { recordedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { recordDate: "asc" },
    });
  }

  // ── UPDATE ────────────────────────────────────────────────────

  async updateHealthRecord(id: string, dto: Partial<HealthRecordInput>, actorId: string, files: Express.Multer.File[]) {
    const existing = await prisma.healthRecord.findUnique({ where: { id } });

    const record = await prisma.healthRecord.update({
      where: { id },
      data: {
        ...(dto.recordDate          && { recordDate:          new Date(dto.recordDate) }),
        ...(dto.hospitalName        !== undefined && { hospitalName:        dto.hospitalName        || null }),
        ...(dto.hospitalVisitReason !== undefined && { hospitalVisitReason: dto.hospitalVisitReason || null }),
        ...(dto.knownDisabilities   !== undefined && { knownDisabilities:   dto.knownDisabilities   || null }),
        ...(dto.notes               !== undefined && { notes:               dto.notes               || null }),
        files: files.length > 0 ? {
          create: files.map((f) => ({
            url:      `/uploads/health/${f.filename}`,
            publicId: f.filename,
            fileName: f.originalname,
          })),
        } : undefined,
      },
      include: { files: true },
    });

    await broadcastHealthEvent({
      actorId,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         NotificationPriority.LOW,
      title:            "Health record updated",
      message:          `A health record has been updated.`,
      entityType:       "HealthRecord",
      relatedId:        id,
      action:           "UPDATE",
      resource:         "HealthRecord",
      resourceId:       id,
      metadata:         { changes: dto, filesAdded: files.length },
    });

    return record;
  }

  async updateVaccination(id: string, dto: Partial<VaccinationInput>, actorId: string, files: Express.Multer.File[]) {
    const existing = await prisma.vaccination.findUnique({ where: { id } });

    const record = await prisma.vaccination.update({
      where: { id },
      data: {
        ...(dto.vaccineName    !== undefined && dto.vaccineName && { vaccineName:    dto.vaccineName }),
        ...(dto.dateGiven      && { dateGiven:      new Date(dto.dateGiven) }),
        ...(dto.nextDueDate    !== undefined && { nextDueDate:    dto.nextDueDate ? new Date(dto.nextDueDate) : null }),
        ...(dto.administeredBy !== undefined && { administeredBy: dto.administeredBy || null }),
        ...(dto.notes          !== undefined && { notes:          dto.notes          || null }),
        files: files.length > 0 ? {
          create: files.map((f) => ({
            url:      `/uploads/vaccine/${f.filename}`,
            publicId: f.filename,
            fileName: f.originalname,
          })),
        } : undefined,
      },
      include: { files: true },
    });

    await broadcastHealthEvent({
      actorId,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         NotificationPriority.LOW,
      title:            "Vaccination updated",
      message:          `A vaccination record has been updated.`,
      entityType:       "Vaccination",
      relatedId:        id,
      action:           "UPDATE",
      resource:         "Vaccination",
      resourceId:       id,
      metadata:         { changes: dto, filesAdded: files.length },
    });

    return record;
  }

  async updateNutritionRecord(id: string, dto: Partial<NutritionInput>, bmi: number | null, actorId: string) {
    const existing = await prisma.nutritionRecord.findUnique({ where: { id } });

    const record = await prisma.nutritionRecord.update({
      where: { id },
      data: {
        ...(dto.recordDate && { recordDate: new Date(dto.recordDate) }),
        ...(dto.heightCm   !== undefined && { heightCm: dto.heightCm ?? null }),
        ...(dto.weightKg   !== undefined && { weightKg: dto.weightKg ?? null }),
        ...(bmi !== null               && { bmi }),
        ...(dto.notes      !== undefined && { notes: dto.notes || null }),
      },
    });

    await broadcastHealthEvent({
      actorId,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         NotificationPriority.LOW,
      title:            "Nutrition record updated",
      message:          `A nutrition record has been updated.`,
      entityType:       "NutritionRecord",
      relatedId:        id,
      action:           "UPDATE",
      resource:         "NutritionRecord",
      resourceId:       id,
      metadata:         { changes: dto, bmi },
    });

    return record;
  }

  // ── DELETE RECORD ─────────────────────────────────────────────

  async deleteHealthRecord(id: string, actorId: string) {
    const record = await prisma.healthRecord.findUnique({
      where: { id },
      include: { files: true },
    });
    if (record?.files) {
      for (const f of record.files) {
        unlinkSafe(path.join(UPLOAD_ROOTS.health, f.publicId));
      }
    }
    const deleted = await prisma.healthRecord.delete({ where: { id } });

    await broadcastHealthEvent({
      actorId,
      childId:          record?.childId,
      notificationType: NotificationType.DATA_DELETE,
      priority:         NotificationPriority.HIGH,
      title:            "Health record deleted",
      message:          `A health record has been permanently deleted.`,
      entityType:       "HealthRecord",
      relatedId:        id,
      action:           "DELETE",
      resource:         "HealthRecord",
      resourceId:       id,
      metadata:         { fileCount: record?.files?.length ?? 0 },
    });

    return deleted;
  }

  async deleteVaccination(id: string, actorId: string) {
    const record = await prisma.vaccination.findUnique({
      where: { id },
      include: { files: true },
    });
    if (record?.files) {
      for (const f of record.files) {
        unlinkSafe(path.join(UPLOAD_ROOTS.vaccine, f.publicId));
      }
    }
    const deleted = await prisma.vaccination.delete({ where: { id } });

    await broadcastHealthEvent({
      actorId,
      childId:          record?.childId,
      notificationType: NotificationType.DATA_DELETE,
      priority:         NotificationPriority.HIGH,
      title:            "Vaccination deleted",
      message:          `A vaccination record has been permanently deleted.`,
      entityType:       "Vaccination",
      relatedId:        id,
      action:           "DELETE",
      resource:         "Vaccination",
      resourceId:       id,
      metadata:         { vaccineName: record?.vaccineName },
    });

    return deleted;
  }

  async deleteNutritionRecord(id: string, actorId: string) {
    const record = await prisma.nutritionRecord.findUnique({ where: { id } });
    const deleted = await prisma.nutritionRecord.delete({ where: { id } });

    await broadcastHealthEvent({
      actorId,
      childId:          record?.childId,
      notificationType: NotificationType.DATA_DELETE,
      priority:         NotificationPriority.MEDIUM,
      title:            "Nutrition record deleted",
      message:          `A nutrition record has been permanently deleted.`,
      entityType:       "NutritionRecord",
      relatedId:        id,
      action:           "DELETE",
      resource:         "NutritionRecord",
      resourceId:       id,
      metadata:         { recordDate: record?.recordDate },
    });

    return deleted;
  }

  // ── DELETE SINGLE FILE ────────────────────────────────────────

  async deleteFile(fileId: string, context: string, actorId: string) {
    let file: { publicId: string; healthRecordId?: string } | null = null;

    try {
      file = await (prisma as any).healthRecordFile.findUnique({ where: { id: fileId } });
      if (file) {
        unlinkSafe(path.join(UPLOAD_ROOTS.health, file.publicId));
        const deleted = await (prisma as any).healthRecordFile.delete({ where: { id: fileId } });
        await broadcastHealthEvent({
          actorId,
          notificationType: NotificationType.DATA_DELETE,
          priority:         NotificationPriority.LOW,
          title:            "Health file deleted",
          message:          `A file was removed from a health record.`,
          entityType:       "HealthRecordFile",
          relatedId:        fileId,
          action:           "DELETE",
          resource:         "HealthRecordFile",
          resourceId:       fileId,
          metadata:         { publicId: file.publicId },
        });
        return deleted;
      }
    } catch { /* model may not exist under this name */ }

    try {
      file = await (prisma as any).vaccinationFile.findUnique({ where: { id: fileId } });
      if (file) {
        unlinkSafe(path.join(UPLOAD_ROOTS.vaccine, file.publicId));
        const deleted = await (prisma as any).vaccinationFile.delete({ where: { id: fileId } });
        await broadcastHealthEvent({
          actorId,
          notificationType: NotificationType.DATA_DELETE,
          priority:         NotificationPriority.LOW,
          title:            "Vaccine file deleted",
          message:          `A file was removed from a vaccination record.`,
          entityType:       "VaccinationFile",
          relatedId:        fileId,
          action:           "DELETE",
          resource:         "VaccinationFile",
          resourceId:       fileId,
          metadata:         { publicId: file.publicId },
        });
        return deleted;
      }
    } catch { /* model may not exist under this name */ }

    const modelKey = context === "vaccine" ? "vaccinationFile" : "healthRecordFile";
    const found = await (prisma as any)[modelKey].findUnique({ where: { id: fileId } });
    if (found) {
      const root = context === "vaccine" ? UPLOAD_ROOTS.vaccine : UPLOAD_ROOTS.health;
      unlinkSafe(path.join(root, found.publicId));
      return (prisma as any)[modelKey].delete({ where: { id: fileId } });
    }

    throw new Error("File not found");
  }
}