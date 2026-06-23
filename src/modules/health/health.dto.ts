import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const healthUploadDir = path.join(process.cwd(), "uploads", "health");
const vaccineUploadDir = path.join(process.cwd(), "uploads", "vaccine");

if (!fs.existsSync(healthUploadDir)) fs.mkdirSync(healthUploadDir, { recursive: true });
if (!fs.existsSync(vaccineUploadDir)) fs.mkdirSync(vaccineUploadDir, { recursive: true });

const generateUniqueFilename = (file: Express.Multer.File) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const extension = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, extension).replace(/\s+/g, "_");
  return `${baseName}-${uniqueSuffix}${extension}`;
};

export const uploadHealthFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, healthUploadDir),
    filename: (req, file, cb) => cb(null, generateUniqueFilename(file)),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadVaccineFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, vaccineUploadDir),
    filename: (req, file, cb) => cb(null, generateUniqueFilename(file)),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Zod Ingestion Assertions
export const healthRecordSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  recordDate: z.string().datetime("Invalid date structure"),
  knownDisabilities: z.string().optional(),
  hospitalVisitReason: z.string().optional(),
  hospitalName: z.string().optional(),
  notes: z.string().optional(),
});

export const vaccinationSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  vaccineName: z.string().min(1, "Vaccine name is required"),
  dateGiven: z.string().datetime("Invalid date structure"),
  nextDueDate: z.string().datetime().optional().or(z.literal("")),
  administeredBy: z.string().optional(),
  notes: z.string().optional(),
});

export const nutritionSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  recordDate: z.string().datetime("Invalid date structure"),
  heightCm: z.preprocess((val) => Number(val), z.number().positive()).optional(),
  weightKg: z.preprocess((val) => Number(val), z.number().positive()).optional(),
  notes: z.string().optional(),
});

export type HealthRecordInput = z.infer<typeof healthRecordSchema>;
export type VaccinationInput = z.infer<typeof vaccinationSchema>;
export type NutritionInput = z.infer<typeof nutritionSchema>;