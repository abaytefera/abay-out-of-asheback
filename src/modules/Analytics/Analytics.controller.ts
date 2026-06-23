import { Request, Response, NextFunction } from "express";
import { dashboardQuerySchema } from "./Analytics.dto";
import * as analyticsService from "./Analytics.service";

export async function getDashboardAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = dashboardQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await analyticsService.getDashboardAnalytics(parsed.data);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}