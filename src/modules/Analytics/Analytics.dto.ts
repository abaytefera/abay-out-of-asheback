import { z } from "zod";

/**
 * Query-param contract for GET /analytics/dashboard
 *
 *   ?year=2026            -> all records in 2026
 *   ?year=2026&month=6    -> records in June 2026
 *   (no params)           -> all-time totals
 *
 * `month` without `year` is rejected — there's no sensible "every June
 * across all years" aggregate for this dashboard.
 */
export const dashboardQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  })
  .refine((data) => !(data.month !== undefined && data.year === undefined), {
    message: "A 'year' is required when filtering by 'month'.",
    path: ["month"],
  });

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;