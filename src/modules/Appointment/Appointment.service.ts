import { AppointmentRepository } from "./Appointment.repository";
import NotificationService        from "../notification/notification.service";
import { AppError }               from "../../utils/AppError";

// Schema reminder: HomeVisitAppointment has NO homeVisitId or assignedById.
// Appointments are linked to a child directly. If you need to tie an appointment
// to a specific HomeVisit, add `homeVisitId String?` to the schema and re-run `prisma generate`.

export class AppointmentService {
  private repo = new AppointmentRepository();

  // ── Assign a future appointment ───────────────────────────────────────────
  async assignAppointment(data: {
    childId:         string;
    assignedToId:    string;
    appointmentDate: string;
    notes?:          string;
  }) {
    const apptDate = new Date(data.appointmentDate);
    if (isNaN(apptDate.getTime())) throw new AppError("Invalid appointment date", 400);
    if (apptDate <= new Date())    throw new AppError("Appointment date must be in the future", 400);

    const appointment = await this.repo.create({
      childId:         data.childId,
      assignedToId:    data.assignedToId,
      appointmentDate: apptDate,
      notes:           data.notes,
    });

    const targetDate = apptDate.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    // Fire-and-forget — never block the HTTP response
    NotificationService
      .notifyAppointmentAssigned(appointment.id, data.assignedToId, targetDate)
      .catch((err: unknown) =>
        console.error("[Notification] Appointment assignment notify failed:", err)
      );

    return appointment;
  }

  // ── List appointments for a child ─────────────────────────────────────────
  // (replaces getByHomeVisit — schema has no homeVisitId on appointments)
  async getByChild(childId: string) {
    return this.repo.findByChild(childId);
  }

  // ── List appointments for the logged-in social worker ────────────────────
  async getMyAppointments(assignedToId: string) {
    return this.repo.findByAssignee(assignedToId);
  }

  // ── Update status ─────────────────────────────────────────────────────────
  async updateStatus(id: string, status: "PENDING" | "FULFILLED" | "CANCELED") {
    const appt = await this.repo.findById(id);
    if (!appt) throw new AppError("Appointment not found", 404);
    return this.repo.updateStatus(id, status);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async deleteAppointment(id: string) {
    const appt = await this.repo.findById(id);
    if (!appt) throw new AppError("Appointment not found", 404);
    return this.repo.delete(id);
  }

  // ── Active social workers for the assignment dropdown ─────────────────────
  async getActiveSocialWorkers() {
    return this.repo.findActiveSocialWorkers();
  }
}

export default new AppointmentService();