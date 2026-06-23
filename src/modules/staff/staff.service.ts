import bcrypt from "bcryptjs";
import { Prisma, UserRole } from "@prisma/client";
import { StaffRepository } from "./staff.repository";
import { AppError } from "../../utils/AppError";
import { parsePagination } from "../../utils/response";
import fs from "fs";
import path from "path";
import { 
  UpdateProfileInput, 
  ReviewInput, 
  BgCheckInput, 
  ChangePasswordInput, 
  UpdatePermissionInput, 
  ForceResetPasswordInput 
} from "./staff.dto";

export class StaffService {
  private repository: StaffRepository;

  constructor() {
    this.repository = new StaffRepository();
  }

  async updateProfileImage(id: string, file: Express.Multer.File) {
    // 1. Fetch targeted staff profile record 
    const currentStaff = await this.repository.findUniqueById(id);
    if (!currentStaff) {
      // Cleanup newly uploaded file immediately if user record doesn't exist
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError("Staff member not found", 404);
    }

    // 2. Identify and safely delete previous profile image from local disk storage
    if (currentStaff.avatarPublicId) {
      try {
        const absoluteOldPath = path.resolve(currentStaff.avatarPublicId);
        if (fs.existsSync(absoluteOldPath)) {
          fs.unlinkSync(absoluteOldPath);
        }
      } catch (err) {
        // Soft logging to prevent pipeline crashes over unlinked structural mismatches
        console.error("Failed to delete the previous avatar file:", err);
      }
    }

    // 3. Formulate structural data paths matching your schema architecture
    const fileUrl = `/uploads/employee/${file.filename}`;
    const localSystemPath = file.path; // Saved inside "uploads/employee/..."

    return this.repository.updateProfile(id, {
      avatarUrl: fileUrl,
      avatarPublicId: localSystemPath
    });
  }

  async findAll(query: { page?: string; limit?: string; role?: UserRole; search?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.UserWhereInput = {};
    
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search } }, 
        { lastName: { contains: query.search } }, 
        { email: { contains: query.search } }
      ];
    }

    const [staff, total] = await this.repository.findManyWithPagination(where, skip, limit);
    return { staff, total, page, limit };
  }

  async findById(id: string) {
    const user = await this.repository.findUniqueById(id);
    if (!user) throw new AppError("Staff member not found", 404);
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileInput) {
    return this.repository.updateProfile(id, dto);
  }

  async deactivate(id: string, adminId: string) {
    const user = await this.repository.updateProfile(id, { isActive: false });
    await this.repository.createAuditLog({
      userId: adminId,
      action: "DEACTIVATE_USER",
      resource: "USER",
      resourceId: id
    });
    return user;
  }

  async addReview(dto: ReviewInput, reviewedById: string) {
    return this.repository.createPerformanceReview({
      userId: dto.userId,
      reviewedById, 
      reviewDate: new Date(dto.reviewDate),
      rating: dto.rating,
      comments: dto.comments,
      goals: dto.goals
    });
  }

  async updateBgCheck(id: string, dto: BgCheckInput, adminId: string) {
    const user = await this.repository.updateProfile(id, {
      backgroundCheckStatus: dto.status,
      backgroundCheckDate: new Date(dto.date)
    });
    await this.repository.createAuditLog({
      userId: adminId,
      action: "UPDATE_BACKGROUND_CHECK",
      resource: "USER",
      resourceId: id
    });
    return user;
  }

  async changePassword(id: string, dto: ChangePasswordInput) {
    const user = await this.repository.findRawUserWithHash(id);
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new AppError("Current password is incorrect", 401);
    
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.repository.updatePasswordHash(id, passwordHash);
    return { message: "Password updated successfully" };
  }

  async findPermissionsByUserId(userId: string) {
    const permission = await this.repository.findPermissionByUserId(userId);
    if (!permission) throw new AppError("Permissions not configured", 404);
    return permission;
  }

  async updatePermissionsByUserId(userId: string, dto: UpdatePermissionInput) {
    return this.repository.upsertPermission(userId, dto);
  }

  // src/modules/staff/staff.service.ts

  async forceResetPassword(id: string, dto: ForceResetPasswordInput, adminId: string) {
    const targetUser = await this.repository.findUniqueById(id);
    const userName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : "Unknown User";

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.repository.updatePasswordHash(id, passwordHash);
    
    // ሙሉ በሙሉ በ Object መልክ የተላከ
    await this.repository.createAuditLog({
      userId: adminId,
      action: "FORCE_PASSWORD_RESET",
      resource: userName,
      resourceId: id,
      metadata: { targetUserId: id, targetUserName: userName }
    });
    
    return { message: "Password reset executed" };
  }

  async toggleActive(id: string, adminId: string) {
    const current = await this.repository.findUniqueById(id);
    if (!current) throw new AppError("Staff member not found", 404);
    
    const userName = `${current.firstName} ${current.lastName}`;
    const newStatus = !current.isActive;
    const action = newStatus ? "REACTIVATE_USER" : "DEACTIVATE_USER";

    await this.repository.updateProfile(id, { isActive: newStatus });
    
    // ሙሉ በሙሉ በ Object መልክ የተላከ
    await this.repository.createAuditLog({
      userId: adminId,
      action: action,
      resource: userName,
      resourceId: id,
      metadata: { oldStatus: current.isActive, newStatus: newStatus }
    });
    
    return { message: "Account status updated" };
  }

  async deleteEmployee(id: string, adminId: string) {
    const targetUser = await this.repository.findUniqueById(id);
    const userName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : "Deleted User";
    
    // ሙሉ በሙሉ በ Object መልክ የተላከ
    await this.repository.createAuditLog({
      userId: adminId,
      action: "PERMANENT_DELETE",
      resource: userName,
      resourceId: id,
      metadata: { deletedUserId: id, deletedUserName: userName }
    });
    
    await this.repository.deleteEmployeeData(id);
    return { message: "Employee successfully deleted" };
  }
}