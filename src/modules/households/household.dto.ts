import { z } from "zod";
import { HousingCondition, WaterAccess, SanitationAccess, MaritalStatus, IncomeRange } from "@prisma/client";

export const householdSchema = z.object({
  householdCode: z.string().min(1, "Household code is required"),
  address: z.string().optional(),
  subCity: z.string().optional(),
  kebele: z.string().optional(),
  housingCondition: z.nativeEnum(HousingCondition).optional(),
  waterAccess: z.nativeEnum(WaterAccess).optional(),
  sanitationAccess: z.nativeEnum(SanitationAccess).optional(),
  hasDisabledMember: z.boolean().optional(),
  numberOfMembers: z.number().int().optional(),
  notes: z.string().optional(),
});

export const guardianSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  relationship: z.string().min(1, "Relationship profile link type is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email structure structure").optional(),
  occupation: z.string().optional(),
  educationLevel: z.string().optional(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional(),
  incomeRange: z.nativeEnum(IncomeRange).optional(),
  isEmergencyContact: z.boolean().optional(),
});

// Structural Type Inference Exports
export type HouseholdCreateInput = z.infer<typeof householdSchema>;
export type HouseholdUpdateInput = Partial<HouseholdCreateInput>;

export type GuardianCreateInput = z.infer<typeof guardianSchema>;
export type GuardianUpdateInput = Partial<GuardianCreateInput>;