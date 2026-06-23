import { Prisma, NotificationType, NotificationPriority, UserRole } from "@prisma/client";
import prisma from "../../config/prisma";

// ─── Shared broadcast helper ──────────────────────────────────────────────────
//
// Writes BOTH a Notification AND an AuditLog row for every recipient in the
// deduplicated set: all active ADMINs + all active COUNTRY_DIRECTORs + the actor.

interface BroadcastParams {
  actorId: string;
  childId?: string | null;
  notificationType: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType: string;
  relatedId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "READ";
  resource: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

async function broadcastSponsorshipEvent(params: BroadcastParams): Promise<void> {
  const privileged = await prisma.user.findMany({
    where: { role: { in: [UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR] }, isActive: true },
    select: { id: true },
  });

  const recipientIds = Array.from(
    new Set([...privileged.map((u) => u.id), params.actorId])
  );

  await prisma.$transaction([
    prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type:       params.notificationType,
        priority:   params.priority,
        title:      params.title,
        message:    params.message,
        entityType: params.entityType,
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

export class SponsorshipRepository {

  // ── Sponsor reads ─────────────────────────────────────────────────────────

  async countSponsors(where: Prisma.SponsorWhereInput) {
    return prisma.sponsor.count({ where });
  }

  async findManySponsors(where: Prisma.SponsorWhereInput, skip: number, take: number) {
    return prisma.sponsor.findMany({
      where,
      skip,
      take,
      orderBy: { firstName: "asc" },
      include: {
        photos: true,
        sponsorships: {
          include: {
            child: {
              select: {
                id: true, childCode: true,
                firstName: true, lastName: true,
                status: true, gender: true,
                photos:               { where: { isPrimary: true }, take: 1 },
                academicRecords:      { select: { id: true }, take: 1 },
                nutritionRecords:     { select: { id: true }, take: 1 },
                vaccinations:         { select: { id: true }, take: 1 },
                homeVisits:           { select: { id: true }, take: 1 },
                financialSupports:    { select: { id: true }, take: 1 },
                psychosocialSessions: { select: { id: true }, take: 1 },
              },
            },
            donorReports: {
              include: { files: true },
              orderBy: { sentDate: "desc" },
            },
          },
          orderBy: { startDate: "desc" },
        },
      },
    });
  }

  async findUniqueSponsorDetailed(id: string) {
    return prisma.sponsor.findUnique({
      where: { id },
      include: {
        photos: true,
        sponsorships: {
          include: {
            child: {
              select: {
                id: true, childCode: true, firstName: true, lastName: true,
                status: true, gender: true,
                dateOfBirth: true, nationality: true, religion: true,
                subCity: true, kebele: true, schoolName: true, notes: true,
                photos: true,
                academicRecords: {
                  include: { alerts: true },
                  orderBy: { academicYear: "desc" },
                },
                nutritionRecords:  { orderBy: { recordDate: "desc" } },
                vaccinations:      { orderBy: { dateGiven: "desc" } },
                homeVisits: {
                  include: { staff: { select: { firstName: true, lastName: true } } },
                  orderBy: { visitDate: "desc" },
                },
                financialSupports: { orderBy: { disbursedDate: "desc" } },
                psychosocialSessions: {
                  include: { counselor: { select: { firstName: true, lastName: true } } },
                  orderBy: { sessionDate: "desc" },
                },
              },
            },
            donorReports: {
              include: { files: true },
              orderBy: { sentDate: "desc" },
            },
          },
          orderBy: { startDate: "desc" },
        },
      },
    });
  }

  async findSponsorByEmail(email: string) {
    return prisma.sponsor.findUnique({ where: { email } });
  }

  async findSponsorById(id: string) {
    return prisma.sponsor.findUnique({ where: { id } });
  }

  // ── Sponsor mutations ─────────────────────────────────────────────────────

  async createSponsor(data: Prisma.SponsorCreateInput, actorId: string) {
    const sponsor = await prisma.sponsor.create({ data });

    await broadcastSponsorshipEvent({
      actorId,
      notificationType: NotificationType.DATA_CREATE,
      priority:         NotificationPriority.LOW,
      title:            "New sponsor registered",
      message:          `A new sponsor (${data.firstName} ${data.lastName}) has been registered.`,
      entityType:       "Sponsor",
      relatedId:        sponsor.id,
      action:           "CREATE",
      resource:         "Sponsor",
      resourceId:       sponsor.id,
      metadata: {
        firstName:    data.firstName,
        lastName:     data.lastName,
        email:        (data.email as string) ?? null,
        organization: (data.organization as string) ?? null,
      },
    });

    return sponsor;
  }

  async updateSponsor(id: string, data: Prisma.SponsorUpdateInput, actorId: string) {
    const updated = await prisma.sponsor.update({ where: { id }, data });

    await broadcastSponsorshipEvent({
      actorId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         NotificationPriority.LOW,
      title:            "Sponsor details updated",
      message:          `Sponsor record has been updated.`,
      entityType:       "Sponsor",
      relatedId:        id,
      action:           "UPDATE",
      resource:         "Sponsor",
      resourceId:       id,
      metadata:         { changes: data },
    });

    return updated;
  }

  async deleteSponsorById(id: string, actorId: string, meta?: Record<string, unknown>) {
    const deleted = await prisma.sponsor.delete({ where: { id } });

    await broadcastSponsorshipEvent({
      actorId,
      notificationType: NotificationType.DATA_DELETE,
      priority:         NotificationPriority.HIGH,
      title:            "Sponsor deleted",
      message:          `A sponsor record has been permanently deleted.`,
      entityType:       "Sponsor",
      relatedId:        id,
      action:           "DELETE",
      resource:         "Sponsor",
      resourceId:       id,
      metadata:         meta ?? {},
    });

    return deleted;
  }

  // ── Sponsor photos ────────────────────────────────────────────────────────

  async batchCreateSponsorPhotos(
    operations: Prisma.SponsorPhotoUncheckedCreateInput[],
    actorId: string
  ) {
    const created = await prisma.$transaction(
      operations.map((data) => prisma.sponsorPhoto.create({ data }))
    );

    if (created.length > 0) {
      const sponsorId = operations[0].sponsorId as string;
      await broadcastSponsorshipEvent({
        actorId,
        notificationType: NotificationType.DATA_CREATE,
        priority:         NotificationPriority.LOW,
        title:            "Sponsor photos uploaded",
        message:          `${created.length} photo(s) were added to a sponsor profile.`,
        entityType:       "SponsorPhoto",
        relatedId:        sponsorId,
        action:           "CREATE",
        resource:         "SponsorPhoto",
        resourceId:       sponsorId,
        metadata:         { count: created.length },
      });
    }

    return created;
  }

  async findSponsorPhotoById(id: string) {
    return prisma.sponsorPhoto.findUnique({ where: { id } });
  }

  async deleteSponsorPhotoById(id: string, actorId: string, sponsorId?: string) {
    const deleted = await prisma.sponsorPhoto.delete({ where: { id } });

    await broadcastSponsorshipEvent({
      actorId,
      notificationType: NotificationType.DATA_DELETE,
      priority:         NotificationPriority.LOW,
      title:            "Sponsor photo deleted",
      message:          `A sponsor photo has been permanently deleted.`,
      entityType:       "SponsorPhoto",
      relatedId:        id,
      action:           "DELETE",
      resource:         "SponsorPhoto",
      resourceId:       id,
      metadata:         { sponsorId: sponsorId ?? null },
    });

    return deleted;
  }

  // ── Sponsorships ──────────────────────────────────────────────────────────

  async findChildMinimal(id: string) {
    return prisma.child.findUnique({ where: { id }, select: { id: true, firstName: true } });
  }

  async createSponsorship(data: Prisma.SponsorshipCreateInput, actorId: string) {
    const sponsorship = await prisma.sponsorship.create({
      data,
      include: {
        sponsor: true,
        child: { select: { id: true, childCode: true, firstName: true, lastName: true } },
      },
    });

    await broadcastSponsorshipEvent({
      actorId,
      childId:          sponsorship.childId,
      notificationType: NotificationType.DATA_CREATE,
      priority:         NotificationPriority.MEDIUM,
      title:            "New sponsorship initiated",
      message:          `A new sponsorship has been created for ${sponsorship.child.firstName} ${sponsorship.child.lastName}.`,
      entityType:       "Sponsorship",
      relatedId:        sponsorship.id,
      action:           "CREATE",
      resource:         "Sponsorship",
      resourceId:       sponsorship.id,
      metadata: {
        childId:       sponsorship.childId,
        sponsorId:     sponsorship.sponsorId,
        monthlyAmount: sponsorship.monthlyAmount,
        startDate:     sponsorship.startDate,
      },
    });

    return sponsorship;
  }

  async findSponsorshipById(id: string) {
    return prisma.sponsorship.findUnique({ where: { id } });
  }

  async updateSponsorship(id: string, data: Prisma.SponsorshipUpdateInput, actorId: string) {
    const existing = await prisma.sponsorship.findUnique({ where: { id } });
    const updated  = await prisma.sponsorship.update({ where: { id }, data });

    const isEnding = data.isActive === false;
    await broadcastSponsorshipEvent({
      actorId,
      childId:          existing?.childId,
      notificationType: NotificationType.DATA_UPDATE,
      priority:         isEnding ? NotificationPriority.MEDIUM : NotificationPriority.LOW,
      title:            isEnding ? "Sponsorship ended" : "Sponsorship updated",
      message:          isEnding
        ? `A sponsorship has been concluded.`
        : `A sponsorship record has been updated.`,
      entityType:       "Sponsorship",
      relatedId:        id,
      action:           "UPDATE",
      resource:         "Sponsorship",
      resourceId:       id,
      metadata:         { changes: data, childId: existing?.childId },
    });

    return updated;
  }

  async findSponsorshipsByChildId(childId: string) {
    return prisma.sponsorship.findMany({
      where:   { childId },
      orderBy: { startDate: "desc" },
      include: {
        sponsor: { include: { photos: true } },
        donorReports: {
          include: { files: true },
          orderBy: { sentDate: "desc" },
        },
      },
    });
  }

  // ── Donor reports ─────────────────────────────────────────────────────────

  async createDonorReport(
    sponsorshipId: string,
    data: any,
    files: any[],
    actorId: string
  ) {
    const report = await prisma.donorReport.create({
      data: {
        sponsorshipId,
        sentDate:   data.sentDate,
        reportType: data.reportType,
        notes:      data.notes,
        files: files.length ? { create: files } : undefined,
      },
      include: { files: true },
    });

    const sponsorship = await prisma.sponsorship.findUnique({
      where:  { id: sponsorshipId },
      select: { childId: true },
    });

    await broadcastSponsorshipEvent({
      actorId,
      childId:          sponsorship?.childId,
      notificationType: NotificationType.DATA_CREATE,
      priority:         NotificationPriority.LOW,
      title:            "Donor report attached",
      message:          `A new ${data.reportType} donor report has been attached to a sponsorship.`,
      entityType:       "DonorReport",
      relatedId:        report.id,
      action:           "CREATE",
      resource:         "DonorReport",
      resourceId:       report.id,
      metadata: {
        sponsorshipId,
        reportType: data.reportType,
        fileCount:  files.length,
      },
    });

    return report;
  }

  async findDonorReportFileById(id: string) {
    return prisma.donorReportFile.findUnique({ where: { id } });
  }

  async deleteDonorReportFileById(id: string, actorId: string) {
    const file = await prisma.donorReportFile.findUnique({
      where:   { id },
      include: { donorReport: { select: { sponsorshipId: true } } },
    });

    const deleted = await prisma.donorReportFile.delete({ where: { id } });

    await broadcastSponsorshipEvent({
      actorId,
      notificationType: NotificationType.DATA_DELETE,
      priority:         NotificationPriority.LOW,
      title:            "Donor report file deleted",
      message:          `A file was removed from a donor report.`,
      entityType:       "DonorReportFile",
      relatedId:        id,
      action:           "DELETE",
      resource:         "DonorReportFile",
      resourceId:       id,
      metadata:         { sponsorshipId: file?.donorReport?.sponsorshipId ?? null },
    });

    return deleted;
  }
}