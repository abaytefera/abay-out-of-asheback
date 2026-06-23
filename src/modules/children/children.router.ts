import { Router } from "express";
import * as ctrl from "./children.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize, authorizeMinRole } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createChildSchema, updateChildSchema } from "./children.schema";
import { UserRole } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

// ─── Storage Directory Setup ──────────────────────────────────────────────────

const PROFILE_DIR      = path.join(process.cwd(), "uploads", "profiles");
const OTHER_RECORD_DIR = path.join(process.cwd(), "uploads", "other-records");

[PROFILE_DIR, OTHER_RECORD_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Multer Storage Factory ───────────────────────────────────────────────────

const makeStorage = (destinationPath: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destinationPath),
    filename: (_req, file, cb) => {
      const ext          = path.extname(file.originalname);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });

// ─── File Filter (images + documents only) ───────────────────────────────────

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const profileUpload = multer({ storage: makeStorage(PROFILE_DIR), fileFilter });
const otherUpload   = multer({ storage: makeStorage(OTHER_RECORD_DIR), fileFilter });

// ─── Multipart Body Pre-Parser ────────────────────────────────────────────────
// Unwraps JSON stringified as req.body.Data (kept for backward compat)
const parseMultipartData = (req: any, _res: any, next: any) => {
  if (req.body && typeof req.body.Data === "string") {
    try { req.body = JSON.parse(req.body.Data); } catch { /* fall through to Zod */ }
  }
  next();
};

// ─── Router ───────────────────────────────────────────────────────────────────

const childrenRouter = Router();
childrenRouter.use(authenticate);

// ── Dashboard ────────────────────────────────────────────────────────────────
childrenRouter.get(
  "/dashboard",
 
  ctrl.dashboardStats
);
childrenRouter.get("/trend", ctrl.trendStats);
// ── Static sub-resource routes MUST come before /:id to avoid param conflicts ─

// Other-record: update title/description
childrenRouter.patch(
  "/other-records/:recordId",
  authorizeMinRole(UserRole.SOCIAL_WORKER),
  ctrl.updateOtherRecord
);

// Other-record: delete entire record
childrenRouter.delete(
  "/other-records/:recordId",
  authorize(UserRole.COUNTRY_DIRECTOR, UserRole.ADMIN),
  ctrl.deleteOtherRecord
);

// Other-record: delete a single file inside a record
// ✅ FIX: changed from DELETE to POST to avoid body issues on some clients,
//         kept DELETE and body: { publicId } as documented in controller
childrenRouter.delete(
  "/other-records/:recordId/files",
  authorizeMinRole(UserRole.SOCIAL_WORKER),
  ctrl.deleteOtherRecordFile
);

// ── List & Create ────────────────────────────────────────────────────────────
// GET /api/v1/children?search=abel&page=1&limit=10&status=ACTIVE
childrenRouter.get("/", ctrl.findAll);

childrenRouter.post(
  "/",
  authorizeMinRole(UserRole.SOCIAL_WORKER),
  profileUpload.fields([
    { name: "childPhotos",    maxCount: 5 },
    { name: "guardianPhotos", maxCount: 5 },
  ]),
  parseMultipartData,
  validate(createChildSchema),
  ctrl.create
);

// ── Single child ─────────────────────────────────────────────────────────────
childrenRouter.get("/:id", ctrl.findOne);

// PATCH /:id handles child fields, household fields, and guardian fields
// Body shape (any combination): { child?: {...}, household?: {...}, guardian?: {...} }
childrenRouter.patch(
  "/:id",
  authorizeMinRole(UserRole.SOCIAL_WORKER),
  parseMultipartData,
  validate(updateChildSchema),
  ctrl.update
);

childrenRouter.delete(
  "/:id",
  authorize(UserRole.COUNTRY_DIRECTOR, UserRole.ADMIN),
  ctrl.remove
);

// ── Profile photos ───────────────────────────────────────────────────────────

// POST /:id/profile-photo   multipart: "childPhotos" | "parentPhotos"  ?primary=true
childrenRouter.post(
  "/:id/profile-photo",
  authorizeMinRole(UserRole.SOCIAL_WORKER),
  profileUpload.fields([
    { name: "childPhotos",  maxCount: 1 },
    { name: "parentPhotos", maxCount: 1 },
  ]),
  ctrl.uploadProfilePhoto
);

// DELETE /:id/profile-photo   body: { publicId, type }
childrenRouter.delete(
  "/:id/profile-photo",
  authorizeMinRole(UserRole.SOCIAL_WORKER),
  ctrl.deleteProfilePhoto
);

// ── Other records ────────────────────────────────────────────────────────────

// POST /:id/other-records   multipart: { title, description } + field "otherFile"
childrenRouter.post(
  "/:id/other-records",
  authorizeMinRole(UserRole.SOCIAL_WORKER),
  otherUpload.fields([{ name: "otherFile", maxCount: 999 }]),
  ctrl.createOtherRecord
);

// POST /:id/other-records/:recordId/files   multipart: field "files"
childrenRouter.post(
  "/:id/other-records/:recordId/files",
  authorizeMinRole(UserRole.SOCIAL_WORKER),
  otherUpload.fields([{ name: "files", maxCount: 999 }]),
  ctrl.uploadOtherRecordFiles
);

export default childrenRouter;