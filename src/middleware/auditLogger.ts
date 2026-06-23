import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import prisma from "../config/prisma";
import logger from "../config/logger";

const MUTATION_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export const auditLogger = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!MUTATION_METHODS.includes(req.method) || !req.user) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = (body: unknown) => {
    // Fire-and-forget audit log — do not block the response
    const segments = req.path.split("/").filter(Boolean);
    const resource = segments[1] ?? segments[0] ?? "unknown";
    const resourceId = segments[2] ?? undefined;

    prisma.auditLog
      .create({
        data: {
          userId: req.user!.id,
          action: req.method,
          resource,
          resourceId,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          metadata: { path: req.path, body: req.body },
        },
      })
      .catch((e: Error) => logger.error("Audit log failed", { error: e.message }));

    return originalJson(body);
  };

  next();
};
