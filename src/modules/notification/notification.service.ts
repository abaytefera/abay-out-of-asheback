import { NotificationRepository, CreateNotificationInput } from "./notification.model";

import { NotificationType, NotificationPriority }          from "@prisma/client";
import { AppError }                                        from "../../utils/AppError";

// Schema-valid priority shorthands
const P = {
  LOW:    "LOW"    as NotificationPriority,
  MEDIUM: "MEDIUM" as NotificationPriority,
  HIGH:   "HIGH"   as NotificationPriority,
  URGENT: "URGENT" as NotificationPriority,
};

// Schema-valid notification types
const T = {
  SAFEGUARDING_ALERT:         "SAFEGUARDING_ALERT"         as NotificationType,
  FINANCIAL_APPROVAL_REQUEST: "FINANCIAL_APPROVAL_REQUEST" as NotificationType,
  HOME_VISIT_DUE:             "HOME_VISIT_DUE"             as NotificationType,
  ACADEMIC_ALERT:             "ACADEMIC_ALERT"             as NotificationType,
  SYSTEM_ANNOUNCEMENT:        "SYSTEM_ANNOUNCEMENT"        as NotificationType,
  DATA_CREATE:                "DATA_CREATE"                as NotificationType,
  DATA_UPDATE:                "DATA_UPDATE"                as NotificationType,
  DATA_DELETE:                "DATA_DELETE"                as NotificationType,
  SECURITY_WARNING:           "SECURITY_WARNING"           as NotificationType,
  NEW_VISIT_LOGGED:           "NEW_VISIT_LOGGED"           as NotificationType,
  NEW_APPOINTMENT_ASSIGNED:   "NEW_APPOINTMENT_ASSIGNED"   as NotificationType,
  UPCOMING_REMINDER:          "UPCOMING_REMINDER"          as NotificationType,
  TODAY_VISIT_ALERT:          "TODAY_VISIT_ALERT"          as NotificationType,
  EMERGENCY_ALERT:            "EMERGENCY_ALERT"            as NotificationType,
};

export class NotificationService {
  private repo = new NotificationRepository();

  // ── Core: single user ─────────────────────────────────────────────────────
  async notifyUser(input: CreateNotificationInput) {
    return this.repo.create(input);
  }

  // ── Core: multiple users ──────────────────────────────────────────────────
  async notifyUsers(userIds: string[], data: Omit<CreateNotificationInput, "userId">) {
    if (!userIds.length) return { count: 0 };
    return this.repo.createMany(userIds.map((userId: string) => ({ ...data, userId })));
  }

  // ── FEATURE 1: Visit created ──────────────────────────────────────────────
  async notifyOnVisitCreated(
    homeVisitId: string,
    purpose:     string,
    workerName:  string,
    visitDate:   string
  ) {
    if (purpose === "EMERGENCY") {
      const directors = await this.repo.findUsersByRole("COUNTRY_DIRECTOR");
      if (directors.length) {
        await this.repo.createMany(
          directors.map((d: { id: string }) => ({
            userId:     d.id,
            type:       T.EMERGENCY_ALERT,
            priority:   P.URGENT,
            title:      "🚨 EMERGENCY Home Visit Submitted",
            message:    `An EMERGENCY home visit was submitted by ${workerName} on ${visitDate}. Immediate review required.`,
            entityType: "HOME_VISIT",
            relatedId:  homeVisitId,
          }))
        );
      }
    } else {
      const managers = await this.repo.findUsersByRole("PROGRAM_MANAGER");
      if (managers.length) {
        await this.repo.createMany(
          managers.map((m: { id: string }) => ({
            userId:     m.id,
            type:       T.NEW_VISIT_LOGGED,
            priority:   P.MEDIUM,
            title:      "New Home Visit Report Submitted",
            message:    `${workerName} submitted a new ${purpose.replace("_", " ").toLowerCase()} home visit report on ${visitDate}.`,
            entityType: "HOME_VISIT",
            relatedId:  homeVisitId,
          }))
        );
      }
    }
  }

  // ── FEATURE 3: Appointment assigned ──────────────────────────────────────
  async notifyAppointmentAssigned(
    appointmentId: string,
    assignedToId:  string,
    targetDate:    string
  ) {
    await this.repo.create({
      userId:     assignedToId,
      type:       T.NEW_APPOINTMENT_ASSIGNED,
      priority:   P.HIGH,
      title:      "New Field Appointment Assigned",
      message:    `You have been assigned a new home visit follow-up appointment for ${targetDate}. Please prepare accordingly.`,
      entityType: "APPOINTMENT",
      relatedId:  appointmentId,
    });
  }

  // ── FEATURE 2: Nightly reminder cron ─────────────────────────────────────
  async processNightlyReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await this.repo.findAppointmentsForReminders();
    const managers     = await this.repo.findUsersByRole("PROGRAM_MANAGER");
    const managerIds   = managers.map((m: { id: string }) => m.id);

    const results = { processed: 0, skipped: 0 };

    for (const appt of appointments) {
      // FIX (TS18047): assignedTo is nullable because of `onDelete: SetNull` on the
      // HomeVisitAppointment → User relation. If the assigned worker was deleted,
      // we have nobody to notify and no name to display — skip the appointment.
      if (!appt.assignedTo) {
        results.skipped++;
        continue;
      }

      const apptDate  = new Date(appt.appointmentDate);
      const createdAt = new Date(appt.createdAt);
      apptDate.setHours(0, 0, 0, 0);
      createdAt.setHours(0, 0, 0, 0);

      const totalWindowDays = Math.round((apptDate.getTime() - createdAt.getTime()) / 86_400_000);
      const daysRemaining   = Math.round((apptDate.getTime() - today.getTime())     / 86_400_000);
      const appointmentLabel = apptDate.toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });

      // Safe to access — null was ruled out by the early-continue above
      const workerName = `${appt.assignedTo.firstName} ${appt.assignedTo.lastName}`;

      const isLongTerm = totalWindowDays > 30;
      const isMidTerm  = totalWindowDays >= 14;

      let shouldSend = false;
      let type: NotificationType         = T.UPCOMING_REMINDER;
      let priority: NotificationPriority = P.MEDIUM;
      let title   = "";
      let message = "";

      if (daysRemaining === 0) {
        shouldSend = true;
        type       = T.TODAY_VISIT_ALERT;
        priority   = P.HIGH;
        title      = "🗓️ Home Visit Scheduled for Today";
        message    = `Reminder: ${workerName}'s appointment is scheduled for TODAY (${appointmentLabel}).`;
      } else if (daysRemaining === 3 && (isLongTerm || isMidTerm)) {
        shouldSend = true;
        type       = T.UPCOMING_REMINDER;
        priority   = P.MEDIUM;
        title      = "Home Visit Appointment in 3 Days";
        message    = `Upcoming: ${workerName} has a home visit appointment on ${appointmentLabel} (3 days away).`;
      } else if (daysRemaining === 7 && isLongTerm) {
        shouldSend = true;
        type       = T.UPCOMING_REMINDER;
        priority   = P.LOW;
        title      = "Home Visit Appointment in 7 Days";
        message    = `Advance notice: ${workerName} has a home visit appointment on ${appointmentLabel} (7 days away).`;
      }

      if (!shouldSend) { results.skipped++; continue; }

      // FIX (TS18047 line 158): appt.assignedTo.id is safe here — null was
      // caught by the early-continue at the top of the loop.
      const recipientIds = [...new Set([...managerIds, appt.assignedTo.id])];
      await this.repo.createMany(
        recipientIds.map((userId: string) => ({
          userId, type, priority, title, message,
          entityType: "APPOINTMENT",
          relatedId:  appt.id,
        }))
      );
      results.processed++;
    }

    return results;
  }

  // ── CRUD helpers ──────────────────────────────────────────────────────────
  async getForUser(
    userId:  string,
    page   = 1,
    limit  = 20,
    filters?: { isRead?: boolean; type?: NotificationType }
  ) {
    return this.repo.findByUser(userId, page, limit, filters);
  }

  async getUnreadCount(userId: string) {
    return { count: await this.repo.countUnread(userId) };
  }

  async markRead(id: string, userId: string) {
    const n = await this.repo.findById(id);
    if (!n) throw new AppError("Notification not found", 404);
    if (n.userId !== userId) throw new AppError("Not authorized", 403);
    if (n.isRead) return n;
    return this.repo.markOneRead(id, userId);
  }

  async markAllRead(userId: string) {
    const result = await this.repo.markAllRead(userId);
    return { success: true, updated: result.count };
  }

  async deleteNotification(id: string, userId: string) {
    const n = await this.repo.findById(id);
    if (!n) throw new AppError("Notification not found", 404);
    if (n.userId !== userId) throw new AppError("Not authorized", 403);
    await this.repo.delete(id);
    return { success: true };
  }

  async getActiveSocialWorkers() {
    return this.repo.findActiveSocialWorkers();
  }

  // ── Convenience helpers for other modules ─────────────────────────────────
  async safeguardingAlert(userIds: string[], childCode: string, incidentType: string, caseId: string) {
    return this.notifyUsers(userIds, {
      type: T.SAFEGUARDING_ALERT, priority: P.URGENT,
      title:   "New Safeguarding Case Reported",
      message: `A new ${incidentType} case was reported for child ${childCode}.`,
      entityType: "SAFEGUARDING_CASE", relatedId: caseId,
    });
  }

  async financialApprovalRequest(userIds: string[], childCode: string, amount: number, supportId: string) {
    return this.notifyUsers(userIds, {
      type: T.FINANCIAL_APPROVAL_REQUEST, priority: P.HIGH,
      title:   "Financial Support Approval Needed",
      message: `A financial support request of ${amount} ETB for child ${childCode} requires approval.`,
      entityType: "FINANCIAL_SUPPORT", relatedId: supportId,
    });
  }

  async homeVisitDue(userId: string, childCode: string, visitId: string, followUpDate: Date) {
    return this.notifyUser({
      userId, type: T.HOME_VISIT_DUE, priority: P.MEDIUM,
      title:   "Home Visit Follow-up Due",
      message: `Follow-up home visit for child ${childCode} is due on ${followUpDate.toDateString()}.`,
      entityType: "HOME_VISIT", relatedId: visitId,
    });
  }

  async academicAlert(userIds: string[], childCode: string, message: string, alertId: string) {
    return this.notifyUsers(userIds, {
      type: T.ACADEMIC_ALERT, priority: P.MEDIUM,
      title: `Academic Alert — ${childCode}`, message,
      entityType: "ACADEMIC_RECORD", relatedId: alertId,
    });
  }

  async dataChange(
    userIds: string[],
    action:  "DATA_CREATE" | "DATA_UPDATE" | "DATA_DELETE",
    resource: string, resourceId: string, actorName: string
  ) {
    const verb = { DATA_CREATE: "created", DATA_UPDATE: "updated", DATA_DELETE: "deleted" }[action];
    return this.notifyUsers(userIds, {
      type: action as NotificationType, priority: P.LOW,
      title:   `${resource} ${verb}`,
      message: `${actorName} ${verb} a ${resource.toLowerCase()} record.`,
      entityType: resource.toUpperCase(), relatedId: resourceId,
    });
  }

  async securityWarning(userIds: string[], message: string) {
    return this.notifyUsers(userIds, {
      type: T.SECURITY_WARNING, priority: P.URGENT,
      title: "Security Alert", message,
    });
  }

  async systemAnnouncement(userIds: string[], title: string, message: string) {
    return this.notifyUsers(userIds, {
      type: T.SYSTEM_ANNOUNCEMENT, priority: P.LOW, title, message,
    });
  }
}

export default new NotificationService();