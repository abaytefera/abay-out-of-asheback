import { Response } from "express";
import { StaffService } from "./staff.service";
import { catchAsync } from "../../utils/AppError";
import { paginationMeta, sendSuccess } from "../../utils/response";
import { AuthRequest } from "../../types";
import { AppError } from "../../utils/AppError";

const service = new StaffService();

export const updateUserProfileImage = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.body.id; // Received from formData.append("id", id)
  const file = req.file;

  if (!userId) {
    throw new AppError("User ID is required to update profile image", 400);
  }
  if (!file) {
    throw new AppError("No file upload payload detected under field 'profile'", 400);
  }

  const updatedStaff = await service.updateProfileImage(userId, file);
  sendSuccess(res, updatedStaff, "Profile picture updated successfully!", 200);
});

export const deactivateEmployee = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  sendSuccess(res, await service.toggleActive(id, req.user!.id), "Account status updated");
});

export const getAllStaff = catchAsync(async (req: AuthRequest, res: Response) => {
  const { staff, total, page, limit } = await service.findAll(req.query as any);
  sendSuccess(res, staff, "Staff retrieved", 200, paginationMeta(total, page, limit));
});

export const getStaffById = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req?.query?.id as string;
  sendSuccess(res, await service.findById(id));
});

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  sendSuccess(res, await service.updateProfile(req.params.id, req.body));
});

export const changePassword = catchAsync(async (req: AuthRequest, res: Response) => {
  sendSuccess(res, await service.changePassword(req.user!.id, req.body));
});

export const forceResetPassword = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.query.id as string;
  sendSuccess(res, await service.forceResetPassword(id, req.body, req.user!.id));
});

export const deleteEmployee = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.query.id as string;
  sendSuccess(res, await service.deleteEmployee(id, req.user!.id));
});

export const getOwnPermissions = catchAsync(async (req: AuthRequest, res: Response) => {
  sendSuccess(res, await service.findPermissionsByUserId(req.user!.id));
});

export const getStaffPermissions = catchAsync(async (req: AuthRequest, res: Response) => {
  sendSuccess(res, await service.findPermissionsByUserId(req.params.id));
});

export const updateStaffPermissions = catchAsync(async (req: AuthRequest, res: Response) => {
  sendSuccess(res, await service.updatePermissionsByUserId(req.params.id, req.body));
});