import { z } from "zod";
import { VisitPurpose } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join("uploads", "homevisits");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });

export const createVisitSchema = z.object({
  childId:        z.string().min(1, "Child ID is required"),
  visitDate:      z.string(),
  purpose:        z.nativeEnum(VisitPurpose),
  observations:   z.string().optional().default(""),
  familyNeeds:    z.string().optional().default(""),
  actionItems:    z.string().optional().default(""),
  followUpDate:   z.string().optional().nullable(),
  isFollowUpDone: z
    .preprocess((v) => v === true || v === "true", z.boolean())
    .optional()
    .default(false),
});

export const updateVisitSchema = z.object({
  visitDate:      z.string().optional(),
  purpose:        z.nativeEnum(VisitPurpose).optional(),
  observations:   z.string().optional(),
  familyNeeds:    z.string().optional(),
  actionItems:    z.string().optional(),
  followUpDate:   z.string().optional().nullable(),
  isFollowUpDone: z
    .preprocess((v) => v === true || v === "true", z.boolean())
    .optional(),
});

export type HomeVisitInput       = z.infer<typeof createVisitSchema>;
export type HomeVisitUpdateInput = z.infer<typeof updateVisitSchema>;