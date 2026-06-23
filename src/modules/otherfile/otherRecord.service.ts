import fs from "fs/promises";
import path from "path";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { AppError } from "../../utils/AppError";
import * as model from "./otherRecord.model";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "otherfile");

// ── Request context ───────────────────────────────────────────────────────────

export interface RequestContext {
  actingUserId: string;   // required — controller throws 401 before reaching service if missing
  ipAddress?: string;
  userAgent?: string;
}

// ── Local disk helpers ────────────────────────────────────────────────────────

const processLocalFile = (file: Express.Multer.File): model.FilePayload => ({
  url:      `/uploads/otherfile/${file.filename}`,
  publicId: file.filename,
});

const deleteFromDisk = async (filename: string): Promise<void> => {
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    console.warn(`[OtherRecord] Could not delete file: ${filename}. ${err.message}`);
  }
};

const getRecordOrThrow = async (recordId: string) => {
  const record = await model.findRecordById(recordId);
  if (!record) throw new AppError("Other record not found", 404);
  return record;
};

// ── Service methods ───────────────────────────────────────────────────────────

export const getRecordsByChild = (childId: string) =>
  model.findRecordsByChildId(childId);

export const getRecordById = getRecordOrThrow;

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createRecord = async (
  childId: string,
  title: string,
  description: string | undefined,
  multerFiles: Express.Multer.File[],
  ctx: RequestContext
) => {
  if (!title?.trim()) throw new AppError("Title is required", 400);

  const files: model.FilePayload[] = multerFiles.map(processLocalFile);

  const record = await model.createRecord(
    childId,
    title.trim(),
    description?.trim() ?? "",
    files
  );

  // Both writeAuditLog and sendNotifications create one row per recipient
  // (actor + every active ADMIN + every active COUNTRY_DIRECTOR)
  await Promise.all([
    model.writeAuditLog({
      actingUserId: ctx.actingUserId,
      childId:      record.childId,
      action:       "CREATE",
      resourceId:   record.id,
      ipAddress:    ctx.ipAddress,
      userAgent:    ctx.userAgent,
      metadata: {
        title:         record.title,
        filesAttached: files.length,
      },
    }),
    model.sendNotifications({
      actingUserId: ctx.actingUserId,
      type:         NotificationType.DATA_CREATE,
      priority:     NotificationPriority.MEDIUM,
      title:        "Other Record Created",
      message:      `A new other record "${record.title}" was created for child ${childId}.`,
      relatedId:    record.id,
    }),
  ]);

  return record;
};

// ── UPDATE ────────────────────────────────────────────────────────────────────

export const updateRecord = async (
  recordId: string,
  { title, description }: { title?: string; description?: string },
  ctx: RequestContext
) => {
  if (title === undefined && description === undefined)
    throw new AppError("Provide title or description to update", 400);
  if (title !== undefined && !title.trim())
    throw new AppError("Title cannot be empty", 400);

  const before = await getRecordOrThrow(recordId);

  const record = await model.updateRecord(recordId, {
    title:       title       !== undefined ? title.trim()       : undefined,
    description: description !== undefined ? description.trim() : undefined,
  });

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (title !== undefined && before.title !== record.title)
    changes.title = { from: before.title, to: record.title };
  if (description !== undefined && before.description !== record.description)
    changes.description = { from: before.description, to: record.description };

  await Promise.all([
    model.writeAuditLog({
      actingUserId: ctx.actingUserId,
      childId:      record.childId,
      action:       "UPDATE",
      resourceId:   record.id,
      ipAddress:    ctx.ipAddress,
      userAgent:    ctx.userAgent,
      metadata:     { changes },
    }),
    model.sendNotifications({
      actingUserId: ctx.actingUserId,
      type:         NotificationType.DATA_UPDATE,
      priority:     NotificationPriority.MEDIUM,
      title:        "Other Record Updated",
      message:      `Other record "${record.title}" (child ${record.childId}) was updated.`,
      relatedId:    record.id,
    }),
  ]);

  return record;
};

// ── APPEND FILES ──────────────────────────────────────────────────────────────

export const appendFilesToRecord = async (
  childId: string,
  recordId: string,
  multerFiles: Express.Multer.File[],
  ctx: RequestContext
) => {
  if (!multerFiles.length) throw new AppError("No files provided", 400);

  const record = await getRecordOrThrow(recordId);
  if (record.childId !== childId) throw new AppError("Record does not belong to this child", 403);

  const files: model.FilePayload[] = multerFiles.map(processLocalFile);
  await model.appendFiles(recordId, files);

  await Promise.all([
    model.writeAuditLog({
      actingUserId: ctx.actingUserId,
      childId,
      action:       "ADD_FILES",
      resourceId:   recordId,
      ipAddress:    ctx.ipAddress,
      userAgent:    ctx.userAgent,
      metadata:     { filesAdded: files.length },
    }),
    model.sendNotifications({
      actingUserId: ctx.actingUserId,
      type:         NotificationType.DATA_UPDATE,
      priority:     NotificationPriority.LOW,
      title:        "Files Added to Other Record",
      message:      `${files.length} file(s) were added to other record "${record.title}" (child ${childId}).`,
      relatedId:    recordId,
    }),
  ]);

  return model.findRecordById(recordId);
};

// ── DELETE FILE ───────────────────────────────────────────────────────────────

export const deleteFile = async (
  childId: string,
  recordId: string,
  filename: string,
  ctx: RequestContext
) => {
  if (!filename) throw new AppError("Filename identifier is required", 400);

  const fileRow = await model.findRecordByFilePublicId(filename);
  if (!fileRow)                           throw new AppError("File not found", 404);
  if (fileRow.record.id !== recordId)     throw new AppError("File does not belong to this record", 403);
  if (fileRow.record.childId !== childId) throw new AppError("Record does not belong to this child", 403);

  await deleteFromDisk(filename);
  await model.deleteFileByPublicId(filename);

  await Promise.all([
    model.writeAuditLog({
      actingUserId: ctx.actingUserId,
      childId,
      action:       "DELETE_FILE",
      resourceId:   recordId,
      ipAddress:    ctx.ipAddress,
      userAgent:    ctx.userAgent,
      metadata:     { deletedFile: filename },
    }),
    model.sendNotifications({
      actingUserId: ctx.actingUserId,
      type:         NotificationType.DATA_DELETE,
      priority:     NotificationPriority.LOW,
      title:        "File Removed from Other Record",
      message:      `A file was removed from other record (id: ${recordId}) for child ${childId}.`,
      relatedId:    recordId,
    }),
  ]);
};

// ── DELETE RECORD ─────────────────────────────────────────────────────────────

export const deleteRecord = async (
  childId: string,
  recordId: string,
  ctx: RequestContext
) => {
  const record = await getRecordOrThrow(recordId);
  if (record.childId !== childId) throw new AppError("Record does not belong to this child", 403);

  if (record.files?.length) {
    await Promise.all(record.files.map((f) => deleteFromDisk(f.publicId)));
  }

  // Audit log written BEFORE delete so the resourceId still exists
  await model.writeAuditLog({
    actingUserId: ctx.actingUserId,
    childId,
    action:       "DELETE",
    resourceId:   record.id,
    ipAddress:    ctx.ipAddress,
    userAgent:    ctx.userAgent,
    metadata: {
      title:        record.title,
      filesDeleted: record.files.length,
    },
  });

  await model.deleteRecord(recordId);

  await model.sendNotifications({
    actingUserId: ctx.actingUserId,
    type:         NotificationType.DATA_DELETE,
    priority:     NotificationPriority.HIGH,
    title:        "Other Record Deleted",
    message:      `Other record "${record.title}" (child ${childId}) and its ${record.files.length} file(s) were permanently deleted.`,
    relatedId:    record.id,
  });
};