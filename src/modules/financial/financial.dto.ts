import { z } from "zod";
import { FinancialSupportType } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "../../utils/AppError";

const uploadDir = path.join(process.cwd(), "uploads", "financial");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `financial-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new AppError("Only images (JPEG/PNG), PDFs, and Word documents are allowed!", 400));
  },
});

// ── Shared amount coercion (reused in both schemas) ───────────────────────────
const coerceAmount = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  const parsed = Number(val);
  return isNaN(parsed) ? val : parsed;
}, z.number().positive("Amount must be a positive number"));

// ── Shared date coercion ──────────────────────────────────────────────────────
const coerceDate = z.preprocess((val) => {
  if (typeof val === "string" && val.length > 0) return new Date(val);
  return val;
}, z.date());

// ── Create schema ─────────────────────────────────────────────────────────────
export const disbursementSchema = z.object({
  childId:      z.string().min(1, "Child ID is required"),
  supportType:  z.nativeEnum(FinancialSupportType),
  amount:       coerceAmount,
  currency:     z.string().default("ETB"),
  disbursedDate: coerceDate.refine((d) => d instanceof Date, {
    message: "Disbursed date is required",
  }),
  academicYear: z.string().optional().nullable(),
  notes:        z.string().optional().nullable(),
});

// ── Update schema (all fields optional) ──────────────────────────────────────
export const updateDisbursementSchema = z.object({
  supportType:  z.nativeEnum(FinancialSupportType).optional(),
  amount:       z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    const parsed = Number(val);
    return isNaN(parsed) ? val : parsed;
  }, z.number().positive("Amount must be positive").optional()).optional(),
  currency:     z.string().optional(),
  disbursedDate: z.preprocess((val) => {
    if (typeof val === "string" && val.length > 0) return new Date(val);
    return val;
  }, z.date().optional()).optional(),
  academicYear: z.string().optional().nullable(),
  notes:        z.string().optional().nullable(),
  // childId is sent by the frontend for RTK cache invalidation only — ignore it on the backend
  childId:      z.string().optional(),
});

export type DisbursementInput       = z.infer<typeof disbursementSchema>;
export type UpdateDisbursementInput = z.infer<typeof updateDisbursementSchema>;