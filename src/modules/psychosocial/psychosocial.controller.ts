import { Response } from "express";
import { PsychosocialService } from "./psychosocial.service";
import { catchAsync } from "../../utils/AppError";
import { sendSuccess, sendCreated, sendNoContent } from "../../utils/response";
import { AuthRequest } from "../../types";

const service = new PsychosocialService();

// ── Sessions ──────────────────────────────────────────────────────────────

export const createSession = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.logSession(req.body, req.user!.id);
  sendCreated(res, result, "Psychosocial session logged safely.");
});

export const getSessions = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.getSessionsHistory(req.params.childId);
  sendSuccess(res, result);
});

export const updateSession = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.editSession(req.params.id, req.body, req.user!.id);
  sendSuccess(res, result, "Session updated successfully.");
});

export const deleteSession = catchAsync(async (req: AuthRequest, res: Response) => {
  await service.removeSession(req.params.id, req.user!.id);
  sendNoContent(res);
});

// ── TBRI ──────────────────────────────────────────────────────────────────

export const createTBRI = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.logTBRIActivity(req.body, req.user!.id);
  sendCreated(res, result, "TBRI activity recorded safely.");
});

export const getTBRI = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.getTBRIHistory(req.params.childId);
  sendSuccess(res, result);
});

export const updateTBRI = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.editTBRIActivity(req.params.id, req.body, req.user!.id);
  sendSuccess(res, result, "TBRI activity updated successfully.");
});

export const deleteTBRI = catchAsync(async (req: AuthRequest, res: Response) => {
  await service.removeTBRIActivity(req.params.id, req.user!.id);
  sendNoContent(res);
});