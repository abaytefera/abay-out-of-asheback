// services/auditLog.service.ts
import prisma from "../../config/prisma.js";
import { AuditLog } from "@prisma/client";

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface AuditLogQuery {
  page?: string | number;
  limit?: string | number;
  userId?: string;
  childId?: string;
  search?: string;
  resource?: string;
  action?: string;
  from?: string;
  to?: string;
}

interface RequestingUser {
  id: string;
  role: string;
}

// ─── Helper: Local Pagination Logic ──────────────────────────────────────────
const getPagination = (query: AuditLogQuery) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit, take: limit };
};

// ─── Service Methods ────────────────────────────────────────────────────────

export const listLogs = async (query: AuditLogQuery, requestingUser: RequestingUser) => {
  const { skip, take, page, limit } = getPagination(query);
  const where: any = {};

  if (requestingUser.role === "COUNTRY_DIRECTOR") {
    if (query.userId) where.userId = query.userId;
    if (query.childId) where.childId = query.childId;
    if (query.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search } },
          { lastName: { contains: query.search } },
          { email: { contains: query.search } },
        ],
      };
    }
  } else {
    where.userId = requestingUser.id;
  }

  if (query.resource) where.resource = query.resource;
  if (query.action) where.action = query.action;

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }), // Fixed: Access .auditLog
    prisma.auditLog.findMany({        // Fixed: Access .auditLog
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true } },
        child: { select: { id: true, childCode: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  return {
    data: logs,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getLog = async (id: string, requestingUser: RequestingUser): Promise<AuditLog> => {
  const log = await prisma.auditLog.findUnique({ // Fixed: Access .auditLog
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true } },
      child: { select: { id: true, childCode: true, firstName: true, lastName: true } },
    },
  });

  if (!log) {
    const error = new Error("Audit log entry not found");
    (error as any).statusCode = 404;
    throw error;
  }

  if (requestingUser.role !== "COUNTRY_DIRECTOR" && log.userId !== requestingUser.id) {
    const error = new Error("Access denied");
    (error as any).statusCode = 403;
    throw error;
  }

  return log;
};

export const getResources = async (): Promise<string[]> => {
  const rows = await prisma.auditLog.findMany({ // Fixed: Access .auditLog
    select: { resource: true },
    distinct: ["resource"],
    orderBy: { resource: "asc" },
  });
  return rows.map((r: any) => r.resource);
};

export const getActions = async (): Promise<string[]> => {
  const rows = await prisma.auditLog.findMany({ // Fixed: Access .auditLog
    select: { action: true },
    distinct: ["action"],
    orderBy: { action: "asc" },
  });
  return rows.map((r: any) => r.action);
};

export const getUserActivity = async (userId: string, days: number = 30, requestingUser: RequestingUser) => {
  if (requestingUser.role !== "COUNTRY_DIRECTOR" && userId !== requestingUser.id) {
    const error = new Error("Access denied");
    (error as any).statusCode = 403;
    throw error;
  }

  const from = new Date();
  from.setDate(from.getDate() - Number(days));

  const logs = await prisma.auditLog.findMany({ // Fixed: Access .auditLog
    where: { userId, createdAt: { gte: from } },
    orderBy: { createdAt: "asc" },
    select: { action: true, resource: true, createdAt: true },
  });

  const byAction = logs.reduce((a: Record<string, number>, l: any) => { a[l.action] = (a[l.action] || 0) + 1; return a; }, {});
  const byResource = logs.reduce((a: Record<string, number>, l: any) => { a[l.resource] = (a[l.resource] || 0) + 1; return a; }, {});

  return { total: logs.length, byAction, byResource, logs };
};