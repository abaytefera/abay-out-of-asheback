import { z } from "zod";

export class AppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const sponsorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email layout configuration").optional().nullable(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const sponsorshipSchema = z.object({
  childId: z.string().min(1, "Child relation footprint tracker ID is required"),
  sponsorId: z.string().min(1, "Sponsor anchor node footprint configuration ID is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),

  isActive: z.boolean().optional().default(true),
});

export type SponsorInput = z.infer<typeof sponsorSchema>;
export type SponsorshipInput = z.infer<typeof sponsorshipSchema>;