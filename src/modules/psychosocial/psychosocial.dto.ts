import { z } from "zod";
import { TBRIPillar, BehavioralState } from "@prisma/client";

export const sessionSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  sessionDate: z.preprocess((val) => typeof val === "string" ? new Date(val) : val, z.date()),
  sessionType: z.string().min(1, "Session type is required"),
  behavioralConcerns: z.string().optional().nullable(),
  traumaAssessment: z.string().optional().nullable(),
  progressNotes: z.string().optional().nullable(),
  nextSessionDate: z.preprocess(
    (val) => val ? new Date(val as string) : undefined,
    z.date().optional()
  ),
});

// Partial version for PATCH — all fields optional
export const sessionUpdateSchema = sessionSchema.partial().omit({ childId: true });

export const tbriSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  activityName: z.string().min(1, "Activity name is required"),
  startDate: z.preprocess((val) => typeof val === "string" ? new Date(val) : val, z.date()),
  tbriPillar: z.nativeEnum(TBRIPillar),
  initialState: z.nativeEnum(BehavioralState),
  observations: z.string().min(1, "Initial observations are required"),
  outcomes: z.string().min(1, "Expected or recorded outcomes are required"),
});

// Partial version for PATCH — all fields optional
export const tbriUpdateSchema = tbriSchema.partial().omit({ childId: true });

export type SessionCreateInput = z.infer<typeof sessionSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
export type TbriCreateInput = z.infer<typeof tbriSchema>;
export type TbriUpdateInput = z.infer<typeof tbriUpdateSchema>;