import { Response } from "express";
import { EducationService } from "./education.service";
import { catchAsync } from "../../utils/AppError";
import { sendSuccess, sendCreated, paginationMeta } from "../../utils/response";
import { AuthRequest } from "../../types";
import { FileInputDTO } from "./education.dto";

export class EducationController {
  private service: EducationService;

  constructor() {
    this.service = new EducationService();
  }

  // ── Academic Records ────────────────────────────────────────────────────────

  createRecord = catchAsync(async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];

    const filePayloads: FileInputDTO[] = files.map((file) => ({
      url: `/uploads/education/${file.filename}`,
      publicId: file.filename,
      fileName: file.originalname,
    }));

    const result = await this.service.createRecord(req.body, filePayloads, req.user!.id);
    sendCreated(res, result, "Academic record created successfully");
  });

  updateRecord = catchAsync(async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];

    const filePayloads: FileInputDTO[] = files.map((file) => ({
      url: `/uploads/education/${file.filename}`,
      publicId: file.filename,
      fileName: file.originalname,
    }));

    const result = await this.service.updateRecord(
      req.params.recordId,
      req.body,
      filePayloads,
      req.user!.id
    );
    sendSuccess(res, result, "Academic record updated successfully");
  });

  deleteRecord = catchAsync(async (req: AuthRequest, res: Response) => {
    await this.service.deleteRecord(req.params.recordId, req.user!.id);
    sendSuccess(res, null, "Academic record deleted successfully");
  });

  deleteRecordFile = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.service.deleteRecordFile(
      req.params.recordId,
      req.params.fileId
    );
    sendSuccess(res, result, "File removed successfully");
  });

  getHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.service.getChildAcademicHistory(req.params.childId);
    sendSuccess(res, result);
  });

  // ── Alerts ──────────────────────────────────────────────────────────────────

  getAlerts = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "20", 10);

    const { alerts, total } = await this.service.getOpenAlerts(page, limit);
    sendSuccess(res, alerts, "Open alerts retrieved", 200, paginationMeta(total, page, limit));
  });

  resolveAlert = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.service.resolveAlert(req.params.alertId, req.user!.id);
    sendSuccess(res, result, "Alert resolved");
  });

  // ── Material Support ────────────────────────────────────────────────────────

  logMaterial = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.service.logMaterialSupport(req.body, req.user!.id);
    sendCreated(res, result, "Material support logged");
  });

  updateMaterial = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.service.updateMaterialSupport(
      req.params.materialId,
      req.body,
      req.user!.id
    );
    sendSuccess(res, result, "Material support updated");
  });

  deleteMaterial = catchAsync(async (req: AuthRequest, res: Response) => {
    await this.service.deleteMaterialSupport(req.params.materialId, req.user!.id);
    sendSuccess(res, null, "Material support deleted");
  });

  getMaterials = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.service.getMaterialHistory(req.params.childId);
    sendSuccess(res, result);
  });
}