import argon2 from "argon2";
import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { SafeUser } from "../../shared/types/index.js";
import { vendorRepository } from "./vendor.repository";
import { userRepository } from "../user/user.repository";
import {
  CreateVendorInput,
  UpdateVendorInput,
  UpdateVendorStatusInput,
  VendorQuery,
} from "./vendor.schema";

export class VendorService {
  async list(user: SafeUser, query: VendorQuery) {
    const { page, limit, search, category, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        {
          profile: {
            OR: [
              { companyName: { contains: search, mode: "insensitive" } },
              { gstNumber: { contains: search, mode: "insensitive" } },
              { vendorCode: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (category) {
      where.profile = {
        ...(where.profile ?? {}),
        category: { contains: category, mode: "insensitive" },
      };
    }

    if (status) {
      where.profile = {
        ...(where.profile ?? {}),
        status,
      };
    }

    let orderBy: any = { createdAt: sortOrder };
    if (sortBy === "name") orderBy = { name: sortOrder };
    if (sortBy === "companyName") orderBy = { profile: { companyName: sortOrder } };
    if (sortBy === "category") orderBy = { profile: { category: sortOrder } };
    if (sortBy === "vendorCode") orderBy = { profile: { vendorCode: sortOrder } };

    const [vendors, total] = await Promise.all([
      vendorRepository.findMany({ where, skip, take: limit, orderBy }),
      vendorRepository.count(where),
    ]);

    return {
      data: vendors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(user: SafeUser, id: number) {
    if (user.role === "VENDOR" && user.id !== id) {
      throw AppError.forbidden("You are not authorized to view this vendor's details", "FORBIDDEN");
    }

    const vendor = await vendorRepository.findById(id);
    if (!vendor) {
      throw AppError.notFound("Vendor not found", "VENDOR_NOT_FOUND");
    }

    return vendor;
  }

  async create(user: SafeUser, input: CreateVendorInput) {
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw AppError.conflict("Email is already registered", "EMAIL_EXISTS");
    }

    const userName = input.userName || input.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "") + Math.floor(Math.random() * 1000);
    const password = input.password || "Vendor@123!";
    const passwordHash = await argon2.hash(password);
    const vendorCode = input.vendorCode || (await vendorRepository.generateVendorCode());

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          userName,
          passwordHash,
          role: "VENDOR",
          isActive: input.status !== "INACTIVE" && input.status !== "SUSPENDED",
        },
      });

      const profile = await tx.profile.create({
        data: {
          userId: newUser.id,
          companyName: input.companyName,
          gstNumber: input.gstNumber,
          address: input.address,
          mobileNumber: input.mobileNumber,
          category: input.category,
          vendorCode,
          status: input.status,
        },
      });

      return { user: newUser, profile };
    });

    return this.getById(user, result.user.id);
  }

  async update(user: SafeUser, id: number, input: UpdateVendorInput) {
    const vendor = await vendorRepository.findById(id);
    if (!vendor) {
      throw AppError.notFound("Vendor not found", "VENDOR_NOT_FOUND");
    }

    if (user.role === "VENDOR" && user.id !== id) {
      throw AppError.forbidden("You cannot modify another vendor's profile", "FORBIDDEN");
    }

    await prisma.$transaction(async (tx) => {
      if (input.name || input.email) {
        await tx.user.update({
          where: { id },
          data: {
            ...(input.name ? { name: input.name } : {}),
            ...(input.email ? { email: input.email } : {}),
          },
        });
      }

      const profileData: any = {};
      if (input.companyName) profileData.companyName = input.companyName;
      if (input.mobileNumber) profileData.mobileNumber = input.mobileNumber;
      if (input.gstNumber) profileData.gstNumber = input.gstNumber;
      if (input.address) profileData.address = input.address;
      if (input.category) profileData.category = input.category;
      if (input.vendorCode && user.role === "ADMIN") profileData.vendorCode = input.vendorCode;
      if (input.status && (user.role === "ADMIN" || user.role === "OFFICR")) {
        profileData.status = input.status;
      }

      if (Object.keys(profileData).length > 0) {
        await tx.profile.update({
          where: { userId: id },
          data: profileData,
        });
      }
    });

    return this.getById(user, id);
  }

  async updateStatus(user: SafeUser, id: number, input: UpdateVendorStatusInput) {
    const vendor = await vendorRepository.findById(id);
    if (!vendor) {
      throw AppError.notFound("Vendor not found", "VENDOR_NOT_FOUND");
    }

    const isActive = input.status === "ACTIVE";

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { isActive },
      });

      await tx.profile.update({
        where: { userId: id },
        data: { status: input.status },
      });
    });

    return this.getById(user, id);
  }
}

export const vendorService = new VendorService();
