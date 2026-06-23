import { Prisma, NotificationType, NotificationPriority, UserRole } from "@prisma/client";
import prisma from "../../config/prisma";
import {
  SessionCreateInput,
  SessionUpdateInput,
  TbriCreateInput,
  TbriUpdateInput,
} from "./psychosocial.dto";

// =============================================================================
// SHARED BROADCAST HELPER
// =============================================================================
//
// Notification  rows → ALL of: active ADMINs + active COUNTRY_DIRECTORs + actor
// AuditLog rows → ALL of: active ADMINs + active COUNTRY_DIRECTORs + actor
//
// The actor's AuditLog is written with a SEPARATE explicit prisma.auditLog.create
// call so it is always guaranteed, even when createMany behaves unexpectedly on
// MySQL with an all-nullable row shape.
//
// Deduplication: if the actor is already an ADMIN or COUNTRY_DIRECTOR they will
// appear only once in the notification fan-out (Set collapses the duplicate).
// Their audit log is still written exactly once via the explicit create.

interface BroadcastParams {
  actorId: string;
  childId?: string | null;
  // Notification fields
  notificationType: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType: "PsychosocialSession" | "TBRIActivity";
  relatedId: string;
  // Audit log fields
  action: "CREATE" | "UPDATE" | "DELETE";
  resource: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

async function broadcastPsychosocialEvent(params: BroadcastParams): Promise<void> {
  // ── Step 1: fetch all active ADMINs + COUNTRY_DIRECTORs ──────────────────
  const privileged = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR] },
      isActive: true,
    },
    select: { id: true },
  });

  const privilegedIds = privileged.map((u) => u.id);

  // ── Step 2: notification recipients = ADMINs + CDs + actor (deduplicated) ─
  // If actor is already an ADMIN or CD the Set collapses the duplicate.
  const notificationRecipientIds = Array.from(
    new Set([...privilegedIds, params.actorId])
  );

  // ── Step 3: privileged-only audit log recipients (excludes actor — handled separately) ─
  // We write privileged rows via createMany, then the actor row via an explicit
  // create so the actor audit log is ALWAYS written regardless of MySQL/Prisma
  // createMany edge-cases.
  const privilegedOnlyIds = privilegedIds.filter((id) => id !== params.actorId);

  const auditPayload = {
    childId:    params.childId ?? null,
    action:     params.action,
    resource:   params.resource,
    resourceId: params.resourceId,
    metadata:   (params.metadata ?? {}) as Prisma.InputJsonValue,
  };

  // ── Step 4: execute everything in one atomic transaction ──────────────────
  await prisma.$transaction(async (tx) => {
    // 4a. Notifications → everyone (ADMINs + CDs + actor)
    await tx.notification.createMany({
      data: notificationRecipientIds.map((userId) => ({
        userId,
        type:       params.notificationType,
        priority:   params.priority,
        title:      params.title,
        message:    params.message,
        entityType: params.entityType,
        relatedId:  params.relatedId,
      })),
    });

    // 4b. AuditLog for privileged users (ADMINs + CDs who are NOT the actor)
    if (privilegedOnlyIds.length > 0) {
      await tx.auditLog.createMany({
        data: privilegedOnlyIds.map((userId) => ({
          userId,
          ...auditPayload,
        })),
      });
    }

    // 4c. AuditLog for the ACTOR — explicit create, always guaranteed ✅
    await tx.auditLog.create({
      data: {
        userId: params.actorId,
        ...auditPayload,
      },
    });
  });
}

// =============================================================================
// NEXT-SESSION REMINDER HELPER
// =============================================================================
//
// Called after create / update whenever a nextSessionDate is set.
// Sends an UPCOMING_REMINDER notification to:
//   1. All active PROGRAM_MANAGERs
//   2. The actor (counselor) themselves
//      (Set deduplicates if actor is also a PROGRAM_MANAGER)

async function notifyNextSession(
  sessionId: string,
  nextSessionDate: Date,
  childId: string,
  actorId: string
): Promise<void> {
  const managers = await prisma.user.findMany({
    where: { role: UserRole.PROGRAM_MANAGER, isActive: true },
    select: { id: true },
  });

  const recipientIds = Array.from(
    new Set([...managers.map((u) => u.id), actorId])
  );

  const formattedDate = nextSessionDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await prisma.notification.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      type:       NotificationType.UPCOMING_REMINDER,
      priority:   NotificationPriority.MEDIUM,
      title:      "Upcoming Psychosocial Session",
      message:    `A psychosocial session is scheduled for ${formattedDate}. Please ensure the counselor and child are prepared.`,
      entityType: "PsychosocialSession",
      relatedId:  sessionId,
    })),
  });
}

// =============================================================================
// REPOSITORY
// =============================================================================

export class PsychosocialRepository {

  // ── Sessions ──────────────────────────────────────────────────────────────

  async createSession(dto: SessionCreateInput, actorId: string) {
    const session = await prisma.psychosocialSession.create({
      data: {
        childId:            dto.childId,
        sessionType:        dto.sessionType,
        behavioralConcerns: dto.behavioralConcerns || null,
        traumaAssessment:   dto.traumaAssessment   || null,
        progressNotes:      dto.progressNotes      || null,
        counselorId:        actorId,
        sessionDate:        dto.sessionDate,
        nextSessionDate:    dto.nextSessionDate     || null,
      },
      include: { counselor: { select: { firstName: true, lastName: true } } },
    });

    // Notification + AuditLog → ADMINs + COUNTRY_DIRECTORs + actor
    await broadcastPsychosocialEvent({
      actorId,
      childId:          dto.childId,
      notificationType: NotificationType.DATA_CREATE,
      priority:         NotificationPriority.MEDIUM,
      title:            "Psychosocial session logged",
      message:          `A new ${dto.sessionType} session has been recorded for a child.`,
      entityType:       "PsychosocialSession",
      relatedId:        session.id,
      action:           "CREATE",
      resource:         "PsychosocialSession",
      resourceId:       session.id,
      metadata: {
        sessionType:     dto.sessionType,
        sessionDate:     dto.sessionDate,
        nextSessionDate: dto.nextSessionDate || null,
      },
    });

    // Reminder notification → PROGRAM_MANAGERs + actor
    if (dto.nextSessionDate) {
      await notifyNextSession(session.id, dto.nextSessionDate, dto.childId, actorId);
    }

    return session;
  }

  async findSessionById(id: string) {
    return prisma.psychosocialSession.findUnique({ where: { id } });
  }

  async findSessionsByChildId(childId: string) {
    return prisma.psychosocialSession.findMany({
      where:   { childId },
      include: { counselor: { select: { firstName: true, lastName: true } } },
      orderBy: { sessionDate: "desc" },
    });
  }

  async updateSession(id: string, dto: SessionUpdateInput, actorId: string) {
    const existing = await prisma.psychosocialSession.findUnique({ where: { id } });

    const session = await prisma.psychosocialSession.update({
      where: { id },
      data: {
        ...(dto.sessionDate        !== undefined && { sessionDate:        dto.sessionDate }),
        ...(dto.sessionType        !== undefined && { sessionType:        dto.sessionType }),
        ...(dto.behavioralConcerns !== undefined && { behavioralConcerns: dto.behavioralConcerns }),
        ...(dto.traumaAssessment   !== undefined && { traumaAssessment:   dto.traumaAssessment }),
        ...(dto.progressNotes      !== undefined && { progressNotes:      dto.progressNotes }),
        ...(dto.nextSessionDate    !== undefined && { nextSessionDate:    dto.nextSessionDate }),
      },
      include: { counselor: { select: { firstName: true, lastName: true } } },
    });

    // Notification + AuditLog → ADMINs + COUNTRY_DIRECTORs + actor
    await broadcastPsychosocialEvent({
      actorId,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         NotificationPriority.LOW,
      title:            "Psychosocial session updated",
      message:          "A psychosocial session record has been updated.",
      entityType:       "PsychosocialSession",
      relatedId:        id,
      action:           "UPDATE",
      resource:         "PsychosocialSession",
      resourceId:       id,
      metadata:         { changes: dto },
    });

    // Reminder notification → PROGRAM_MANAGERs + actor
    const nextDate = dto.nextSessionDate ?? session.nextSessionDate;
    if (nextDate) {
      await notifyNextSession(
        id,
        nextDate,
        existing?.childId ?? session.childId,
        actorId
      );
    }

    return session;
  }

  async deleteSession(id: string, actorId: string) {
    const existing = await prisma.psychosocialSession.findUnique({ where: { id } });
    const deleted  = await prisma.psychosocialSession.delete({ where: { id } });

    // Notification + AuditLog → ADMINs + COUNTRY_DIRECTORs + actor
    await broadcastPsychosocialEvent({
      actorId,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_DELETE,
      priority:         NotificationPriority.HIGH,
      title:            "Psychosocial session deleted",
      message:          "A psychosocial session record has been permanently deleted.",
      entityType:       "PsychosocialSession",
      relatedId:        id,
      action:           "DELETE",
      resource:         "PsychosocialSession",
      resourceId:       id,
      metadata: {
        sessionType: existing?.sessionType,
        sessionDate: existing?.sessionDate,
      },
    });

    return deleted;
  }

  // ── TBRI ──────────────────────────────────────────────────────────────────

  async createTBRI(dto: TbriCreateInput, actorId: string) {
    const activity = await prisma.tBRIActivity.create({
      data: {
        childId:       dto.childId,
        activityName:  dto.activityName,
        startDate:     dto.startDate,
        tbriPillar:    dto.tbriPillar,
        facilitatorId: actorId,
        initialState:  dto.initialState,
        progressLogs: {
          create: {
            authorId:       actorId,
            strategyUsed:   `Initial ${dto.tbriPillar} Strategy Assignment`,
            observations:   dto.observations,
            outcomes:       dto.outcomes,
            resultingState: dto.initialState,
          },
        },
      },
      include: {
        facilitator:  { select: { firstName: true, lastName: true } },
        progressLogs: true,
      },
    });

    // Notification + AuditLog → ADMINs + COUNTRY_DIRECTORs + actor
    await broadcastPsychosocialEvent({
      actorId,
      childId:          dto.childId,
      notificationType: NotificationType.DATA_CREATE,
      priority:         NotificationPriority.MEDIUM,
      title:            "TBRI activity recorded",
      message:          `A new TBRI activity "${dto.activityName}" (${dto.tbriPillar}) has been recorded for a child.`,
      entityType:       "TBRIActivity",
      relatedId:        activity.id,
      action:           "CREATE",
      resource:         "TBRIActivity",
      resourceId:       activity.id,
      metadata: {
        activityName: dto.activityName,
        tbriPillar:   dto.tbriPillar,
        initialState: dto.initialState,
        startDate:    dto.startDate,
      },
    });

    return activity;
  }

  async findTBRIById(id: string) {
    return prisma.tBRIActivity.findUnique({ where: { id } });
  }

  async findTBRIActivitiesByChildId(childId: string) {
    return prisma.tBRIActivity.findMany({
      where:   { childId },
      include: {
        facilitator:  { select: { firstName: true, lastName: true } },
        progressLogs: { orderBy: { loggedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateTBRI(id: string, dto: TbriUpdateInput, actorId: string) {
    const existing = await prisma.tBRIActivity.findUnique({ where: { id } });

    const activity = await prisma.tBRIActivity.update({
      where: { id },
      data: {
        ...(dto.activityName !== undefined && { activityName: dto.activityName }),
        ...(dto.startDate    !== undefined && { startDate:    dto.startDate }),
        ...(dto.tbriPillar   !== undefined && { tbriPillar:   dto.tbriPillar }),
        ...(dto.initialState !== undefined && { initialState: dto.initialState }),
      },
      include: {
        facilitator:  { select: { firstName: true, lastName: true } },
        progressLogs: { orderBy: { loggedAt: "desc" } },
      },
    });

    // Notification + AuditLog → ADMINs + COUNTRY_DIRECTORs + actor
    await broadcastPsychosocialEvent({
      actorId,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         NotificationPriority.LOW,
      title:            "TBRI activity updated",
      message:          "A TBRI activity record has been updated.",
      entityType:       "TBRIActivity",
      relatedId:        id,
      action:           "UPDATE",
      resource:         "TBRIActivity",
      resourceId:       id,
      metadata:         { changes: dto },
    });

    return activity;
  }

  async deleteTBRI(id: string, actorId: string) {
    const existing = await prisma.tBRIActivity.findUnique({ where: { id } });
    // TBRILog has onDelete: Cascade — Prisma handles log cleanup automatically
    const deleted  = await prisma.tBRIActivity.delete({ where: { id } });

    // Notification + AuditLog → ADMINs + COUNTRY_DIRECTORs + actor
    await broadcastPsychosocialEvent({
      actorId,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_DELETE,
      priority:         NotificationPriority.HIGH,
      title:            "TBRI activity deleted",
      message:          "A TBRI activity has been permanently deleted.",
      entityType:       "TBRIActivity",
      relatedId:        id,
      action:           "DELETE",
      resource:         "TBRIActivity",
      resourceId:       id,
      metadata: {
        activityName: existing?.activityName,
        tbriPillar:   existing?.tbriPillar,
      },
    });

    return deleted;
  }
}