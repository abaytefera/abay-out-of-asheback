import prisma from "../../config/prisma";

// Schema fields: id, childId, assignedToId, appointmentDate, status, notes, createdAt, updatedAt
// NO: homeVisitId, assignedById, assignedBy, homeVisit relation

export class AppointmentRepository {

  // ── Create a new appointment ──────────────────────────────────────────────
  async create(data: {
    childId:         string;
    assignedToId:    string;
    appointmentDate: Date;
    notes?:          string;
  }) {
    return prisma.homeVisitAppointment.create({
      data,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        child:      { select: { id: true, childCode: true, firstName: true, lastName: true } },
      },
    });
  }

  // ── Find single appointment ───────────────────────────────────────────────
  async findById(id: string) {
    return prisma.homeVisitAppointment.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        child:      { select: { id: true, childCode: true, firstName: true, lastName: true } },
      },
    });
  }

  // ── List appointments for a specific child ────────────────────────────────
  async findByChild(childId: string) {
    return prisma.homeVisitAppointment.findMany({
      where:   { childId },
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { appointmentDate: "asc" },
    });
  }

  // ── List appointments assigned to a specific social worker ────────────────
  async findByAssignee(assignedToId: string) {
    return prisma.homeVisitAppointment.findMany({
      where:   { assignedToId, status: "PENDING" },
      include: {
        child: { select: { id: true, childCode: true, firstName: true, lastName: true } },
      },
      orderBy: { appointmentDate: "asc" },
    });
  }

  // ── Update appointment status ─────────────────────────────────────────────
  async updateStatus(id: string, status: "PENDING" | "FULFILLED" | "CANCELED") {
    return prisma.homeVisitAppointment.update({
      where: { id },
      data:  { status },
    });
  }

  // ── Delete appointment ────────────────────────────────────────────────────
  async delete(id: string) {
    return prisma.homeVisitAppointment.delete({ where: { id } });
  }

  // ── Active social workers for the assignment dropdown ─────────────────────
  async findActiveSocialWorkers() {
    return prisma.user.findMany({
      where:   { role: "SOCIAL_WORKER", isActive: true },
      select:  { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    });
  }
}