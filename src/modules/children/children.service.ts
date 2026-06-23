import { ChildStatus, Gender, Prisma } from "@prisma/client";
import { ChildrenRepository } from "./children.repository";
import { AppError } from "../../utils/AppError";
import { parsePagination } from "../../utils/response";
import { CreateChildDto, UpdateChildDto } from "./children.schema";
import { promises as fsPromises } from "fs";
import fs from "fs";
import path from "path";
import prisma from "../../config/prisma";

// ─── Storage Paths ────────────────────────────────────────────────────────────
const PROFILE_DIR = path.join(process.cwd(), "uploads", "profiles");
const OTHER_DIR   = path.join(process.cwd(), "uploads", "other-records");

async function safeUnlink(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
    }
  } catch (err: any) {
    console.log("File cleanup skipped:", err.message);
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────
export class ChildrenService {
  private repository: ChildrenRepository;

  constructor() {
    this.repository = new ChildrenRepository();
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async create(
    dto: CreateChildDto,
    currentUserId: string,
    files?: { childPhotos?: Express.Multer.File[]; guardianPhotos?: Express.Multer.File[] }
  ) {
    let localPhotoPath: string | null = null;
    let fallbackPublicId = `local_disk_${Date.now()}`;

    if (files?.childPhotos && files.childPhotos.length > 0) {
      const f        = files.childPhotos[0];
      localPhotoPath   = `/uploads/profiles/${f.filename}`;
      fallbackPublicId = f.filename;
    }

    const childCount  = await this.repository.countRecords();
    const currentYear = new Date().getFullYear();
    let generatedCode = `CH-${currentYear}-${String(childCount + 1).padStart(4, "0")}`;

    let codeIsUnique = false;
    let attempts     = 0;
    while (!codeIsUnique && attempts < 5) {
      const exists = await this.repository.findByCode(generatedCode);
      if (!exists) {
        codeIsUnique = true;
      } else {
        attempts++;
        generatedCode = `CH-${currentYear}-${String(childCount + 1 + attempts).padStart(4, "0")}`;
      }
    }

    const explicitCode   = dto.child.childCode || generatedCode;
    const explicitExists = await this.repository.findByCode(explicitCode);
    if (explicitExists) throw new AppError(`Child code ${explicitCode} already exists`, 409);

    return this.repository.create(dto, explicitCode, localPhotoPath, fallbackPublicId);
  }

  // ── Find All (paginated + filtered + search by name) ─────────────────────────
  async findAll(query: {
  page?: string;
  limit?: string;
  search?: string;
  status?: ChildStatus;
  subCity?: string;
  gender?: Gender;
  // ── new ──
  hasSafeguardCase?: string;
  classRank?: string;
  academicYear?: string;
  avgScoreMin?: string;
  avgScoreMax?: string;
  hasVulnerableAssignment?: string;
  hasApprovedVulnerability?: string;
}) {
  const { page, limit, skip } = parsePagination(query);
  const where: Prisma.ChildWhereInput = {};

  // ── existing scalar filters ──────────────────────────────
  if (query.status)  where.status  = query.status;
  if (query.subCity) where.subCity = query.subCity;
  if (query.gender)  where.gender  = query.gender;

  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = [
      { firstName: { contains: term } },
      { lastName:  { contains: term } },
      { childCode: { contains: term } },
    ];
  }

  // ── safeguard: has at least one OPEN case ────────────────
  if (query.hasSafeguardCase === "true") {
    where.safeguardingCases = {
      some: { status: "OPEN" },
    };
  }

  // ── education: rank and/or year filter ──────────────────
  const hasRank  = !!query.classRank;
  const hasYear  = !!query.academicYear;
  const hasMin   = !!query.avgScoreMin;
  const hasMax   = !!query.avgScoreMax;

  if (hasRank || hasYear || hasMin || hasMax) {
    const recordFilter: Prisma.AcademicRecordWhereInput = {};

    if (hasRank)  recordFilter.rank         = Number(query.classRank);
    if (hasYear)  recordFilter.academicYear = query.academicYear;
    if (hasMin)   recordFilter.averageScore = {
      ...(recordFilter.averageScore as object | undefined),
      gte: Number(query.avgScoreMin),
    };
    if (hasMax)   recordFilter.averageScore = {
      ...(recordFilter.averageScore as object | undefined),
      lte: Number(query.avgScoreMax),
    };

    where.academicRecords = { some: recordFilter };
  }

  // ── vulnerability: has any assessment ───────────────────
  if (query.hasVulnerableAssignment === "true") {
    where.assessments = { some: {} };
  }

  // ── vulnerability: has an APPROVED assessment ────────────
  if (query.hasApprovedVulnerability === "true") {
    where.assessments = {
      some: { committeeDecision: "APPROVED" },
    };
  }

  const [children, total] = await this.repository.findAndCountAll(where, skip, limit);
  return { children, total, page, limit };
}

  // ── Find One ─────────────────────────────────────────────────────────────────
  async findById(id: string) {
    const child = await this.repository.findById(id);
    if (!child) throw new AppError("Child not found", 404);
    return child;
  }
  async getTrendStats() {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleString('default', { month: 'short' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end:   new Date(d.getFullYear(), d.getMonth() + 1, 1),
    };
  });

  const results = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const [active, graduated, atRisk, newAdmissions] = await Promise.all([
        // Children admitted before month-end and not yet exited by month-end
        prisma.child.count({
          where: {
            admissionDate: { lt: end },
            OR: [
              { exitDate: null },
              { exitDate: { gte: end } },
            ],
          },
        }),

        // Children whose status became GRADUATED within this month
        // (updatedAt is the best proxy since there's no statusChangedAt)
        prisma.child.count({
          where: {
            status:    'GRADUATED',
            updatedAt: { gte: start, lt: end },
          },
        }),

        // Active children with at least one OPEN safeguarding case
        prisma.child.count({
          where: {
            admissionDate: { lt: end },
            OR: [{ exitDate: null }, { exitDate: { gte: end } }],
            safeguardingCases: { some: { status: 'OPEN' } },
          },
        }),

        // Newly admitted this month
        prisma.child.count({
          where: {
            admissionDate: { gte: start, lt: end },
          },
        }),
      ]);

      return { month: label, active, graduated, atRisk, newAdmissions };
    })
  );

  return results;
}

  // ── Update ──────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateChildDto) {
    await this.findById(id);
    return this.repository.update(id, dto);
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async delete(id: string) {
    const child = await this.findById(id);

    for (const photo of child.photos) {
      if (photo.publicId) {
        await safeUnlink(path.join(PROFILE_DIR, photo.publicId));
      }
    }

    if ((child as any).otherFile) {
      for (const record of (child as any).otherFile) {
        for (const file of record.files || []) {
          if (file.publicId) {
            await safeUnlink(path.join(OTHER_DIR, file.publicId));
          }
        }
      }
    }

    await this.repository.deleteRecordAndPhotos(id);
  }

  // ── Dashboard Stats ──────────────────────────────────────────────────────────
  async getDashboardStats() {
    const [totalActive, byGender, byStatus, bySubCity] =
      await this.repository.getAggregatedStats();
    return { totalActive, byGender, byStatus, bySubCity };
  }

  // ── Upload Child Profile Photo ────────────────────────────────────────────────
  async uploadProfilePhoto(childId: string, file: Express.Multer.File, isPrimary = false) {
    await this.findById(childId);
    const url = `/uploads/profiles/${file.filename}`;
    return this.repository.addChildPhoto(childId, url, file.filename, isPrimary);
  }

  // ── Upload Guardian Photo ─────────────────────────────────────────────────────
  async uploadGuardianPhoto(childId: string, file: Express.Multer.File, isPrimary: boolean) {
    const child = await prisma.child.findUnique({
      where:   { id: childId },
      include: { household: { include: { guardians: true } } },
    });

    if (!child?.household?.guardians || child.household.guardians.length === 0) {
      throw new AppError("No guardian found associated with this child's household.", 404);
    }

    const guardianId = child.household.guardians[0].id;
    const url        = `/uploads/profiles/${file.filename}`;
    return this.repository.addGuardianPhoto(guardianId, url, file.filename, isPrimary);
  }

  // ── Delete Profile Photo ─────────────────────────────────────────────────────
  async deleteProfilePhoto(childId: string, publicId: string, type: "child" | "parent") {
    const filePath = path.join(PROFILE_DIR, publicId);
    try {
      await fsPromises.rm(filePath, { force: true });
    } catch (err) {
      console.error("Local file deletion failed:", err);
    }

    if (type === "child") {
      return this.repository.removeChildPhotoByPublicId(publicId);
    }

    const child = await prisma.child.findUnique({
      where:   { id: childId },
      include: { household: { include: { guardians: true } } },
    });
    const guardianId = child?.household?.guardians?.[0]?.id;
    if (!guardianId) throw new AppError("Guardian not found for this child.", 404);
    return this.repository.removeGuardianPhotoByPublicId(guardianId, publicId);
  }

  // ── Other Records ──────────────────────────────────────────────────────────

  async createOtherRecord(
    childId: string,
    title: string,
    description: string,
    files: Express.Multer.File[]
  ) {
    await this.findById(childId);
    const filePayloads = files.map((f) => ({
      url:      `/uploads/other-records/${f.filename}`,
      publicId: f.filename,
    }));
    return this.repository.createOtherRecord(childId, title, description, filePayloads);
  }

  async updateOtherRecord(recordId: string, title: string, description: string) {
    const record = await this.repository.findOtherRecordById(recordId);
    if (!record) throw new AppError("Other record not found", 404);
    return this.repository.updateOtherRecord(recordId, title, description);
  }

  async deleteOtherRecord(recordId: string) {
    const record = await this.repository.findOtherRecordById(recordId);
    if (!record) throw new AppError("Other record not found", 404);
    for (const file of record.files) {
      if (file.publicId) await safeUnlink(path.join(OTHER_DIR, file.publicId));
    }
    return this.repository.deleteOtherRecord(recordId);
  }

  async deleteOtherRecordFile(publicId: string) {
    await safeUnlink(path.join(OTHER_DIR, publicId));
    return this.repository.removeOtherRecordFile(publicId);
  }

  async uploadOtherRecordFiles(
    childId: string,
    recordId: string,
    files: Express.Multer.File[]
  ) {
    await this.findById(childId);
    const record = await this.repository.findOtherRecordById(recordId);
    if (!record) throw new AppError("Other record not found", 404);
    const filePayloads = files.map((f) => ({
      url:      `/uploads/other-records/${f.filename}`,
      publicId: f.filename,
    }));
    return this.repository.addFilesToOtherRecord(recordId, filePayloads);
  }
}

export default new ChildrenService();