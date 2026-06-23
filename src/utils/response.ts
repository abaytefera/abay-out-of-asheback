import { Response } from "express";
import { ApiResponse, PaginationMeta } from "../types";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: PaginationMeta
): Response => {
  const body: ApiResponse<T> = { success: true, message, data, meta };
  return res.status(statusCode).json(body);
};

export const sendCreated = <T>(res: Response, data: T, message = "Created"): Response =>
  sendSuccess(res, data, message, 201);

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown
): Response => {
  const body: ApiResponse = { success: false, message, errors };
  return res.status(statusCode).json(body);
};

export const sendNotFound = (res: Response, resource = "Resource"): Response =>
  sendError(res, `${resource} not found`, 404);

export const sendUnauthorized = (res: Response, message = "Unauthorized"): Response =>
  sendError(res, message, 401);

export const sendForbidden = (res: Response, message = "Forbidden"): Response =>
  sendError(res, message, 403);

export const paginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

export const parsePagination = (query: { page?: string; limit?: string }) => {
  const page = Math.max(1, parseInt(query.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
// በ response.ts ፋይልህ መጨረሻ ላይ ይህንን ጨምር
export const sendNoContent = (res: Response): Response =>
  res.status(204).send();