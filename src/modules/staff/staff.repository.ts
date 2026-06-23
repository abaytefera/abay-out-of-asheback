import { Prisma, UserRole } from "@prisma/client";
import prisma from "../../config/prisma";

export class StaffRepository {
  private safeSelect: Prisma.UserSelect = {
    id: true, 
    firstName: true, 
    lastName: true, 
    email: true, 
    role: true,
    phone: true, 
    jobTitle: true, 
    department: true, 
    isActive: true,
    hireDate: true, 
    backgroundCheckStatus: true, 
    backgroundCheckDate: true,
    twoFactorEnabled: true, 
    createdAt: true, 
    avatarUrl: true, 
    avatarPublicId: true,
    permission: { 
      select: { 
        childRegister: true, 
        childUpdate: true, 
        childDelete: true, 
        childView: true, 
        employeeRegister: true, 
        employeeUpdate: true, 
        employeeDelete: true, 
        employeeView: true 
      } 
    }
  };

  async findManyWithPagination(where: Prisma.UserWhereInput, skip: number, take: number) {
    return prisma.$transaction([
      prisma.user.findMany({ where, skip, take, select: this.safeSelect, orderBy: { firstName: "asc" } }),
      prisma.user.count({ where }),
    ]);
  }

  async findUniqueById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: this.safeSelect });
  }

  async findRawUserWithHash(id: string) {
    return prisma.user.findUniqueOrThrow({ where: { id } });
  }

  async updateProfile(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, select: this.safeSelect });
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async createPerformanceReview(data: Prisma.PerformanceReviewUncheckedCreateInput) {
    return prisma.performanceReview.create({ data });
  }

  async findPermissionByUserId(userId: string) {
    return prisma.permission.findUnique({ where: { userId } });
  }

  async upsertPermission(userId: string, data: any) {
    return prisma.permission.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

 
// src/modules/staff/staff.repository.ts

async createAuditLog(data: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: any;
}) {
  return await prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      metadata: data.metadata || {}, // This stores your 'which' data as JSON
    },
  });
}
  async deleteEmployeeData(id: string) {
    await prisma.permission.deleteMany({ where: { userId: id } });
    return prisma.user.delete({ where: { id } });
  }
  

}