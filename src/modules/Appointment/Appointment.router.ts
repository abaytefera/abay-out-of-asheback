import { Router }       from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import * as ctrl        from "./Appointment.Controller";

export const appointmentsRouter = Router();
appointmentsRouter.use(authenticate);

// Assign a new appointment (Program Manager / Admin only)
appointmentsRouter.post(
  "/",
  authorize("PROGRAM_MANAGER", "ADMIN"),
  ctrl.assignAppointment
);

// Get appointments for a specific child (was: getByHomeVisit — schema has no homeVisitId)
appointmentsRouter.get(
  "/child/:childId",
  authorize("SOCIAL_WORKER", "PROGRAM_MANAGER", "COUNTRY_DIRECTOR", "ADMIN"),
  ctrl.getAppointmentsByChild
);

// Get appointments assigned to the logged-in social worker
appointmentsRouter.get(
  "/my",
  authorize("SOCIAL_WORKER", "PROGRAM_MANAGER", "COUNTRY_DIRECTOR", "ADMIN"),
  ctrl.getMyAppointments
);

// Get all active social workers (for the assignment dropdown)
appointmentsRouter.get(
  "/social-workers",
  authorize("PROGRAM_MANAGER", "ADMIN"),
  ctrl.getActiveSocialWorkers
);

// Update appointment status
appointmentsRouter.patch(
  "/:id/status",
  authorize("SOCIAL_WORKER", "PROGRAM_MANAGER", "ADMIN"),
  ctrl.updateAppointmentStatus
);

// Delete appointment
appointmentsRouter.delete(
  "/:id",
  authorize("PROGRAM_MANAGER", "ADMIN"),
  ctrl.deleteAppointment
);

export default appointmentsRouter;