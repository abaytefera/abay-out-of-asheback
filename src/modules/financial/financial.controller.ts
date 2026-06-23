import { Response } from "express";
import { FinancialService } from "./financial.service";
import { RequestContext } from "./financial.repository";
import { catchAsync } from "../../utils/AppError";
import { paginationMeta, sendSuccess, sendCreated } from "../../utils/response";
import { AuthRequest } from "../../types";

const service = new FinancialService();

/** Builds the request context from the authenticated request. */
function buildCtx(req: AuthRequest): RequestContext {
  return {
    actingUserId: req.user!.id,
    ipAddress:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      undefined,
    userAgent: req.headers["user-agent"] || undefined,
  };
}

export const createDisbursement = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    const result = await service.createDisbursement(
      req.body,
      req.user!.id,
      files,
      buildCtx(req)
    );
    sendCreated(res, result, "Financial support disbursement created");
  }
);

export const updateDisbursement = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    const result = await service.updateDisbursement(
      req.params.id,
      req.body,
      files,
      buildCtx(req)
    );
    sendSuccess(res, result, "Financial support record updated");
  }
);

export const deleteDisbursement = catchAsync(
  async (req: AuthRequest, res: Response) => {
    await service.deleteDisbursement(req.params.id, buildCtx(req));
    sendSuccess(
      res,
      null,
      "Financial support record and all attached files deleted successfully"
    );
  }
);

export const addFiles = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return sendSuccess(res, null, "No files provided", 400);
    }
    const result = await service.addFilesToRecord(
      req.params.id,
      files,
      buildCtx(req)
    );
    sendCreated(res, result, "Files attached successfully");
  }
);

export const deleteFile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    await service.deleteFile(
      req.params.id,
      req.params.fileId,
      buildCtx(req)
    );
    sendSuccess(res, null, "File deleted successfully");
  }
);

export const getChildFinancials = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const data = await service.getChildFinancials(req.params.childId);
    sendSuccess(res, data);
  }
);

export const getReport = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { disbursements, total, page, limit, summary } =
      await service.getFinancialReport(req.query as any);
    sendSuccess(
      res,
      { disbursements, summary },
      "Financial report retrieved",
      200,
      paginationMeta(total, page, limit)
    );
  }
);