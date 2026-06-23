import { z } from "zod";
import { IncidentType, UserRole } from "@prisma/client";

export const SAFEGUARDING_ROLES: UserRole[] = [
  UserRole.PROGRAM_MANAGER,
  UserRole.COUNTRY_DIRECTOR,
  UserRole.ADMIN,
];

export const createCaseSchema = z.object({
  childId:          z.string().min(1, "Child ID is required"),
  incidentDate:     z.string().datetime("Invalid ISO datetime structure"),
  incidentType:     z.nativeEnum(IncidentType),
  description:      z.string().min(10, "Description must be at least 10 characters long"),
  actionPlan:       z.string().optional(),
  externalReferral: z.string().optional(),
});

/**
 * Unified PATCH schema — covers both:
 *   1. Drawer edits: actionPlan, followUpNotes
 *   2. Edit modal: incidentDate, incidentType, description, externalReferral
 * All fields are optional so either surface can submit a partial payload.
 */
export const updateCaseSchema = z.object({
  incidentDate:     z.string().datetime().optional(),
  incidentType:     z.nativeEnum(IncidentType).optional(),
  description:      z.string().min(10).optional(),
  actionPlan:       z.string().optional(),
  followUpNotes:    z.string().optional(),
  externalReferral: z.string().optional(),
  status:z.string().optional()
});

export const grantAccessSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type CaseCreateInput  = z.infer<typeof createCaseSchema>;
export type CaseUpdateInput  = z.infer<typeof updateCaseSchema>;