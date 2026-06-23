import {
  Prisma,
  ChildStatus,
  Gender,
  HousingCondition,
  WaterAccess,
  SanitationAccess,
} from "@prisma/client";
import prisma from "../../config/prisma";
import { CreateChildDto, UpdateChildDto } from "./children.schema";

// ─── Default Select ───────────────────────────────────────────────────────────
// Used for list queries — keeps the payload lean.
// findById uses a full `include` instead.

export const DEFAULT_SELECT: Prisma.ChildSelect = {
  id:                    true,
  childCode:             true,
  firstName:             true,
  lastName:              true,
  dateOfBirth:           true,
  gender:                true,
  status:                true,
  subCity:               true,
  admissionDate:         true,
  exitDate:              true,
  schoolName:            true,
  emergencyContactName:  true,
  emergencyContactPhone: true,
  createdAt:             true,
  updatedAt:             true,
  // ✅ Only return the primary photo so the search result card can show it
  photos: {
    
    take:   1,
    select: { url: true, publicId: true },
  },
  household: {
    select: {
      id:                true,
      householdCode:     true,
      subCity:           true,
      address:           true,
      kebele:            true,
      housingCondition:  true,
      waterAccess:       true,
      sanitationAccess:  true,
      hasDisabledMember: true,
      numberOfMembers:   true,
    },
  },
};

// ─── Repository ───────────────────────────────────────────────────────────────

export class ChildrenRepository {

  // ── Core Count / Lookup ──────────────────────────────────────────────────────

  async countRecords(where?: Prisma.ChildWhereInput): Promise<number> {
    return prisma.child.count({ where });
  }

  async findByCode(childCode: string) {
    return prisma.child.findUnique({ where: { childCode } });
  }

  // Full detail — used by findOne, update, delete
  async findById(id: string) {
    return prisma.child.findUnique({
      where: { id },
      include: {
        photos: true,
        household: {
          include: {
            guardians: { include: { photos: true } },
          },
        },
        // ✅ FIX: relation is named `otherFile` in the Prisma schema, not `otherRecords`
        otherFile: {
          include:  { files: true },
          orderBy:  { createdAt: "desc" },
        },
      },
    });
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  async create(
    dto: CreateChildDto,
    explicitCode: string,
    localPhotoPath: string | null,
    fallbackPublicId: string
  ) {
    const { child: childData, household: householdData, guardian: guardianData } = dto;

    const prismaData: Prisma.ChildCreateInput = {
      firstName:             childData.firstName,
      lastName:              childData.lastName,
      childCode:             explicitCode,
      dateOfBirth:           new Date(childData.dateOfBirth),
      admissionDate:         new Date(childData.admissionDate),
      gender:                childData.gender as Gender,
      nationality:           childData.nationality           || null,
      religion:              childData.religion              || null,
      subCity:               childData.subCity               || null,
      kebele:                childData.kebele                || null,
      schoolName:            childData.schoolName            || null,
      emergencyContactName:  childData.emergencyContactName  || null,
      emergencyContactPhone: childData.emergencyContactPhone || null,
      notes:                 childData.notes                 || null,

      ...(localPhotoPath && {
        photos: {
          create: {
            url:       localPhotoPath,
            publicId:  fallbackPublicId,
            isPrimary: true,
          },
        },
      }),
    };

    if (householdData?.householdCode) {
      prismaData.household = {
        connectOrCreate: {
          where:  { householdCode: householdData.householdCode },
          create: {
            householdCode:     householdData.householdCode,
            address:           householdData.address           || null,
            subCity:           householdData.subCity           || null,
            kebele:            householdData.kebele            || null,
            housingCondition:  householdData.housingCondition  as HousingCondition,
            waterAccess:       householdData.waterAccess       as WaterAccess,
            sanitationAccess:  householdData.sanitationAccess  as SanitationAccess,
            numberOfMembers:   householdData.numberOfMembers,
            hasDisabledMember: householdData.hasDisabledMember,

            ...(guardianData && {
              guardians: {
                create: [{
                  firstName:          guardianData.firstName,
                  lastName:           guardianData.lastName,
                  relationship:       guardianData.relationship,
                  phone:              guardianData.phone,
                  email:              guardianData.email          || null,
                  occupation:         guardianData.occupation     || null,
                  educationLevel:     guardianData.educationLevel || null,
                  maritalStatus:      guardianData.maritalStatus  as any,
                  incomeRange:        guardianData.incomeRange    as any,
                  isEmergencyContact: guardianData.isEmergencyContact,
                }],
              },
            }),
          },
        },
      };
    }

    return prisma.child.create({ data: prismaData, select: DEFAULT_SELECT });
  }

  // ── Find Many ────────────────────────────────────────────────────────────────

  async findAndCountAll(
    filters: Prisma.ChildWhereInput,
    skip: number,
    limit: number
  ) {
    return prisma.$transaction([
      prisma.child.findMany({
        where:   filters,
        skip,
        take:    limit,
        select:  DEFAULT_SELECT,
        orderBy: { admissionDate: "desc" },
      }),
      prisma.child.count({ where: filters }),
    ]);
  }

  // ── Update (child fields + household + first guardian) ───────────────────────

  async update(id: string, dto: UpdateChildDto) {
    const { child: childData, household: householdData, guardian: guardianData } = dto;
    const dataToUpdate: Prisma.ChildUpdateInput = {};

    // ── Child scalar fields ──
    if (childData) {
      const { dateOfBirth, admissionDate, exitDate, ...rest } = childData;
      Object.assign(dataToUpdate, rest);
      if (dateOfBirth)   dataToUpdate.dateOfBirth   = new Date(dateOfBirth);
      if (admissionDate) dataToUpdate.admissionDate = new Date(admissionDate);
      if (exitDate)      dataToUpdate.exitDate       = new Date(exitDate as string);
    }

    // ── Household scalar fields ──
    if (householdData?.householdCode) {
      dataToUpdate.household = {
        update: {
          data: {
            householdCode:     householdData.householdCode,
            address:           householdData.address,
            subCity:           householdData.subCity,
            kebele:            householdData.kebele,
            housingCondition:  householdData.housingCondition as HousingCondition,
            waterAccess:       householdData.waterAccess      as WaterAccess,
            sanitationAccess:  householdData.sanitationAccess as SanitationAccess,
            numberOfMembers:   householdData.numberOfMembers  ?? undefined,
            hasDisabledMember: householdData.hasDisabledMember,
          },
        },
      };
    }

    // ── First guardian ──
    if (guardianData) {
      const child = await prisma.child.findUnique({
        where:   { id },
        include: {
          household: {
            include: { guardians: { take: 1, orderBy: { createdAt: "asc" } } },
          },
        },
      });

      const firstGuardian = child?.household?.guardians?.[0];

      if (firstGuardian) {
        await prisma.guardian.update({
          where: { id: firstGuardian.id },
          data: {
            firstName:          guardianData.firstName          ?? undefined,
            lastName:           guardianData.lastName           ?? undefined,
            relationship:       guardianData.relationship       ?? undefined,
            phone:              guardianData.phone              ?? undefined,
            email:              guardianData.email              ?? undefined,
            occupation:         guardianData.occupation         ?? undefined,
            educationLevel:     guardianData.educationLevel     ?? undefined,
            maritalStatus:      (guardianData.maritalStatus     as any) ?? undefined,
            incomeRange:        (guardianData.incomeRange       as any) ?? undefined,
            isEmergencyContact: guardianData.isEmergencyContact ?? undefined,
          },
        });
      }
    }

    return prisma.child.update({
      where:  { id },
      data:   dataToUpdate,
      select: DEFAULT_SELECT,
    });
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async deleteRecordAndPhotos(id: string) {
    // Delete other-record files first, then the records, then photos, then the child
    const otherRecords = await prisma.childOtherRecord.findMany({
      where:  { childId: id },
      select: { id: true },
    });

    for (const record of otherRecords) {
      await prisma.childOtherRecordFile.deleteMany({ where: { recordId: record.id } });
    }

    await prisma.childOtherRecord.deleteMany({ where: { childId: id } });
    await prisma.childPhoto.deleteMany({ where: { childId: id } });
    await prisma.child.delete({ where: { id } });
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getAggregatedStats() {
    return prisma.$transaction([
      prisma.child.count({ where: { status: "ACTIVE" } }),
      prisma.child.groupBy({
        by:      ["gender"],
        _count:  { gender: true },
        where:   { status: "ACTIVE" },
        orderBy: { gender: "asc" },
      }),
      prisma.child.groupBy({
        by:      ["status"],
        _count:  { status: true },
        orderBy: { status: "asc" },
      }),
      prisma.child.groupBy({
        by:      ["subCity"],
        _count:  { subCity: true },
        where:   { status: "ACTIVE" },
        orderBy: { subCity: "asc" },
      }),
    ]);
  }

  // ── Profile Photos ───────────────────────────────────────────────────────────

  async addChildPhoto(childId: string, url: string, publicId: string, isPrimary = false) {
    return prisma.childPhoto.create({
      data: { childId, url, publicId, isPrimary },
    });
  }

  async addGuardianPhoto(
    guardianId: string,
    url: string,
    publicId: string,
    isPrimary: boolean
  ) {
    return prisma.parentPhoto.create({
      data: { guardianId, url, publicId, isPrimary },
    });
  }

  async removeChildPhotoByPublicId(publicId: string) {
    return prisma.childPhoto.deleteMany({ where: { publicId } });
  }

  async removeGuardianPhotoByPublicId(guardianId: string, publicId: string) {
    return prisma.parentPhoto.deleteMany({
      where: { guardianId, publicId },
    });
  }

  // ── Other Records ────────────────────────────────────────────────────────────

  async createOtherRecord(
    childId: string,
    title: string,
    description: string,
    files: { url: string; publicId: string }[]
  ) {
    return prisma.childOtherRecord.create({
      data: {
        childId,
        title,
        description,
        files: {
          create: files.map((f) => ({ url: f.url, publicId: f.publicId })),
        },
      },
      include: { files: true },
    });
  }

  async findOtherRecordById(recordId: string) {
    return prisma.childOtherRecord.findUnique({
      where:   { id: recordId },
      include: { files: true },
    });
  }

  async updateOtherRecord(recordId: string, title: string, description: string) {
    return prisma.childOtherRecord.update({
      where:   { id: recordId },
      data:    { title, description },
      include: { files: true },
    });
  }

  async deleteOtherRecord(recordId: string) {
    await prisma.childOtherRecordFile.deleteMany({ where: { recordId } });
    return prisma.childOtherRecord.delete({ where: { id: recordId } });
  }

  async removeOtherRecordFile(publicId: string) {
    return prisma.childOtherRecordFile.deleteMany({ where: { publicId } });
  }

  async addFilesToOtherRecord(
    recordId: string,
    files: { url: string; publicId: string }[]
  ) {
    return prisma.childOtherRecord.update({
      where: { id: recordId },
      data: {
        files: {
          create: files.map((f) => ({ url: f.url, publicId: f.publicId })),
        },
      },
      include: { files: true },
    });
  }
}