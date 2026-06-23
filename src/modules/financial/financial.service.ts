import { FinancialSupportType, Prisma } from "@prisma/client";
import { FinancialRepository, RequestContext } from "./financial.repository";
import { DisbursementInput, UpdateDisbursementInput } from "./financial.dto";
import { AppError } from "../../utils/AppError";
import { parsePagination } from "../../utils/response";

export class FinancialService {
  private repository: FinancialRepository;

  constructor() {
    this.repository = new FinancialRepository();
  }

  async createDisbursement(
    dto: DisbursementInput,
    disbursedById: string,
    files: Express.Multer.File[],
    ctx: RequestContext
  ) {
    return this.repository.create(dto, disbursedById, files, ctx);
  }

  /**
   * Edit metadata AND optionally append new files in one call.
   * Audit log + notifications are fired for both operations individually
   * so the history stays granular.
   */
  async updateDisbursement(
    id: string,
    dto: UpdateDisbursementInput,
    files: Express.Multer.File[] = [],
    ctx: RequestContext
  ) {
    const record = await this.repository.findById(id);
    if (!record) throw new AppError("Financial support record not found", 404);

    // Update metadata fields (audit + notify inside repository)
    const updated = await this.repository.update(id, dto, ctx);

    // If new files were uploaded, append them (audit + notify inside repository)
    if (files.length > 0) {
      return this.repository.appendFiles(id, files, ctx);
    }

    return updated;
  }

  async deleteDisbursement(id: string, ctx: RequestContext) {
    const record = await this.repository.findById(id);
    if (!record) throw new AppError("Financial support record not found", 404);
    return this.repository.deleteWithFiles(record as any, ctx);
  }

  async addFilesToRecord(
    id: string,
    files: Express.Multer.File[],
    ctx: RequestContext
  ) {
    const record = await this.repository.findById(id);
    if (!record) throw new AppError("Financial support record not found", 404);
    return this.repository.appendFiles(id, files, ctx);
  }

  async deleteFile(recordId: string, fileId: string, ctx: RequestContext) {
    const file = await this.repository.findFile(fileId);
    if (!file || file.financialSupportId !== recordId) {
      throw new AppError("File not found", 404);
    }
    return this.repository.deleteFile(file, ctx);
  }

  async getChildFinancials(childId: string) {
    const { records, totalByType } = await this.repository.getByChildId(childId);
    const totalValue = totalByType.reduce(
      (sum, r) => sum + (r._sum.amount ?? 0),
      0
    );
    return { records, totalByType, totalValue };
  }

  async getFinancialReport(query: {
    page?: string;
    limit?: string;
    academicYear?: string;
    supportType?: FinancialSupportType;
  }) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.FinancialSupportWhereInput = {};
    if (query.academicYear) where.academicYear = query.academicYear;
    if (query.supportType) where.supportType = query.supportType;

    const [disbursements, total, summary] =
      await this.repository.getPaginatedReport(where, skip, limit);
    return { disbursements, total, page, limit, summary };
  }
}