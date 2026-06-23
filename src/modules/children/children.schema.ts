import { z } from "zod";
import {
  ChildStatus,
  Gender,
  HousingCondition,
  WaterAccess,
  SanitationAccess,
} from "@prisma/client";

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/** Required date string → ISO string */
const htmlDateSchema = z
  .string()
  .min(1, "Date is required")
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
  .transform((val) => new Date(val).toISOString());

/** Optional date string → ISO string or undefined */
const optionalHtmlDateSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((val) => (val ? new Date(val).toISOString() : undefined));

// ─── Child Sub-Schema ─────────────────────────────────────────────────────────

const childSchema = z.object({
  childCode:             z.string().optional().or(z.literal("")),
  firstName:             z.string().min(1, "First name is required"),
  lastName:              z.string().min(1, "Last name is required"),
  dateOfBirth:           htmlDateSchema,
  gender:                z.nativeEnum(Gender),
  nationality:           z.string().optional().or(z.literal("")),
  religion:              z.string().optional().or(z.literal("")),
  subCity:               z.string().optional().or(z.literal("")),
  kebele:                z.string().optional().or(z.literal("")),
  admissionDate:         htmlDateSchema,
  schoolName:            z.string().optional().or(z.literal("")),
  emergencyContactName:  z.string().optional().or(z.literal("")),
  emergencyContactPhone: z.string().optional().or(z.literal("")),
  notes:                 z.string().optional().or(z.literal("")),
});

// ─── Household Sub-Schema ─────────────────────────────────────────────────────

const householdSchema = z.object({
  householdCode:     z.string().min(1, "Household code is required"),
  address:           z.string().optional().or(z.literal("")),
  subCity:           z.string().optional().or(z.literal("")),
  kebele:            z.string().optional().or(z.literal("")),
  housingCondition:  z.nativeEnum(HousingCondition),
  waterAccess:       z.nativeEnum(WaterAccess),
  sanitationAccess:  z.nativeEnum(SanitationAccess),
  numberOfMembers:   z.preprocess(
    (val) => (val === "" || val === undefined ? null : Number(val)),
    z.number().nullable()
  ),
  hasDisabledMember: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean()
  ),
});

// ─── Guardian Sub-Schema ──────────────────────────────────────────────────────

const guardianSchema = z.object({
  firstName:          z.string().min(1, "Guardian first name is required"),
  lastName:           z.string().min(1, "Guardian last name is required"),
  relationship:       z.string().min(1, "Relationship status is required"),
  phone:              z.string().min(1, "Guardian phone is required"),
  email:              z.string().optional().or(z.literal("")),
  occupation:         z.string().optional().or(z.literal("")),
  educationLevel:     z.string().optional().or(z.literal("")),
  maritalStatus:      z.string().min(1, "Marital status is required"),
  incomeRange:        z.string().min(1, "Income range is required"),
  isEmergencyContact: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean()
  ),
});

// ─── Create Schema ────────────────────────────────────────────────────────────

export const createChildSchema = z.object({
  child:     childSchema,
  household: householdSchema,
  // nullable + optional: guardian can be omitted when "noGuardian" is checked
  guardian:  guardianSchema.nullable().optional(),
});

// ─── Update Schema ────────────────────────────────────────────────────────────

export const updateChildSchema = z
  .object({
    child: childSchema
      .partial()
      .extend({
        // status is only allowed on updates (not creation)
        status:   z.nativeEnum(ChildStatus).optional(),
        exitDate: optionalHtmlDateSchema,
      }),
    household: householdSchema.partial().optional(),
    guardian:  guardianSchema.partial().nullable().optional(),
  })
  .partial(); // all top-level keys are optional so any subset can be sent

// ─── Query Schema (for GET /children) ────────────────────────────────────────

export const childQuerySchema = z.object({
  page:    z.string().optional(),
  limit:   z.string().optional(),
  search:  z.string().optional(),
  status:  z.nativeEnum(ChildStatus).optional(),
  subCity: z.string().optional(),
  gender:  z.nativeEnum(Gender).optional(),

  // ── NEW ──────────────────────────────────────────────────
  hasSafeguardCase:         z.string().optional(), // "true"
  classRank:                z.string().optional(), // "1", "2" ...
  academicYear:             z.string().optional(), // "2024"
  avgScoreMin:              z.string().optional(), // "60"
  avgScoreMax:              z.string().optional(), // "100"
  hasVulnerableAssignment:  z.string().optional(), // "true"
  hasApprovedVulnerability: z.string().optional(), // "true"
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateChildDto = z.infer<typeof createChildSchema>;
export type UpdateChildDto = z.infer<typeof updateChildSchema>;
export type ChildQueryDto  = z.infer<typeof childQuerySchema>;