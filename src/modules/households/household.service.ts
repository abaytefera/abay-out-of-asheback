import { Prisma } from "@prisma/client";
import { HouseholdRepository } from "./household.repository";
import { AppError } from "../../utils/AppError";
import { parsePagination } from "../../utils/response";
import { HouseholdCreateInput, HouseholdUpdateInput, GuardianCreateInput, GuardianUpdateInput } from "./household.dto";

export class HouseholdService {
  private repository: HouseholdRepository;

  constructor() {
    this.repository = new HouseholdRepository();
  }

  async createHousehold(dto: HouseholdCreateInput) {
    const exists = await this.repository.findUniqueByCode(dto.householdCode);
    if (exists) throw new AppError("Household code already exists", 409);
    return this.repository.create(dto);
  }

  async findAllHouseholds(query: { page?: string; limit?: string; search?: string; subCity?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.HouseholdWhereInput = {};

    if (query.subCity) where.subCity = query.subCity;
    if (query.search) {
      where.OR = [
        { householdCode: { contains: query.search } },
        { address: { contains: query.search } },
      ];
    }

    const [households, total] = await this.repository.findManyWithPagination(where, skip, limit);
    return { households, total, page, limit };
  }

  async getHouseholdById(id: string) {
    const household = await this.repository.findUniqueDetailed(id);
    if (!household) throw new AppError("Household not found", 404);
    return household;
  }

  async updateHousehold(id: string, dto: HouseholdUpdateInput) {
    return this.repository.update(id, dto);
  }

  async addGuardianToHousehold(householdId: string, dto: GuardianCreateInput) {
    return this.repository.createGuardian(householdId, dto);
  }

  async updateHouseholdGuardian(householdId: string, guardianId: string, dto: GuardianUpdateInput) {
    return this.repository.updateGuardianWithinBoundary(householdId, guardianId, dto);
  }

  async removeHouseholdGuardian(householdId: string, guardianId: string) {
    return this.repository.deleteGuardianWithinBoundary(householdId, guardianId);
  }
}