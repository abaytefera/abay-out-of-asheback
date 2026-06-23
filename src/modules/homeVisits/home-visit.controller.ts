import { Response } from "express";
import { HomeVisitService } from "./home-visit.service";
import { ActorContext } from "./home-visit.repository";
import { catchAsync } from "../../utils/AppError";
import { sendSuccess, sendCreated } from "../../utils/response";
import { AuthRequest } from "../../types";

const service = new HomeVisitService();

// ── Build actor context from the authenticated request ───────────────────────
const actorFrom = (req: AuthRequest): ActorContext => ({
  id:        req.user!.id,
  role:      req.user!.role,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

// ── Shared multipart pre-parser ───────────────────────────────────────────────
const normaliseBody = (body: Record<string, unknown>) => {
  if (body.followUpDate === "" || body.followUpDate === "undefined") {
    body.followUpDate = null;
  }
  if (typeof body.isFollowUpDone === "string") {
    body.isFollowUpDone = body.isFollowUpDone === "true";
  }
};

// ── Create ────────────────────────────────────────────────────────────────────
export const createVisit = catchAsync(async (req: AuthRequest, res: Response) => {
  normaliseBody(req.body);
  const files  = (req.files as Express.Multer.File[]) || [];
  const result = await service.createVisit(req.body, actorFrom(req), files);
  sendCreated(res, result, "Home visit logged successfully");
});

// ── Edit (PATCH /:id) ─────────────────────────────────────────────────────────
export const editVisit = catchAsync(async (req: AuthRequest, res: Response) => {
  normaliseBody(req.body);
  const files  = (req.files as Express.Multer.File[]) || [];
  const result = await service.updateVisit(req.params.id, req.body, files, actorFrom(req));
  sendSuccess(res, result, "Home visit updated successfully");
});

// ── Delete single photo (DELETE /:id/photos/:photoId) ────────────────────────
export const removePhoto = catchAsync(async (req: AuthRequest, res: Response) => {
  await service.deletePhoto(req.params.id, req.params.photoId, actorFrom(req));
  sendSuccess(res, null, "Photo deleted successfully");
});

// ── Delete whole visit + all its files (DELETE /:id) ─────────────────────────
export const removeVisit = catchAsync(async (req: AuthRequest, res: Response) => {
  await service.deleteVisit(req.params.id, actorFrom(req));
  sendSuccess(res, null, "Home visit and all photos deleted successfully");
});

// ── List visits for a child ───────────────────────────────────────────────────
export const getByChild = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.getVisitsByChild(req.params.childId);
  sendSuccess(res, result);
});

// ── Dashboard metrics ─────────────────────────────────────────────────────────
export const getDashboard = catchAsync(async (_req: AuthRequest, res: Response) => {
  const result = await service.getDashboardData();
  sendSuccess(res, result, "Dashboard metrics retrieved");
});

// ── Mark follow-up complete (PATCH /:id/follow-up-done) ──────────────────────
export const completeFollowUp = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.markFollowUpAsDone(req.params.id, actorFrom(req));
  sendSuccess(res, result, "Follow-up marked as completed");
});