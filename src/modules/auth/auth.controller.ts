import { Response } from "express";
import { AuthRequest } from "../../types";
import { catchAsync, AppError } from "../../utils/AppError"; // 💡 Added AppError import
import { sendSuccess, sendCreated } from "../../utils/response";
import { AuthService } from "./auth.service";

const service = new AuthService();

export const register = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await service.register(req.body);
  sendCreated(res, user, "User registered successfully");
});

export const login = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.login(req.body);
  sendSuccess(res, result, "Login successful");
});

export const refresh = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await service.refresh(req.body.refreshToken);
  sendSuccess(res, result, "Token refreshed");
});

export const setup2FA = catchAsync(async (req: AuthRequest, res: Response) => {
  // 💡 This endpoint requires an active session, so req.user will be populated here
  const result = await service.setup2FA(req.user!.id);
  sendSuccess(res, result, "Scan the QR code with your authenticator app");
});

// 🛠️ FIXED: Rewritten to safely handle both public login verifications and settings page changes
export const verify2FA = catchAsync(async (req: AuthRequest, res: Response) => {
  const { token, userId } = req.body;

  // 🍏 FIX: Check req.body first (for login phase). Use optional chaining (?.) for session checks to prevent crashes.
  const targetUserId = userId || req.user?.id;

  if (!targetUserId) {
    throw new AppError("Verification failed: Missing user identity context context parameters.", 400);
  }

  const result = await service.verify2FA(targetUserId, token);
  sendSuccess(res, result, "2FA verified successfully");
});

export const disable2FA = catchAsync(async (req: AuthRequest, res: Response) => {
  // 💡 Since this runs behind the authenticate middleware guard, req.user!.id is safe here
  const targetId = req.user!.id;
  const result = await service.disable2FA(targetId, req.body.token);
  sendSuccess(res, result, "Two-factor protection removed successfully");
});

export const me = catchAsync(async (req: AuthRequest, res: Response) => {
    
  const user = await service.me(req.user!.id);
  sendSuccess(res, user);
});