import { Prisma, CaseStatus, UserRole } from "@prisma/client";
import { SafeguardingRepository } from "./safeguarding.repository";
import { AppError } from "../../utils/AppError";
import { parsePagination } from "../../utils/response";
import { CaseCreateInput, CaseUpdateInput, SAFEGUARDING_ROLES } from "./safeguarding.dto";

export class SafeguardingService {
  private repository: SafeguardingRepository;

  constructor() {
    this.repository = new SafeguardingRepository();
  }

  private assertAccess(
    userId: string,
    role: UserRole,
    reportedById: string | null,
    authorizedViewers: { userId: string }[],
  ) {
    if (SAFEGUARDING_ROLES.includes(role)) return;
    const hasExplicitAccess = authorizedViewers.some((v) => v.userId === userId);
    const isReporter = reportedById !== null && reportedById === userId;
    if (!isReporter && !hasExplicitAccess) {
      throw new AppError("Access denied to this safeguarding case", 403);
    }
  }

  async createCase(dto: CaseCreateInput, actorId: string) {
    const childExists = await this.repository.findChildById(dto.childId);
    if (!childExists) throw new AppError("Target child record does not exist", 404);
    return this.repository.createCase(dto, actorId);
  }

  async findAllCases(
    query: { page?: string; limit?: string; status?: CaseStatus },
    userId: string,
    role: UserRole,
  ) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.SafeguardingCaseWhereInput = {};

    if (query.status) where.status = query.status;

    if (!SAFEGUARDING_ROLES.includes(role)) {
      where.OR = [
        { reportedById: userId },
        { authorizedViewers: { some: { userId } } },
      ];
    }

    const [cases, total] = await this.repository.findManyWithPagination(where, skip, limit);
    return { cases, total, page, limit };
  }

  async getCaseById(id: string, userId: string, role: UserRole) {
    const record = await this.repository.findUniqueDetailed(id);
    if (!record) throw new AppError("Case record not found", 404);
    this.assertAccess(userId, role, record.reportedById, record.authorizedViewers);
    return record;
  }

  async updateCase(id: string, dto: CaseUpdateInput, actorId: string, role: UserRole) {
    await this.getCaseById(id, actorId, role);

    const { status, incidentDate, ...rest } = dto;

    const data: Prisma.SafeguardingCaseUpdateInput = {
      ...rest,
      ...(status       && { status: status as CaseStatus }),
      ...(incidentDate && { incidentDate: new Date(incidentDate) }),
    };

    return this.repository.updateCase(id, data, actorId);
  }

  async closeCase(id: string, actorId: string, role: UserRole) {
    const currentCase = await this.getCaseById(id, actorId, role);
    if (currentCase.status === CaseStatus.CLOSED) {
      throw new AppError("This case has already been resolved and closed", 400);
    }
    return this.repository.closeCase(id, actorId);
  }

  async deleteCase(id: string, actorId: string, role: UserRole) {
    if (!SAFEGUARDING_ROLES.includes(role)) {
      throw new AppError("Insufficient privileges to delete safeguarding records", 403);
    }
    const record = await this.repository.findUniqueDetailed(id);
    if (!record) throw new AppError("Case record not found", 404);
    return this.repository.deleteCase(id, actorId);
  }

  async grantAccess(
    caseId: string,
    targetUserId: string,
    actorId: string,
    role: UserRole,
  ) {
    const currentCase = await this.getCaseById(caseId, actorId, role);

    if (currentCase.authorizedViewers.some((v) => v.userId === targetUserId)) {
      return currentCase;
    }

    const targetUserExists = await this.repository.findUserById(targetUserId);
    if (!targetUserExists) throw new AppError("Target user for access grant not found", 404);

    // grantAccess is an additive structural change — broadcast handled inside updateCase
    return this.repository.updateCase(
      caseId,
      { authorizedViewers: { create: { userId: targetUserId } } },
      actorId,
      true,
    );
  }

  async revokeAccess(
    caseId: string,
    targetUserId: string,
    actorId: string,
    role: UserRole,
  ) {
    await this.getCaseById(caseId, actorId, role);

    if (targetUserId === actorId) {
      throw new AppError("You cannot revoke your own access to this case", 400);
    }

    try {
      return await this.repository.revokeAccess(caseId, targetUserId, actorId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new AppError("Target user does not have access to this case", 404);
      }
      throw error;
    }
  }
}