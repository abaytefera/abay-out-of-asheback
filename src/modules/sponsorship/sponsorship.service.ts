import fs from "fs";
import { SponsorshipRepository } from "./sponsorship.repository";
import { AppError } from "./sponsorship.dto";
import { Prisma } from "@prisma/client";

export class SponsorshipService {
  private repository: SponsorshipRepository;

  constructor() {
    this.repository = new SponsorshipRepository();
  }

  async listSponsors(query: any) {
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 10;
    const skip  = (page - 1) * limit;

    const where: Prisma.SponsorWhereInput = {};
    if (query.search) {
      where.OR = [
        { firstName:    { contains: query.search } },
        { lastName:     { contains: query.search } },
        { email:        { contains: query.search } },
        { organization: { contains: query.search } },
      ];
    }
    if (query.country) where.country = query.country;

    const [total, data] = await Promise.all([
      this.repository.countSponsors(where),
      this.repository.findManySponsors(where, skip, limit),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getSponsorById(id: string) {
    const sponsor = await this.repository.findUniqueSponsorDetailed(id);
    if (!sponsor) throw new AppError("Sponsor not found", 404);
    return sponsor;
  }

  async registerSponsor(dto: any, actorId: string, files?: any[]) {
    if (dto.email) {
      const exists = await this.repository.findSponsorByEmail(dto.email);
      if (exists) throw new AppError("A sponsor with this email already exists", 409);
    }

    const sponsor = await this.repository.createSponsor(dto, actorId);

    if (files?.length) {
      const inputs = files.map((f) => ({
        sponsorId: sponsor.id,
        url:       f.path,
        publicId:  f.filename,
      }));
      await this.repository.batchCreateSponsorPhotos(inputs, actorId);
      return this.repository.findUniqueSponsorDetailed(sponsor.id);
    }

    return sponsor;
  }

  async updateSponsorDetails(id: string, dto: any, actorId: string) {
    const exists = await this.repository.findSponsorById(id);
    if (!exists) throw new AppError("Sponsor not found", 404);
    return this.repository.updateSponsor(id, dto, actorId);
  }

  async removeSponsor(id: string, actorId: string) {
    const sponsor = await this.repository.findUniqueSponsorDetailed(id);
    if (!sponsor) throw new AppError("Sponsor not found", 404);

    const hasActiveSponsorships = (sponsor.sponsorships || []).some((s: any) => s.isActive);
    if (hasActiveSponsorships) {
      throw new AppError(
        "Cannot delete a sponsor with active sponsorships. End all sponsorships first.",
        409
      );
    }

    for (const photo of sponsor.photos || []) {
      if (photo.url && fs.existsSync(photo.url)) {
        try { fs.unlinkSync(photo.url); }
        catch (err) { console.error(`Failed to delete local photo file at ${photo.url}:`, err); }
      }
    }

    return this.repository.deleteSponsorById(id, actorId, {
      firstName: sponsor.firstName,
      lastName:  sponsor.lastName,
      email:     sponsor.email ?? null,
    });
  }

  async initiateSponsorship(dto: any, actorId: string) {
    const [child, sponsor] = await Promise.all([
      this.repository.findChildMinimal(dto.childId),
      this.repository.findSponsorById(dto.sponsorId),
    ]);
    if (!child)   throw new AppError("Child not found", 404);
    if (!sponsor) throw new AppError("Sponsor not found", 404);

    return this.repository.createSponsorship({
      child:         { connect: { id: dto.childId } },
      sponsor:       { connect: { id: dto.sponsorId } },
      startDate:     dto.startDate ? new Date(dto.startDate) : new Date(),
      endDate:       dto.endDate   ? new Date(dto.endDate)   : null,
      monthlyAmount: dto.monthlyAmount ? parseFloat(dto.monthlyAmount) : null,
      isActive:      dto.isActive,
    }, actorId);
  }

  async concludeSponsorship(id: string, body: any, actorId: string) {
    const exists = await this.repository.findSponsorshipById(id);
    if (!exists) throw new AppError("Sponsorship not found", 404);

    return this.repository.updateSponsorship(id, {
      isActive: false,
      endDate:  body?.endDate ? new Date(body.endDate) : new Date(),
    }, actorId);
  }

  async fetchSponsorshipsByChild(childId: string) {
    return this.repository.findSponsorshipsByChildId(childId);
  }

  async attachDonorReport(sponsorshipId: string, body: any, actorId: string, files: any[] | undefined) {
    const sp = await this.repository.findSponsorshipById(sponsorshipId);
    if (!sp) throw new AppError("Sponsorship not found", 404);

    const payload = {
      sentDate:   body.sentDate ? new Date(body.sentDate) : new Date(),
      reportType: body.reportType || "Progress Report",
      notes:      body.notes,
    };

    const fileOperations = files?.length
      ? files.map((f) => ({ url: f.path, publicId: f.filename, fileName: f.originalname }))
      : [];

    return this.repository.createDonorReport(sponsorshipId, payload, fileOperations, actorId);
  }

  async removeDonorReportFile(fileId: string, actorId: string) {
    const f = await this.repository.findDonorReportFileById(fileId);
    if (!f) throw new AppError("File not found", 404);

    if (f.url && fs.existsSync(f.url)) {
      try { fs.unlinkSync(f.url); }
      catch (err) { console.error(`Failed to delete local report file at ${f.url}:`, err); }
    }
    await this.repository.deleteDonorReportFileById(fileId, actorId);
  }

  async addSponsorPhotos(sponsorId: string, actorId: string, files: any[] | undefined) {
    if (!files?.length) throw new AppError("No files uploaded", 400);

    const inputs = files.map((f) => ({
      sponsorId,
      url:      f.path,
      publicId: f.filename,
    }));

    return this.repository.batchCreateSponsorPhotos(inputs, actorId);
  }

  async removeSponsorPhoto(photoId: string, actorId: string) {
    const p = await this.repository.findSponsorPhotoById(photoId);
    if (!p) throw new AppError("Photo not found", 404);

    if (p.url && fs.existsSync(p.url)) {
      try { fs.unlinkSync(p.url); }
      catch (err) { console.error(`Failed to delete local photo file at ${p.url}:`, err); }
    }
    await this.repository.deleteSponsorPhotoById(photoId, actorId, p.sponsorId);
  }
}