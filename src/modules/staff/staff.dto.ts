import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

export const reviewSchema = z.object({
  userId: z.string(),
  reviewDate: z.string().datetime(),
  rating: z.number().int().min(1).max(5),
  comments: z.string().optional(),
  goals: z.string().optional(),
});

export const bgCheckSchema = z.object({
  status: z.enum(["PENDING", "CLEARED", "FLAGGED"]),
  date: z.string().datetime(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export const updatePermissionSchema = z.object({
  childRegister: z.boolean().default(false),
  childUpdate: z.boolean().default(false),
  childDelete: z.boolean().default(false),
  childView: z.boolean().default(true),
  employeeRegister: z.boolean().default(false),
  employeeUpdate: z.boolean().default(false),
  employeeDelete: z.boolean().default(false),
  employeeView: z.boolean().default(false),
});

export const forceResetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type BgCheckInput = z.infer<typeof bgCheckSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type ForceResetPasswordInput = z.infer<typeof forceResetPasswordSchema>;