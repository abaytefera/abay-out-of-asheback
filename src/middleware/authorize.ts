import { Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AuthRequest } from "../types";
import { sendForbidden } from "../utils/response";

// Role hierarchy — higher index = more access
const ROLE_HIERARCHY: UserRole[] = [
  UserRole.SOCIAL_WORKER,
  UserRole.EDUCATION_OFFICER,
  UserRole.FINANCE_OFFICER,
  UserRole.PROGRAM_MANAGER,
  UserRole.COUNTRY_DIRECTOR,
  UserRole.ADMIN,
];

/**
 * Restrict access to specific roles only.
 * Usage: authorize(UserRole.PROGRAM_MANAGER, UserRole.COUNTRY_DIRECTOR)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendForbidden(res, "Not authenticated");
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      sendForbidden(res, "Insufficient permissions for this resource");
      return;
    }
    next();
  };
};

/**
 * Restrict to roles at or above the minimum role in the hierarchy.
 * Usage: authorizeMinRole(UserRole.PROGRAM_MANAGER) — allows PM and CD
 */
export const authorizeMinRole = (minRole: UserRole) => {
  const minIndex = ROLE_HIERARCHY.indexOf(minRole);
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendForbidden(res, "Not authenticated");
      return;
    }
    const userIndex = ROLE_HIERARCHY.indexOf(req.user.role);
    if (userIndex < minIndex) {
      sendForbidden(res, "Insufficient permissions");
      return;
    }
    next();
  };
};
