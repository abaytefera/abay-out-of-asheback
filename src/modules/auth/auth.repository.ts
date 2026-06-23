import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";

export class AuthRepository {
  async findUniqueByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUniqueById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findUniqueByIdOrThrow(id: string) {
    return prisma.user.findUniqueOrThrow({ where: { id } });
  }

async createUser(data: Prisma.UserCreateInput) {
  // Country Director ከሆነ ሁሉንም True፣ ካልሆነ በነባሪ False ማድረግ
  const isCountryDirector = data.role === 'COUNTRY_DIRECTOR';

  return prisma.user.create({
    data: {
      ...data,
      permission: {
        create: {
          // 👶 Child Permissions
          childRegister: isCountryDirector,
          childUpdate: isCountryDirector,
          childDelete: isCountryDirector,
          childView: true, // ለሁሉም ይፈቀዳል

          // 👥 Staff Operations
          employeeRegister: isCountryDirector,
          employeeUpdate: isCountryDirector,
          employeeDelete: isCountryDirector,
          employeeView: isCountryDirector,
        }
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatarUrl: true, 
      permission: true // ለግምገማ እንዲያሳይህ
    },
  });
}
      

  async updateUserSettings(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async selectMeProfile(id: string) {
    return prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        jobTitle: true,
        department: true,
        phone: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });
  }
}