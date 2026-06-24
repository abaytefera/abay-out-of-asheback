// ============================================================
// services/school.service.ts
// ============================================================
import { PrismaClient, SchoolWon } from "@prisma/client";
import prisma from "../../config/prisma";
import {
  CreateSchoolDto,
  UpdateSchoolDto,
  SchoolListQuery,
} from "./schoolTypes";

 

 
export class SchoolService {
  // ── CREATE ────────────────────────────────────────────────
  async createSchool(dto: CreateSchoolDto) {
    // Prevent duplicates (same name + type)
    const existing = await prisma.schoolname.findFirst({
      where: {
        name: { equals: dto.name.trim() },
        type: dto.type,
      },
    });
 
    if (existing) {
      throw new Error(
        `A ${dto.type.toLowerCase()} school named "${dto.name}" already exists.`
      );
    }
 
    const school = await prisma.schoolname.create({
      data: {
        name: dto.name.trim(),
        type: dto.type,
      },
    });
 
    return school;
  }
 
  // ── GET ALL (with optional filter) ───────────────────────
  async getAllSchools(query: SchoolListQuery) {
    const { search, type } = query;
 
    const schools = await prisma.schoolname.findMany({
      where: {
        ...(search
          ? { name: { contains: search } }
          : {}),
        ...(type && type !== "ALL"
          ? { type: type as SchoolWon }
          : {}),
      },
      orderBy: { name: "asc" },
    });
 
    return schools;
  }
 
  // ── GET BY ID ─────────────────────────────────────────────
  async getSchoolById(id: string) {
    const school = await prisma.schoolname.findUnique({ where: { id } });
    if (!school) throw new Error("School not found.");
    return school;
  }
 
  // ── UPDATE ────────────────────────────────────────────────
  async updateSchool(id: string, dto: UpdateSchoolDto) {
    await this.getSchoolById(id); // throws if not found
 
    if (dto.name || dto.type) {
      const existing = await prisma.schoolname.findFirst({
        where: {
          name: { equals: dto.name?.trim() },
          type: dto.type,
          NOT: { id },
        },
      });
      if (existing) {
        throw new Error(
          `Another school with the same name and type already exists.`
        );
      }
    }
 
    const updated = await prisma.schoolname.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.type ? { type: dto.type } : {}),
      },
    });
 
    return updated;
  }
 
  // ── DELETE ────────────────────────────────────────────────
  async deleteSchool(id: string) {
    await this.getSchoolById(id); // throws if not found
    await prisma.schoolname.delete({ where: { id } });
    return { message: "School deleted successfully." };
  }
 
  // ── DROPDOWN (lightweight, id + name + type only) ─────────
  async getSchoolsForDropdown() {
    return prisma.schoolname.findMany({
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    });
  }
}
 