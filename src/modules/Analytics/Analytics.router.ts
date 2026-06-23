import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import * as analyticsCtrl from "./Analytics.controller";

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

analyticsRouter.get(
  "/dashboard",
  authorize(UserRole.PROGRAM_MANAGER, UserRole.SOCIAL_WORKER, UserRole.ADMIN),
  analyticsCtrl.getDashboardAnalytics
);

export default analyticsRouter;

// Mount in your app entrypoint alongside the other routers:
//   app.use("/api/v1/analytics", analyticsRouter);