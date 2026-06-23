import { Router as HVRouter }  from "express";
import { upload, createVisitSchema } from "./home-visit.dto";
import { validate }            from "../../middleware/validate";
import * as hvCtrl             from "./home-visit.controller";
 import { authorize } from "../../middleware/authorize";
 import { authenticate } from "../../middleware/authenticate";
export const homeVisitsRouter = HVRouter();
homeVisitsRouter.use(authenticate);
 
// Dashboard — Program Manager & Admin only
homeVisitsRouter.get(
  "/metrics/dashboard",
  authorize("PROGRAM_MANAGER", "ADMIN"),
  hvCtrl.getDashboard
);
 
// List visits by child — SW, PM, Admin (CD excluded per RBAC doc)
homeVisitsRouter.get(
  "/child/:childId",
  authorize("SOCIAL_WORKER", "PROGRAM_MANAGER", "ADMIN","COUNTRY_DIRECTOR"),
  hvCtrl.getByChild
);
 
// Create new visit — Social Workers only
homeVisitsRouter.post(
  "/",
  authorize("SOCIAL_WORKER", "ADMIN"),
  upload.array("photos", 10),
  validate(createVisitSchema),
  hvCtrl.createVisit
);
 
// Edit visit — PM can RUD, SW cannot update
homeVisitsRouter.patch(
  "/:id",
  authorize("PROGRAM_MANAGER", "ADMIN","SOCIAL_WORKER"),
  upload.array("photos", 10),
  hvCtrl.editVisit
);
 
// Delete photo — PM & Admin
homeVisitsRouter.delete(
  "/:id/photos/:photoId",
  authorize("ADMIN"),
  hvCtrl.removePhoto
);
 
// Delete visit — PM & Admin
homeVisitsRouter.delete(
  "/:id",
  authorize( "ADMIN"),
  hvCtrl.removeVisit
);
 
// Mark follow-up done — SW, PM, Admin
homeVisitsRouter.patch(
  "/:id/follow-up-done",
  authorize("SOCIAL_WORKER", "PROGRAM_MANAGER", "ADMIN"),
  hvCtrl.completeFollowUp
);