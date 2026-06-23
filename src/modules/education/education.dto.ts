import { z } from "zod";
import { PromotionStatus, SupportMaterialType } from "@prisma/client";

export const academicRecordSchema = z.object({
  childId: z.string(),
  schoolName: z.string(),
  academicYear: z.string(),
  semester: z.string().optional(),
  grade: z.string(),
  rank: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(1).optional()
  ),
  averageScore: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().optional()
  ),
  attendanceRate: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(0).max(100).optional()
  ),
  nationalExamScore: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().optional()
  ),
  promotionStatus: z.nativeEnum(PromotionStatus).optional(),
  teacherNotes: z.string().optional(),
});

export const updateAcademicRecordSchema = z.object({
  schoolName: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.string().optional().nullable(),
  grade: z.string().optional(),
  rank: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(1).optional().nullable()
  ),
  averageScore: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional().nullable()
  ),
  attendanceRate: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().min(0).max(100).optional().nullable()
  ),
  nationalExamScore: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional().nullable()
  ),
  promotionStatus: z.nativeEnum(PromotionStatus).optional(),
  teacherNotes: z.string().optional().nullable(),
});

export const materialSupportSchema = z.object({
  childId: z.string(),
  type: z.nativeEnum(SupportMaterialType),
  description: z.string().optional(),
  quantity: z.number().int().optional(),
  distributeDate: z.string().datetime(),
  academicYear: z.string().optional(),
});

export const updateMaterialSupportSchema = z.object({
  type: z.nativeEnum(SupportMaterialType).optional(),
  description: z.string().optional().nullable(),
  quantity: z.number().int().optional().nullable(),
  distributeDate: z.string().datetime().optional(),
  academicYear: z.string().optional().nullable(),
});

export type CreateAcademicRecordDTO = z.infer<typeof academicRecordSchema>;
export type UpdateAcademicRecordDTO = z.infer<typeof updateAcademicRecordSchema>;
export type LogMaterialSupportDTO = z.infer<typeof materialSupportSchema>;
export type UpdateMaterialSupportDTO = z.infer<typeof updateMaterialSupportSchema>;

export interface FileInputDTO {
  url: string;
  publicId: string;
  fileName: string;
}