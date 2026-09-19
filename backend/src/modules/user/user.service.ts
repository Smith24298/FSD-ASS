import argon2 from "argon2";
import { userRepository } from "./user.repository";
import { CreateUserInput, UpdateUserInput, UserQuery } from "./user.schema";
import { SafeUser, PaginatedResponse, Role } from "./user.types";

export class UserService {
  async createUser(
    data: CreateUserInput,
    organizationId: number,
  ): Promise<SafeUser> {
    const { password, ...userData } = data;

    const passwordHash = await argon2.hash(password);

    const user = await userRepository.create({
      ...userData,
      passwordHash,
      role: data.role,
      organizationId,
    });

    return user;
  }

  async getUsers(
    query: UserQuery,
    organizationId: number,
  ): Promise<PaginatedResponse<SafeUser>> {
    const { page, limit, search, role, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      userRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      userRepository.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(
    id: number,
    organizationId: number,
  ): Promise<SafeUser | null> {
    const user = await userRepository.findById(id);
    return user?.organizationId === organizationId ? user : null;
  }

  async getUserByEmail(email: string): Promise<SafeUser | null> {
    return userRepository.findByEmail(email);
  }

  async updateUser(
    id: number,
    data: UpdateUserInput,
    organizationId: number,
  ): Promise<SafeUser | null> {
    if (!(await this.getUserById(id, organizationId))) return null;
    return userRepository.update(id, data);
  }

  async deleteUser(id: number, organizationId: number): Promise<boolean> {
    if (!(await this.getUserById(id, organizationId))) return false;
    return userRepository.delete(id);
  }

  async getUserWithPassword(id: number) {
    return userRepository.findByIdWithPassword(id);
  }

  async getUserWithPasswordByEmail(email: string) {
    return userRepository.findByEmailWithPassword(email);
  }
}

export const userService = new UserService();
