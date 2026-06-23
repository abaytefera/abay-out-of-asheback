import { Response } from "express";
import { HealthService } from "./health.service";
import { catchAsync } from "../../utils/AppError";
import { sendSuccess, sendCreated } from "../../utils/response";
import { healthRecordSchema, vaccinationSchema, nutritionSchema } from "./health.dto";
import { AuthRequest } from "../../types";

const service = new HealthService();

// ── CREATE ──────────────────────────────────────────────────────

export const createHealth = catchAsync(async (req: AuthRequest, res: Response) => {
  const validatedBody = healthRecordSchema.parse(req.body);
  const files = (req.files as Express.Multer.File[]) || [];
  const result = await service.createHealthRecord(validatedBody, req.user!.id, files);
  sendCreated(res, result, "Health record created");
});

export const addVaccine = catchAsync(async (req: AuthRequest, res: Response) => {
  const validatedBody = vaccinationSchema.parse(req.body);
  const files = (req.files as Express.Multer.File[]) || [];
  const result = await service.addVaccination(validatedBody, req.user!.id, files);
  sendCreated(res, result, "Vaccination recorded");
});

export const addNutrition = catchAsync(async (req: AuthRequest, res: Response) => {
  const validatedBody = nutritionSchema.parse(req.body);
  const result = await service.addNutritionRecord(validatedBody, req.user!.id);
  sendCreated(res, result, "Nutrition record saved");
});

// ── READ ────────────────────────────────────────────────────────

export const getHealth = catchAsync(async (req: AuthRequest, res: Response) => {
  const records = await service.getHealthHistory(req.params.childId);
  sendSuccess(res, records);
});

export const getVaccines = catchAsync(async (req: AuthRequest, res: Response) => {
  const vaccinations = await service.getVaccinations(req.params.childId);
  sendSuccess(res, vaccinations);
});

export const getNutrition = catchAsync(async (req: AuthRequest, res: Response) => {
  const records = await service.getNutritionHistory(req.params.childId);
  sendSuccess(res, records);
});

// ── UPDATE ──────────────────────────────────────────────────────

export const updateHealth = catchAsync(async (req: AuthRequest, res: Response) => {
  const validatedBody = healthRecordSchema.partial().parse(req.body);
  const files = (req.files as Express.Multer.File[]) || [];
  const result = await service.updateHealthRecord(req.params.id, validatedBody, req.user!.id, files);
  sendSuccess(res, result, "Health record updated");
});

export const updateVaccine = catchAsync(async (req: AuthRequest, res: Response) => {
  const validatedBody = vaccinationSchema.partial().parse(req.body);
  const files = (req.files as Express.Multer.File[]) || [];
  const result = await service.updateVaccination(req.params.id, validatedBody, req.user!.id, files);
  sendSuccess(res, result, "Vaccination updated");
});

export const updateNutrition = catchAsync(async (req: AuthRequest, res: Response) => {
  const validatedBody = nutritionSchema.partial().parse(req.body);
  const result = await service.updateNutritionRecord(req.params.id, validatedBody, req.user!.id);
  sendSuccess(res, result, "Nutrition record updated");
});

// ── DELETE ──────────────────────────────────────────────────────

export const deleteHealth = catchAsync(async (req: AuthRequest, res: Response) => {
  await service.deleteHealthRecord(req.params.id, req.user!.id);
  sendSuccess(res, null, "Health record deleted");
});

export const deleteVaccine = catchAsync(async (req: AuthRequest, res: Response) => {
  await service.deleteVaccination(req.params.id, req.user!.id);
  sendSuccess(res, null, "Vaccination deleted");
});

export const deleteNutrition = catchAsync(async (req: AuthRequest, res: Response) => {
  await service.deleteNutritionRecord(req.params.id, req.user!.id);
  sendSuccess(res, null, "Nutrition record deleted");
});

// ── FILE DELETE ─────────────────────────────────────────────────

export const deleteFile = catchAsync(async (req: AuthRequest, res: Response) => {
  const { fileId } = req.params;
  const context = (req.query.context as string) || "health";
  await service.deleteFile(fileId, context, req.user!.id);
  sendSuccess(res, null, "File deleted");
});