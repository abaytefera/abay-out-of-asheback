import { Response } from "express";
import { SafeguardingService } from "./safeguarding.service";
import { catchAsync } from "../../utils/AppError";
import { paginationMeta, sendSuccess, sendCreated, sendNoContent } from "../../utils/response";
import { AuthRequest } from "../../types";
 
const service = new SafeguardingService();
 
export const createCase = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.createCase(req.body, req.user!.id);
  sendCreated(res, result, "Safeguarding case created successfully");
});
 
export const findAllCases = catchAsync(async (req: AuthRequest, res: Response) => {
  const { cases, total, page, limit } = await service.findAllCases(req.query as any, req.user!.id, req.user!.role);
  sendSuccess(res, cases, "Cases retrieved successfully", 200, paginationMeta(total, page, limit));
});
 
export const findOneCase = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.getCaseById(req.params.id, req.user!.id, req.user!.role);
  sendSuccess(res, result);
});
 
export const updateCase = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.updateCase(req.params.id, req.body, req.user!.id, req.user!.role);
  sendSuccess(res, result, "Case updated successfully");
});
 
export const closeCase = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.closeCase(req.params.id, req.user!.id, req.user!.role);
  sendSuccess(res, result, "Case closed successfully");
});
 
export const deleteCase = catchAsync(async (req: AuthRequest, res: Response) => {
  await service.deleteCase(req.params.id, req.user!.id, req.user!.role);
  sendNoContent(res);
});
 
export const grantAccess = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.grantAccess(req.params.id, req.body.userId, req.user!.id, req.user!.role);
  sendSuccess(res, result, "Access granted successfully");
});
 
// NEW ↓
export const revokeAccess = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.revokeAccess(req.params.id, req.body.userId, req.user!.id, req.user!.role);
  sendSuccess(res, result, "Access revoked successfully");
});
 