import { prisma } from "../../infrastructure/database/prisma";
import { Role, SafeUser, UserWithRelations } from "../../shared/types";

export interface UserWithProfile {
  user: SafeUser & { passwordHash: string };
  profile: {
    id: number;
    gstNumber: string;
    address: string;
    companyName: string;
    mobileNumber: string;
    createdAt: Date;
    updateAt: Date;
    userId: number;
  } | null;
}

export class UserRepository {
  async create(data: {
    email: string;
    userName: string;
    name: string;
    passwordHash: string;
    role: Role;
    organizationId: number;
  }): Promise<SafeUser> {
    const user = await prisma.user.create({
      data,
      select: {
        id: true,
        organizationId: true,
        email: true,
        userName: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async createWithProfile(
    userData: {
      email: string;
      userName: string;
      name: string;
      passwordHash: string;
      role: Role;
      organizationId: number;
    },
    profileData?: {
      gstNumber: string;
      address: string;
      companyName: string;
      mobileNumber: string;
    },
  ): Promise<UserWithProfile> {
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: userData,
      });

      let newProfile = null;

      if (profileData) {
        newProfile = await tx.profile.create({
          data: {
            ...profileData,
            userId: newUser.id,
            organizationId: userData.organizationId,
          },
        });
      }

      return {
        user: newUser,
        profile: newProfile,
      };
    });

    return result;
  }

  async findMany(options: {
    where?: any;
    skip?: number;
    take?: number;
    orderBy?: any;
  }): Promise<SafeUser[]> {
    return prisma.user.findMany({
      where: options.where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      select: {
        id: true,
        organizationId: true,
        email: true,
        userName: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async count(where?: any): Promise<number> {
    return prisma.user.count({ where });
  }

  async findById(id: number): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
        email: true,
        userName: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        organizationId: true,
        email: true,
        userName: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByIdWithPassword(id: number) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmailWithPassword(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  }

  async findDefaultOrganization() {
    return prisma.organization.findFirst({
      where: { slug: "default", isActive: true },
    });
  }

  async update(id: number, data: any): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        organizationId: true,
        email: true,
        userName: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: number): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return false;

    const employeeRecord = await prisma.employee.findUnique({
      where: { employeeId: id },
    });

    if (employeeRecord) {
      await prisma.employee.delete({ where: { id: employeeRecord.id } });
    }

    await prisma.user.delete({ where: { id } });
    return true;
  }
}

export const userRepository = new UserRepository();
