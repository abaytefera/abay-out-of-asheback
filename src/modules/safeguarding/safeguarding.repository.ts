import { Prisma, CaseStatus, NotificationType, NotificationPriority, UserRole } from "@prisma/client";
import prisma from "../../config/prisma";
import { CaseCreateInput } from "./safeguarding.dto";

// ─── Shared broadcast helper ──────────────────────────────────────────────────
//
// Writes BOTH a Notification AND an AuditLog row for every recipient in the
// deduplicated set: all active ADMINs + all active COUNTRY_DIRECTORs + the actor
// + optional extraRecipientId (e.g. the original reporter when someone else acts).

interface BroadcastParams {
  actorId: string;
  extraRecipientId?: string | null;
  childId?: string | null;
  // Notification
  notificationType: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  relatedId: string;
  // Audit log
  action: "CREATE" | "UPDATE" | "DELETE";
  resource: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

async function broadcastSafeguardingEvent(params: BroadcastParams): Promise<void> {
  // 1. All active ADMINs + COUNTRY_DIRECTORs
  const privileged = await prisma.user.findMany({
    where: { role: { in: [UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR] }, isActive: true },
    select: { id: true },
  });

  // 2. Merge: privileged + actor + optional extra (reporter), then deduplicate
  const recipientIds = Array.from(
    new Set([
      ...privileged.map((u) => u.id),
      params.actorId,
      ...(params.extraRecipientId ? [params.extraRecipientId] : []),
    ])
  );

  // 3. Notifications + audit logs in one transaction
  await prisma.$transaction([
    prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type:       params.notificationType,
        priority:   params.priority,
        title:      params.title,
        message:    params.message,
        entityType: "SafeguardingCase",
        relatedId:  params.relatedId,
      })),
    }),
    prisma.auditLog.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        childId:    params.childId ?? null,
        action:     params.action,
        resource:   params.resource,
        resourceId: params.resourceId,
        metadata:   (params.metadata ?? {}) as Prisma.InputJsonValue,
      })),
    }),
  ]);
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class SafeguardingRepository {
  async findChildById(childId: string) {
    return prisma.child.findUnique({ where: { id: childId } });
  }

  async findUserById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  async createCase(dto: CaseCreateInput, actorId: string) {
    const record = await prisma.safeguardingCase.create({
      data: {
        ...dto,
        incidentDate:      new Date(dto.incidentDate),
        reportedById:      actorId,
        status:            CaseStatus.OPEN,
        authorizedViewers: { create: { userId: actorId } },
      },
      select: { id: true, childId: true, incidentType: true, status: true, createdAt: true },
    });

    await broadcastSafeguardingEvent({
      actorId,
      childId:          dto.childId,
      notificationType: NotificationType.SAFEGUARDING_ALERT,
      priority:         NotificationPriority.URGENT,
      title:            "New safeguarding case opened",
      message:          `A new ${dto.incidentType} safeguarding case has been reported.`,
      relatedId:        record.id,
      action:           "CREATE",
      resource:         "SafeguardingCase",
      resourceId:       record.id,
      metadata: {
        incidentType: dto.incidentType,
        incidentDate: dto.incidentDate,
        status:       CaseStatus.OPEN,
      },
    });

    return record;
  }

  async findManyWithPagination(
    where: Prisma.SafeguardingCaseWhereInput,
    skip: number,
    take: number,
  ) {
    return prisma.$transaction([
      prisma.safeguardingCase.findMany({
        where,
        skip,
        take,
        include: {
          child:             { select: { id: true, firstName: true, lastName: true } },
          reportedBy:        { select: { firstName: true, lastName: true } },
          authorizedViewers: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.safeguardingCase.count({ where }),
    ]);
  }

  async findUniqueDetailed(id: string) {
    return prisma.safeguardingCase.findUnique({
      where: { id },
      include: {
        child:             true,
        reportedBy:        { select: { firstName: true, lastName: true, role: true } },
        closedBy:          { select: { firstName: true, lastName: true } },
        authorizedViewers: { select: { userId: true } },
      },
    });
  }

  async updateCase(
    id: string,
    data: Prisma.SafeguardingCaseUpdateInput,
    actorId: string,
    includeViewers = false,
  ) {
    // Fetch existing record to get childId + reporter for broadcast
    const existing = await prisma.safeguardingCase.findUnique({
      where:  { id },
      select: { childId: true, reportedById: true, incidentType: true, status: true },
    });

    const updated = await prisma.safeguardingCase.update({
      where: { id },
      data,
      ...(includeViewers && {
        include: { authorizedViewers: { select: { userId: true, grantedAt: true } } },
      }),
    });

    await broadcastSafeguardingEvent({
      actorId,
      extraRecipientId: existing?.reportedById,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         NotificationPriority.HIGH,
      title:            "Safeguarding case updated",
      message:          `A safeguarding case (${existing?.incidentType ?? ""}) has been updated.`,
      relatedId:        id,
      action:           "UPDATE",
      resource:         "SafeguardingCase",
      resourceId:       id,
      metadata:         { changes: data, previousStatus: existing?.status },
    });

    return updated;
  }

  async closeCase(id: string, actorId: string) {
    const existing = await prisma.safeguardingCase.findUnique({
      where:  { id },
      select: { childId: true, reportedById: true, incidentType: true },
    });

    const updated = await prisma.safeguardingCase.update({
      where: { id },
      data: {
        status:   CaseStatus.CLOSED,
        closedAt: new Date(),
        closedBy: { connect: { id: actorId } },
      },
    });

    await broadcastSafeguardingEvent({
      actorId,
      extraRecipientId: existing?.reportedById,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         NotificationPriority.HIGH,
      title:            "Safeguarding case closed",
      message:          `A safeguarding case (${existing?.incidentType ?? ""}) has been closed.`,
      relatedId:        id,
      action:           "UPDATE",
      resource:         "SafeguardingCase",
      resourceId:       id,
      metadata:         { status: CaseStatus.CLOSED, closedAt: new Date() },
    });

    return updated;
  }

  async deleteCase(id: string, actorId: string) {
    const existing = await prisma.safeguardingCase.findUnique({
      where:  { id },
      select: { childId: true, reportedById: true, incidentType: true, status: true },
    });

    // SafeguardingViewer has onDelete: Cascade — viewers cleaned up automatically
    const deleted = await prisma.safeguardingCase.delete({ where: { id } });

    await broadcastSafeguardingEvent({
      actorId,
      extraRecipientId: existing?.reportedById,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_DELETE,
      priority:         NotificationPriority.URGENT,
      title:            "Safeguarding case deleted",
      message:          `A safeguarding case (${existing?.incidentType ?? ""}) has been permanently deleted.`,
      relatedId:        id,
      action:           "DELETE",
      resource:         "SafeguardingCase",
      resourceId:       id,
      metadata: {
        incidentType: existing?.incidentType,
        status:       existing?.status,
      },
    });

    return deleted;
  }

  async revokeAccess(caseId: string, targetUserId: string, actorId: string) {
    const existing = await prisma.safeguardingCase.findUnique({
      where:  { id: caseId },
      select: { childId: true, reportedById: true, incidentType: true },
    });

    await prisma.safeguardingViewer.delete({
      where: {
        safeguardingCaseId_userId: {
          safeguardingCaseId: caseId,
          userId: targetUserId,
        },
      },
    });

    await broadcastSafeguardingEvent({
      actorId,
      extraRecipientId: existing?.reportedById,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         NotificationPriority.MEDIUM,
      title:            "Safeguarding case access revoked",
      message:          `A user's access to a safeguarding case was revoked.`,
      relatedId:        caseId,
      action:           "UPDATE",
      resource:         "SafeguardingCase",
      resourceId:       caseId,
      metadata:         { revokedUserId: targetUserId },
    });

    return prisma.safeguardingCase.findUnique({
      where:   { id: caseId },
      include: { authorizedViewers: { select: { userId: true, grantedAt: true } } },
    });
  }
}