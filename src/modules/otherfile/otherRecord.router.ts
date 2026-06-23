import { Router, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import * as controller from "./otherRecord.controller";
import { authenticate } from "../../middleware/authenticate";
 import { authorize } from "../../middleware/authorize";
const otherFilerouter = Router();

// ── Ensure Local Directory Exists ────────────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "otherfile");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Multer — Local Disk Storage Configuration ────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const ALLOWED = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "application/pdf",
      "video/mp4", "video/quicktime", "video/x-msvideo",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});
otherFilerouter.use(authenticate);
// ── Child-scoped routes (:id = childId) ─────────────────────────────────────

// GET    /api/v1/children/:id/other-records
otherFilerouter.get(
  "/:id/other-records",
  controller.getRecords
);

// POST   /api/v1/children/:id/other-records
otherFilerouter.post(
  "/:id/other-records",
  upload.array("otherFile", 20),
  controller.createRecord
);

// POST   /api/v1/children/:id/other-records/:recordId/files
otherFilerouter.post(
  "/:id/other-records/:recordId/files",
  upload.array("files", 20),
  controller.appendFiles
);

// ── Record-scoped routes (:recordId = ChildOtherRecord.id) ──────────────────

// GET    /api/v1/children/other-records/:recordId
otherFilerouter.get(
  "/other-records/:recordId",
  controller.getRecord
);

// PATCH  /api/v1/children/other-records/:recordId
otherFilerouter.patch(
  "/other-records/:recordId",
  controller.updateRecord
);

// DELETE /api/v1/children/other-records/:recordId
otherFilerouter.delete(
  "/other-records/:recordId",
  authorize("ADMIN"),
  controller.deleteRecord
);

// DELETE /api/v1/children/other-records/:recordId/files
otherFilerouter.delete(
  "/other-records/:recordId/files",
  authorize("ADMIN"),
  controller.deleteFile
);

export default otherFilerouter;