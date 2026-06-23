import fs from "fs";
import path from "path";
import { Prisma, PromotionStatus } from "@prisma/client";
import { EducationRepository } from "./education.repository";
import {
  CreateAcademicRecordDTO,
  UpdateAcademicRecordDTO,
  LogMaterialSupportDTO,
  UpdateMaterialSupportDTO,
  FileInputDTO,
} from "./education.dto";
import { AppError } from "../../utils/AppError";

export class EducationService {
  private repository: EducationRepository;

  constructor() {
    this.repository = new EducationRepository();
  }

  // ── Academic Records ────────────────────────────────────────────────────────

  async createRecord(dto: CreateAcademicRecordDTO, filePayloads: FileInputDTO[], actorId: string) {
    // 1. Persist base record
    const record = await this.repository.createAcademicEntry(dto, filePayloads, actorId);

    // 2. Compute risk alerts
    const alerts: Prisma.EducationAlertCreateManyInput[] = [];

    if (dto.averageScore !== undefined && dto.averageScore !== null && dto.averageScore < 50) {
      alerts.push({
        academicRecordId: record.id,
        alertType: "LOW_GRADE",
        message: `Average score ${dto.averageScore}% is below threshold`,
      });
    }

    if (dto.attendanceRate !== undefined && dto.attendanceRate !== null && dto.attendanceRate < 70) {
      alerts.push({
        academicRecordId: record.id,
        alertType: "HIGH_ABSENTEEISM",
        message: `Attendance ${dto.attendanceRate}% is critically low`,
      });
    }

    if (
      dto.promotionStatus === PromotionStatus.REPEATED ||
      dto.promotionStatus === PromotionStatus.DROPPED_OUT
    ) {
      alerts.push({
        academicRecordId: record.id,
        alertType: "DROPOUT_RISK",
        message: `Child has been marked as ${dto.promotionStatus}`,
      });
    }

    if (alerts.length > 0) {
      await this.repository.saveSystemAlerts(alerts);
    }

    return { record, alertsGenerated: alerts.length };
  }

  async updateRecord(
    recordId: string,
    dto: UpdateAcademicRecordDTO,
    filePayloads: FileInputDTO[],
    actorId: string
  ) {
    const existing = await this.repository.findAcademicEntryById(recordId);
    if (!existing) throw new AppError("Academic record not found", 404);

    const updated = await this.repository.updateAcademicEntry(
      recordId,
      dto,
      filePayloads,
      actorId,
      existing.childId
    );

    // Recompute risk alerts from merged values
    const mergedAverageScore =
      dto.averageScore !== undefined ? dto.averageScore : existing.averageScore;
    const mergedAttendanceRate =
      dto.attendanceRate !== undefined ? dto.attendanceRate : existing.attendanceRate;
    const mergedPromotionStatus =
      dto.promotionStatus !== undefined ? dto.promotionStatus : existing.promotionStatus;

    await this.repository.clearUnresolvedAlertsForRecord(recordId);

    const alerts: Prisma.EducationAlertCreateManyInput[] = [];

    if (mergedAverageScore !== null && mergedAverageScore !== undefined && mergedAverageScore < 50) {
      alerts.push({
        academicRecordId: recordId,
        alertType: "LOW_GRADE",
        message: `Average score ${mergedAverageScore}% is below threshold`,
      });
    }

    if (
      mergedAttendanceRate !== null &&
      mergedAttendanceRate !== undefined &&
      mergedAttendanceRate < 70
    ) {
      alerts.push({
        academicRecordId: recordId,
        alertType: "HIGH_ABSENTEEISM",
        message: `Attendance ${mergedAttendanceRate}% is critically low`,
      });
    }

    if (
      mergedPromotionStatus === PromotionStatus.REPEATED ||
      mergedPromotionStatus === PromotionStatus.DROPPED_OUT
    ) {
      alerts.push({
        academicRecordId: recordId,
        alertType: "DROPOUT_RISK",
        message: `Child has been marked as ${mergedPromotionStatus}`,
      });
    }

    if (alerts.length > 0) {
      await this.repository.saveSystemAlerts(alerts);
    }

    return updated;
  }

  async deleteRecord(recordId: string, actorId: string) {
    const existing = await this.repository.findAcademicEntryById(recordId);
    if (!existing) throw new AppError("Academic record not found", 404);

    if (existing.files && existing.files.length > 0) {
      for (const file of existing.files) {
        this.removeFileFromDisk(file.publicId);
      }
    }

    return this.repository.deleteAcademicEntry(recordId, actorId, existing.childId, {
      schoolName: existing.schoolName,
      academicYear: existing.academicYear,
      grade: existing.grade,
    });
  }

  async deleteRecordFile(recordId: string, fileId: string) {
    const file = await this.repository.findRecordFileById(fileId);
    if (!file || file.academicRecordId !== recordId) {
      throw new AppError("File not found for this record", 404);
    }

    this.removeFileFromDisk(file.publicId);
    return this.repository.deleteRecordFile(fileId);
  }

  private removeFileFromDisk(publicId: string) {
    try {
      const filePath = path.join(process.cwd(), "uploads", "education", publicId);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Failed to remove file from disk: ${publicId}`, err);
    }
  }

  async getChildAcademicHistory(childId: string) {
    return this.repository.getAcademicHistoryByChild(childId);
  }

  async getOpenAlerts(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [alerts, total] = await this.repository.fetchPaginatedOpenAlerts(skip, limit);
    return { alerts, total };
  }

  async resolveAlert(alertId: string, resolvedById: string) {
    return this.repository.updateAlertResolution(alertId, resolvedById);
  }

  // ── Material Support ────────────────────────────────────────────────────────

  async logMaterialSupport(dto: LogMaterialSupportDTO, distributedById: string) {
    return this.repository.createMaterialSupportEntry(dto, distributedById);
  }

  async updateMaterialSupport(materialId: string, dto: UpdateMaterialSupportDTO, actorId: string) {
    const existing = await this.repository.findMaterialSupportById(materialId);
    if (!existing) throw new AppError("Material support record not found", 404);
    return this.repository.updateMaterialSupportEntry(materialId, dto, actorId, existing.childId);
  }

  async deleteMaterialSupport(materialId: string, actorId: string) {
    const existing = await this.repository.findMaterialSupportById(materialId);
    if (!existing) throw new AppError("Material support record not found", 404);
    return this.repository.deleteMaterialSupportEntry(materialId, actorId, existing.childId, {
      type: existing.type,
      quantity: existing.quantity,
    });
  }

  async getMaterialHistory(childId: string) {
    return this.repository.getMaterialHistoryByChild(childId);
  }
}