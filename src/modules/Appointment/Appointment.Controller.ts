import { Response }    from "express";
import AppointmentService from "./Appointment.service";
import { catchAsync }  from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { AuthRequest } from "../../types";

// POST /api/v1/appointments
export const assignAppointment = catchAsync(async (req: AuthRequest, res: Response) => {
    console.log("body check")
    console.log(req.body)
  const result = await AppointmentService.assignAppointment({
    childId:         req.body.childId,
    assignedToId:    req.body.assignedToId,
    appointmentDate: req.body.appointmentDate,
    notes:           req.body.notes,
  });
  sendSuccess(res, result, "Appointment assigned");
});

// GET /api/v1/appointments/child/:childId
export const getAppointmentsByChild = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AppointmentService.getByChild(req.params.childId);
  sendSuccess(res, result);
});

// GET /api/v1/appointments/my
export const getMyAppointments = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AppointmentService.getMyAppointments(req.user!.id);
  sendSuccess(res, result);
});

// GET /api/v1/appointments/social-workers
export const getActiveSocialWorkers = catchAsync(async (_req: AuthRequest, res: Response) => {
  const result = await AppointmentService.getActiveSocialWorkers();
  sendSuccess(res, result);
});

// PATCH /api/v1/appointments/:id/status
export const updateAppointmentStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AppointmentService.updateStatus(req.params.id, req.body.status);
  sendSuccess(res, result, "Status updated");
});

// DELETE /api/v1/appointments/:id
export const deleteAppointment = catchAsync(async (req: AuthRequest, res: Response) => {
  await AppointmentService.deleteAppointment(req.params.id);
  sendSuccess(res, null, "Appointment deleted");
});