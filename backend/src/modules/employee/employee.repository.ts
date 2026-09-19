import { prisma } from "../../infrastructure/database/prisma";
import { Role, SafeUser, EmployeeWithUser } from "../../shared/types";

export class EmployeeRepository {
  async create(adminId: number, employeeId: number): Promise<EmployeeWithUser> {
    return prisma.employee.create({
      data: {
        adminId,
        employeeId,
      },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            userName: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findMany(options: {
    where: any;
    skip?: number;
    take?: number;
    orderBy?: any;
  }): Promise<EmployeeWithUser[]> {
    return prisma.employee.findMany({
      where: options.where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            userName: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async count(where: any): Promise<number> {
    return prisma.employee.count({ where });
  }

  async findById(adminId: number, id: number): Promise<EmployeeWithUser | null> {
    return prisma.employee.findFirst({
      where: {
        id,
        adminId,
      },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            userName: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findByEmployeeId(employeeId: number): Promise<EmployeeWithUser | null> {
    return prisma.employee.findUnique({
      where: { employeeId },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            userName: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async updateEmployeeUser(employeeId: number, data: any): Promise<SafeUser | null> {
    return prisma.user.update({
      where: { id: employeeId },
      data,
      select: {
        id: true,
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

  async updateStatus(id: number, isActive: boolean): Promise<EmployeeWithUser | null> {
    return prisma.employee.update({
      where: { id },
      data: { isActive },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            userName: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async delete(id: number): Promise<boolean> {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return false;

    await prisma.employee.delete({ where: { id } });
    return true;
  }
}

export const employeeRepository = new EmployeeRepository();