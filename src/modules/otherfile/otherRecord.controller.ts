import { Request, Response, NextFunction } from "express";
import * as service from "./otherRecord.service";
import { RequestContext } from "./otherRecord.service";

/**
 * Reads the authenticated user's ID from the request.
 *
 * Checks all common auth middleware shapes in order:
 *   req.user.id       — Passport.js, most JWT middleware
 *   req.user.userId   — custom JWT middleware
 *   req.user.sub      — JWT standard claim
 *
 * Returns null if none found (controller will reject with 401).
 */
const getActingUserId = (req: Request): string | null =>
  (req as any).user?.id     ??
  (req as any).user?.userId ??
  (req as any).user?.sub    ??
  null;

/**
 * Builds RequestContext and throws 401 if actingUserId cannot be resolved.
 * This guarantees the service and model always receive a valid string, never null.
 */
const getContext = (req: Request, res: Response): RequestContext | null => {
  const actingUserId = getActingUserId(req);

  if (!actingUserId) {
    res.status(401).json({
      status:  "error",
      message: "Unauthorized: could not resolve acting user from request. Check auth middleware.",
    });
    return null;
  }

  return {
    actingUserId,
    ipAddress:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      undefined,
    userAgent: req.headers["user-agent"] ?? undefined,
  };
};

// ── GET /api/v1/children/:id/other-records ────────────────────────────────────
export const getRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await service.getRecordsByChild(req.params.id);
    res.status(200).json({ status: "success", results: records.length, data: records });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/children/other-records/:recordId ──────────────────────────────
export const getRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await service.getRecordById(req.params.recordId);
    res.status(200).json({ status: "success", data: record });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/children/:id/other-records ───────────────────────────────────
export const createRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ctx = getContext(req, res);
    if (!ctx) return; // 401 already sent

    const { title, description } = req.body;
    const multerFiles = (req.files as Express.Multer.File[]) || [];

    const record = await service.createRecord(
      req.params.id,
      title,
      description,
      multerFiles,
      ctx
    );

    res.status(201).json({ status: "success", message: "Other record created successfully", data: record });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/v1/children/other-records/:recordId ────────────────────────────
export const updateRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ctx = getContext(req, res);
    if (!ctx) return;

    const { title, description } = req.body;

    const record = await service.updateRecord(
      req.params.recordId,
      { title, description },
      ctx
    );

    res.status(200).json({ status: "success", message: "Other record updated successfully", data: record });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/children/:id/other-records/:recordId/files ──────────────────
export const appendFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ctx = getContext(req, res);
    if (!ctx) return;

    const { id: childId, recordId } = req.params;
    const multerFiles = (req.files as Express.Multer.File[]) || [];

    const record = await service.appendFilesToRecord(
      childId,
      recordId,
      multerFiles,
      ctx
    );

    res.status(200).json({ status: "success", message: "Files added successfully", data: record });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/v1/children/other-records/:recordId/files ────────────────────
export const deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ctx = getContext(req, res);
    if (!ctx) return;

    const { recordId } = req.params;
    const { publicId, childId } = req.body;

    await service.deleteFile(childId, recordId, publicId, ctx);

    res.status(200).json({ status: "success", message: "File deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/v1/children/other-records/:recordId ──────────────────────────
export const deleteRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ctx = getContext(req, res);
    if (!ctx) return;

    const { recordId } = req.params;
    const { childId } = req.body;

    await service.deleteRecord(childId, recordId, ctx);

    res.status(200).json({ status: "success", message: "Other record deleted successfully" });
  } catch (error) {
    next(error);
  }
};