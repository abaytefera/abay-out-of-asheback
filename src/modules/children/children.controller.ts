import { Response } from "express";
import { AuthRequest } from "../../types";
import { catchAsync } from "../../utils/AppError";
import { sendSuccess, sendCreated, paginationMeta } from "../../utils/response";
import childrenService from "./children.service";
import prisma from "../../config/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Already correct: fetches both ADMIN and COUNTRY_DIRECTOR.
const getDirectorIds = async (): Promise<string[]> => {
  const directors = await prisma.user.findMany({
    where:  { role: { in: ["ADMIN", "COUNTRY_DIRECTOR"] }, isActive: true },
    select: { id: true },
  });
  return directors.map((d) => d.id);
};

// Resolves a child's display name for handlers that only have a childId
const getChildName = async (childId?: string | null): Promise<string> => {
  if (!childId) return "Unknown Child";
  const child = await prisma.child.findUnique({
    where:  { id: childId },
    select: { firstName: true, lastName: true },
  });
  return child ? `${child.firstName} ${child.lastName}` : "Unknown Child";
};

const createNotifications = async (
  recipientIds: string[],
  payload: {
    type:       "DATA_CREATE" | "DATA_UPDATE" | "DATA_DELETE";
    priority:   "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    title:      string;
    message:    string;
    entityType: string;
    relatedId:  string;
  }
) => {
  if (!recipientIds.length) return;
  await prisma.notification.createMany({
    data: recipientIds.map((userId) => ({ userId, ...payload })),
  });
};

const createAuditLog = async (params: {
  userId:      string;
  childId?:    string | null;
  action:      string;
  resource:    string;
  resourceId?: string;
  ipAddress?:  string;
  userAgent?:  string;
  metadata?:   object;
}) => {
  await prisma.auditLog.create({ data: params });
};

// FIX: audit log + director notification are side effects of an already
// completed mutation. By the time this runs, the child has already been
// created/updated/deleted in the DB. Previously these were `await`ed
// sequentially with no try/catch, so a transient failure here (e.g. a
// dropped DB connection on the notification insert) propagated up through
// catchAsync and returned a 500 — making a *successful* delete/update/create
// look like it failed to the user, who could then retry a delete that
// already happened. These are now:
//   1. Run concurrently (getDirectorIds + createAuditLog don't depend on
//      each other, so there's no reason to wait on one before starting the
//      other) instead of fully sequential — cuts request latency.
//   2. Caught and logged rather than thrown — failing to notify a director
//      should never overshadow the fact that the actual operation the user
//      asked for succeeded.
// If you need stronger guarantees (e.g. guaranteed audit trail for
// compliance), swap the console.error below for a real alerting hook /
// retry queue rather than re-throwing — re-throwing reintroduces the bug.
const recordChange = async (
  auditPayload: Parameters<typeof createAuditLog>[0],
  notifPayload: Parameters<typeof createNotifications>[1]
) => {
  try {
    const [directorIds] = await Promise.all([
      getDirectorIds(),
      createAuditLog(auditPayload),
    ]);
    await createNotifications(directorIds, notifPayload);
  } catch (err) {
    console.error("[children] Failed to record audit log / director notification:", err);
  }
};

// ─── Create Child ──────────────────────────────────────────────────────────────
export const create = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User authentication context is missing or invalid.",
    });
  }

  const files          = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const childPhotos    = files?.["childPhotos"]    || [];
  const guardianPhotos = files?.["guardianPhotos"] || [];

  const child = await childrenService.create(req.body, req.user.id, {
    childPhotos,
    guardianPhotos,
  });

  await recordChange(
    {
      userId:     req.user.id,
      childId:    child.id,
      action:     "CREATE",
      resource:   `${child.firstName} ${child.lastName}`,
      resourceId: child.id,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata: {
        entityType: "Child",
        childCode: child.childCode,
        firstName: child.firstName,
        lastName:  child.lastName,
        gender:    child.gender,
        status:    child.status,
      },
    },
    {
      type:       "DATA_CREATE",
      priority:   "MEDIUM",
      title:      "New Child Profile Created",
      message:    `A new child profile was created for ${child.firstName} ${child.lastName} (${child.childCode}).`,
      entityType: "Child",
      relatedId:  child.id,
    }
  );

  sendCreated(res, child, "Child profile created successfully");
});

// ─── Find All ─────────────────────────────────────────────────────────────────
export const findAll = catchAsync(async (req: AuthRequest, res: Response) => {
  const { children, total, page, limit } = await childrenService.findAll(req.query as never);
  sendSuccess(res, children, "Children retrieved", 200, paginationMeta(total, page, limit));
});

// ─── Find One ─────────────────────────────────────────────────────────────────
export const findOne = catchAsync(async (req: AuthRequest, res: Response) => {
  const child = await childrenService.findById(req.params.id);
  sendSuccess(res, child);
});

// ─── Update Child / Household / Guardian ──────────────────────────────────────
export const update = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const child = await childrenService.update(req.params.id, req.body);

  await recordChange(
    {
      userId:     req.user.id,
      childId:    child.id,
      action:     "UPDATE",
      resource:   `${child.firstName} ${child.lastName}`,
      resourceId: child.id,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata: {
        entityType:    "Child",
        updatedFields: Object.keys(req.body),
        childCode:     child.childCode,
      },
    },
    {
      type:       "DATA_UPDATE",
      priority:   "LOW",
      title:      "Child Profile Updated",
      message:    `The profile for ${child.firstName} ${child.lastName} (${child.childCode}) has been updated.`,
      entityType: "Child",
      relatedId:  child.id,
    }
  );

  sendSuccess(res, child, "Child profile updated");
});

// ─── Delete Child ──────────────────────────────────────────────────────────────
export const remove = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const child = await childrenService.findById(req.params.id);
  const childSnapshot = {
    id:        child.id,
    childCode: child.childCode,
    firstName: child.firstName,
    lastName:  child.lastName,
    status:    child.status,
  };

  await childrenService.delete(req.params.id);

  // childId stays null here intentionally: the child row is already gone by
  // this point, so pointing a fresh AuditLog row at that id would violate
  // the FK constraint. AuditLog.childId only gets SetNull retroactively for
  // logs that existed *before* the delete — a brand-new log can't reference
  // an id that no longer exists.
  await recordChange(
    {
      userId:     req.user.id,
      childId:    null,
      action:     "DELETE",
      resource:   `${childSnapshot.firstName} ${childSnapshot.lastName}`,
      resourceId: childSnapshot.id,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata:   { entityType: "Child", ...childSnapshot },
    },
    {
      type:       "DATA_DELETE",
      priority:   "HIGH",
      title:      "Child Profile Deleted",
      message:    `The profile for ${childSnapshot.firstName} ${childSnapshot.lastName} (${childSnapshot.childCode}) has been permanently deleted.`,
      entityType: "Child",
      relatedId:  childSnapshot.id,
    }
  );

  sendSuccess(res, null, "Child profile deleted");
});

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
export const dashboardStats = catchAsync(async (_req: AuthRequest, res: Response) => {
  const stats = await childrenService.getDashboardStats();
  sendSuccess(res, stats, "Dashboard statistics");
});

// ─── Upload Profile Photo ──────────────────────────────────────────────────────
export const uploadProfilePhoto = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { type } = req.body;
  const files    = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const file     = files?.["childPhotos"]?.[0] ?? files?.["parentPhotos"]?.[0];

  if (!file) {
    return res.status(400).json({ success: false, message: "No photo file uploaded" });
  }
  if (!type || !["child", "parent"].includes(type)) {
    return res.status(400).json({ success: false, message: "type must be 'child' or 'parent'" });
  }

  const isPrimary = req.query.primary === "true";
  let photo: any;

  if (type === "child") {
    photo = await childrenService.uploadProfilePhoto(req.params.id, file, isPrimary);
  } else {
    photo = await childrenService.uploadGuardianPhoto(req.params.id, file, isPrimary);
  }

  const childName = await getChildName(req.params.id);

  await recordChange(
    {
      userId:     req.user.id,
      childId:    req.params.id,
      action:     "UPDATE",
      resource:   childName,
      resourceId: req.params.id,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata:   { entityType: "ChildPhoto", type, fileName: file.filename, isPrimary },
    },
    {
      type:       "DATA_UPDATE",
      priority:   "LOW",
      title:      "Profile Photo Uploaded",
      message:    `A ${type} profile photo was uploaded for ${childName}.`,
      entityType: "ChildPhoto",
      relatedId:  req.params.id,
    }
  );

  sendCreated(res, photo, "Profile photo uploaded successfully");
});

// ─── Delete Profile Photo ──────────────────────────────────────────────────────
export const deleteProfilePhoto = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { publicId, type } = req.body;

  if (!publicId) {
    return res.status(400).json({ success: false, message: "publicId is required" });
  }
  if (!type || !["child", "parent"].includes(type)) {
    return res.status(400).json({ success: false, message: "type must be 'child' or 'parent'" });
  }

  await childrenService.deleteProfilePhoto(req.params.id, publicId, type);

  const childName = await getChildName(req.params.id);

  await recordChange(
    {
      userId:     req.user.id,
      childId:    req.params.id,
      action:     "DELETE",
      resource:   childName,
      resourceId: req.params.id,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata:   { entityType: "ChildPhoto", type, publicId },
    },
    {
      type:       "DATA_DELETE",
      priority:   "LOW",
      title:      "Profile Photo Deleted",
      message:    `A ${type} profile photo (${publicId}) was deleted for ${childName}.`,
      entityType: "ChildPhoto",
      relatedId:  req.params.id,
    }
  );

  sendSuccess(res, null, "Photo deleted successfully");
});

// ─── Create Other Record ───────────────────────────────────────────────────────
export const createOtherRecord = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { title, description } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: "title is required" });
  }

  const files      = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const otherFiles = files?.["otherFile"] || [];

  const record = await childrenService.createOtherRecord(
    req.params.id,
    title.trim(),
    description?.trim() || "",
    otherFiles
  );

  const childName = await getChildName(req.params.id);

  await recordChange(
    {
      userId:     req.user.id,
      childId:    req.params.id,
      action:     "CREATE",
      resource:   childName,
      resourceId: record.id,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata:   { entityType: "ChildOtherRecord", title: title.trim(), fileCount: otherFiles.length },
    },
    {
      type:       "DATA_CREATE",
      priority:   "LOW",
      title:      "New Other Record Added",
      message:    `A new record titled "${title.trim()}" with ${otherFiles.length} file(s) was added to ${childName}'s profile.`,
      entityType: "ChildOtherRecord",
      relatedId:  record.id,
    }
  );

  sendCreated(res, record, "Other record created successfully");
});

// ─── Update Other Record ───────────────────────────────────────────────────────
export const updateOtherRecord = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { title, description } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: "title is required" });
  }

  const record = await childrenService.updateOtherRecord(
    req.params.recordId,
    title.trim(),
    description?.trim() || ""
  );

  const childName = await getChildName(record.childId);

  await recordChange(
    {
      userId:     req.user.id,
      childId:    record.childId,
      action:     "UPDATE",
      resource:   childName,
      resourceId: record.id,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata:   { entityType: "ChildOtherRecord", title: title.trim(), description: description?.trim() || "" },
    },
    {
      type:       "DATA_UPDATE",
      priority:   "LOW",
      title:      "Other Record Updated",
      message:    `The record titled "${title.trim()}" was updated on ${childName}'s profile.`,
      entityType: "ChildOtherRecord",
      relatedId:  record.id,
    }
  );

  sendSuccess(res, record, "Other record updated successfully");
});

// ─── Delete Other Record ───────────────────────────────────────────────────────
export const deleteOtherRecord = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Includes the child relation so we can audit by child name
  const record = await prisma.childOtherRecord.findUnique({
    where:   { id: req.params.recordId },
    include: { files: true, child: { select: { firstName: true, lastName: true } } },
  });

  await childrenService.deleteOtherRecord(req.params.recordId);

  const childName = record?.child
    ? `${record.child.firstName} ${record.child.lastName}`
    : "Unknown Child";

  await recordChange(
    {
      userId:     req.user.id,
      childId:    record?.childId ?? null,
      action:     "DELETE",
      resource:   childName,
      resourceId: req.params.recordId,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata: {
        entityType: "ChildOtherRecord",
        title:      record?.title,
        fileCount:  record?.files?.length ?? 0,
      },
    },
    {
      type:       "DATA_DELETE",
      priority:   "MEDIUM",
      title:      "Other Record Deleted",
      message:    `The record titled "${record?.title ?? "Unknown"}" and its ${record?.files?.length ?? 0} file(s) were permanently deleted from ${childName}'s profile.`,
      entityType: "ChildOtherRecord",
      relatedId:  req.params.recordId,
    }
  );

  sendSuccess(res, null, "Other record and all its files deleted");
});
export const trendStats = catchAsync(async (_req: AuthRequest, res: Response) => {
  const stats = await childrenService.getTrendStats();
  sendSuccess(res, stats, "Trend statistics");
});

// ─── Delete Single File from Other Record ─────────────────────────────────────
export const deleteOtherRecordFile = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { publicId } = req.body;

  if (!publicId) {
    return res.status(400).json({ success: false, message: "publicId is required" });
  }

  // Includes record.child so we can audit by child name
  const fileRecord = await prisma.childOtherRecordFile.findFirst({
    where:   { publicId },
    include: { record: { include: { child: { select: { firstName: true, lastName: true } } } } },
  });

  await childrenService.deleteOtherRecordFile(publicId);

  const childName = fileRecord?.record?.child
    ? `${fileRecord.record.child.firstName} ${fileRecord.record.child.lastName}`
    : "Unknown Child";

  await recordChange(
    {
      userId:     req.user.id,
      childId:    fileRecord?.record?.childId ?? null,
      action:     "DELETE",
      resource:   childName,
      resourceId: fileRecord?.id ?? publicId,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata:   { entityType: "ChildOtherRecordFile", publicId, recordTitle: fileRecord?.record?.title },
    },
    {
      type:       "DATA_DELETE",
      priority:   "LOW",
      title:      "Evidence File Deleted",
      message:    `A file was removed from the record titled "${fileRecord?.record?.title ?? "Unknown"}" on ${childName}'s profile.`,
      entityType: "ChildOtherRecordFile",
      relatedId:  fileRecord?.record?.id ?? publicId,
    }
  );

  sendSuccess(res, null, "File deleted successfully");
});

// ─── Append Files to Other Record ─────────────────────────────────────────────
export const uploadOtherRecordFiles = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const files         = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const uploadedFiles = files?.["files"] || [];

  if (uploadedFiles.length === 0) {
    return res.status(400).json({ success: false, message: "No files provided" });
  }

  const record = await childrenService.uploadOtherRecordFiles(
    req.params.id,
    req.params.recordId,
    uploadedFiles
  );

  const childName = await getChildName(req.params.id);

  await recordChange(
    {
      userId:     req.user.id,
      childId:    req.params.id,
      action:     "UPDATE",
      resource:   childName,
      resourceId: req.params.recordId,
      ipAddress:  req.ip ?? undefined,
      userAgent:  req.headers["user-agent"] ?? undefined,
      metadata:   { entityType: "ChildOtherRecord", addedFiles: uploadedFiles.length, recordId: req.params.recordId },
    },
    {
      type:       "DATA_UPDATE",
      priority:   "LOW",
      title:      "Files Added to Other Record",
      message:    `${uploadedFiles.length} file(s) were added to the record "${record.title}" on ${childName}'s profile.`,
      entityType: "ChildOtherRecord",
      relatedId:  req.params.recordId,
    }
  );

  sendSuccess(res, record, "Files added to record successfully");
});