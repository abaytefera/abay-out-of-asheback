import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { HouseholdCreateInput, HouseholdUpdateInput, GuardianCreateInput, GuardianUpdateInput } from "./household.dto";

export class HouseholdRepository {
  async findUniqueByCode(householdCode: string) {
    return prisma.household.findUnique({ where: { householdCode } });
  }

  async create(data: HouseholdCreateInput) {
    return prisma.household.create({
      data,
      include: { guardians: true, incomeSources: true }
    });
  }

  async findManyWithPagination(where: Prisma.HouseholdWhereInput, skip: number, take: number) {
    return prisma.$transaction([
      prisma.household.findMany({
        where,
        skip,
        take,
        include: { guardians: true, _count: { select: { children: true } } },
        orderBy: { householdCode: "asc" }
      }),
      prisma.household.count({ where }),
    ]);
  }

  async findUniqueDetailed(id: string) {
    return prisma.household.findUnique({
      where: { id },
      include: {
        guardians: true,
        incomeSources: true,
        children: { select: { id: true, childCode: true, firstName: true, lastName: true, status: true } }
      },
    });
  }

  async update(id: string, data: HouseholdUpdateInput) {
    try {
      return await prisma.household.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError("Household not found for update", 404);
      }
      throw error;
    }
  }

  async createGuardian(householdId: string, data: GuardianCreateInput) {
    try {
      return await prisma.guardian.create({ data: { householdId, ...data } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError("Target Household does not exist", 404);
      }
      throw error;
    }
  }

  async updateGuardianWithinBoundary(householdId: string, guardianId: string, data: GuardianUpdateInput) {
    try {
      return await prisma.guardian.update({
        where: { id: guardianId, householdId },
        data
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError("Guardian record not found under this household", 404);
      }
      throw error;
    }
  }

  async deleteGuardianWithinBoundary(householdId: string, guardianId: string) {
    try {
      return await prisma.guardian.delete({
        where: { id: guardianId, householdId }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError("Guardian record not found under this household", 404);
      }
      throw error;
    }
  }
}