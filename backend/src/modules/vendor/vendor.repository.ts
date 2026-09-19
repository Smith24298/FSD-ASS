import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "../../../generated/prisma/client.js";

export class VendorRepository {
  async findMany(options: {
    where?: Prisma.UserWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    return prisma.user.findMany({
      where: {
        role: "VENDOR",
        ...options.where,
      },
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      select: {
        id: true,
        email: true,
        userName: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            vendorCode: true,
            companyName: true,
            mobileNumber: true,
            gstNumber: true,
            address: true,
            category: true,
            status: true,
            rating: true,
            createdAt: true,
            updateAt: true,
          },
        },
      },
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return prisma.user.count({
      where: {
        role: "VENDOR",
        ...where,
      },
    });
  }

  async findById(id: number) {
    return prisma.user.findFirst({
      where: {
        id,
        role: "VENDOR",
      },
      select: {
        id: true,
        email: true,
        userName: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        vendorInvitations: {
          include: {
            rfq: {
              select: {
                id: true,
                rfqNumber: true,
                title: true,
                status: true,
                quotationDeadline: true,
                expectedDeliveryDate: true,
                createdAt: true,
              },
            },
          },
          orderBy: { invitedAt: "desc" },
        },
        quotations: {
          include: {
            rfq: {
              select: {
                id: true,
                rfqNumber: true,
                title: true,
                status: true,
              },
            },
            approval: true,
          },
          orderBy: { submittedAt: "desc" },
        },
        purchaseOrdersAsVendor: {
          include: {
            items: true,
            invoice: true,
          },
          orderBy: { createdAt: "desc" },
        },
        invoicesAsVendor: {
          include: {
            items: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async updateProfile(userId: number, data: Prisma.ProfileUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.profile.update({
      where: { userId },
      data,
    });
  }

  async generateVendorCode(): Promise<string> {
    const count = await prisma.profile.count({
      where: { vendorCode: { not: null } },
    });
    const nextSeq = count + 1;
    return `VEND-${new Date().getFullYear()}-${String(nextSeq).padStart(4, "0")}`;
  }
}

export const vendorRepository = new VendorRepository();
