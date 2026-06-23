import { Response } from "express";
import { HouseholdService } from "./household.service";
import { catchAsync } from "../../utils/AppError";
import { paginationMeta, sendSuccess, sendCreated } from "../../utils/response";
import { AuthRequest } from "../../types";

const service = new HouseholdService();

export const createHousehold = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.createHousehold(req.body);
  sendCreated(res, result, "Household created");
});

export const findAllHouseholds = catchAsync(async (req: AuthRequest, res: Response) => {
  const { households, total, page, limit } = await service.findAllHouseholds(req.query as any);
  sendSuccess(res, households, "Households retrieved", 200, paginationMeta(total, page, limit));
});

export const findOneHousehold = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.getHouseholdById(req.params.id);
  sendSuccess(res, result);
});

export const updateHousehold = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.updateHousehold(req.params.id, req.body);
  sendSuccess(res, result, "Household updated");
});

export const addGuardian = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.addGuardianToHousehold(req.params.id, req.body);
  sendCreated(res, result, "Guardian added");
});

export const updateGuardian = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.updateHouseholdGuardian(req.params.id, req.params.guardianId, req.body);
  sendSuccess(res, result, "Guardian updated");
});

export const deleteGuardian = catchAsync(async (req: AuthRequest, res: Response) => {
  await service.removeHouseholdGuardian(req.params.id, req.params.guardianId);
  sendSuccess(res, null, "Guardian removed");
});