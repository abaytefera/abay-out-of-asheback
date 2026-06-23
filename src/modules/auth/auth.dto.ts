import { z } from "zod";
import { UserRole } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const verify2FASchema = z.object({
  token: z.string().length(6),
  userId: z.string().optional(), // Optional to allow settings profile verification seamlessly
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type Verify2FADto = z.infer<typeof verify2FASchema>;