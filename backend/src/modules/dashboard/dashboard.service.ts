import { prisma } from "../../infrastructure/database/prisma";
import { SafeUser } from "../../shared/types/index.js";

export class DashboardService {
  async getStats(user: SafeUser) {
    if (user.role === "VENDOR") {
      const [
        assignedRfqsCount,
        submittedQuotesCount,
        purchaseOrdersCount,
        invoicesCount,
        recentOrders,
        recentInvoices,
      ] = await Promise.all([
        prisma.rFQVendor.count({ where: { vendorId: user.id } }),
        prisma.quotation.count({ where: { vendorId: user.id } }),
        prisma.purchaseOrder.count({ where: { vendorId: user.id } }),
        prisma.invoice.count({ where: { vendorId: user.id } }),
        prisma.purchaseOrder.findMany({
          where: { vendorId: user.id },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { rfq: { select: { rfqNumber: true, title: true } } },
        }),
        prisma.invoice.findMany({
          where: { vendorId: user.id },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { purchaseOrder: { select: { poNumber: true } } },
        }),
      ]);

      return {
        role: "VENDOR",
        cards: {
          assignedRfqs: assignedRfqsCount,
          submittedQuotations: submittedQuotesCount,
          purchaseOrders: purchaseOrdersCount,
          invoices: invoicesCount,
        },
        recentPurchaseOrders: recentOrders,
        recentInvoices,
      };
    }

    if (user.role === "MANAGER") {
      const [
        pendingApprovalsCount,
        approvedCount,
        recentApprovals,
        recentPos,
        poSum,
      ] = await Promise.all([
        prisma.approvalRequest.count({ where: { status: "PENDING" } }),
        prisma.approvalRequest.count({ where: { status: "APPROVED" } }),
        prisma.approvalRequest.findMany({
          where: { status: "PENDING" },
          take: 5,
          orderBy: { requestedAt: "desc" },
          include: {
            rfq: { select: { id: true, rfqNumber: true, title: true } },
            quotation: {
              select: {
                id: true,
                totalAmount: true,
                currency: true,
                vendor: { select: { name: true } },
              },
            },
            requestedBy: { select: { name: true, email: true } },
          },
        }),
        prisma.purchaseOrder.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            vendor: { select: { name: true } },
            rfq: { select: { rfqNumber: true } },
          },
        }),
        prisma.purchaseOrder.aggregate({
          _sum: { total: true },
          where: { status: { not: "CANCELLED" } },
        }),
      ]);

      return {
        role: "MANAGER",
        totalSpend: poSum._sum.total?.toString() ?? "0",
        cards: {
          pendingApprovals: pendingApprovalsCount,
          totalApproved: approvedCount,
          totalProcurementValue: poSum._sum.total?.toString() ?? "0",
        },
        pendingApprovalsList: recentApprovals,
        recentPurchaseOrders: recentPos,
      };
    }

    // Default for ADMIN & OFFICR
    const [
      activeRfqsCount,
      pendingQuotesCount,
      pendingApprovalsCount,
      totalVendorsCount,
      totalPosCount,
      totalInvoicesCount,
      poSum,
      recentRfqs,
      recentPos,
      recentInvoices,
    ] = await Promise.all([
      prisma.rFQ.count({
        where: {
          status: { in: ["PUBLISHED", "OPEN", "UNDER_REVIEW", "SHORTLISTED"] },
        },
      }),
      prisma.quotation.count({ where: { status: "SUBMITTED" } }),
      prisma.approvalRequest.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "VENDOR" } }),
      prisma.purchaseOrder.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.invoice.count(),
      prisma.purchaseOrder.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.rFQ.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rfqNumber: true,
          title: true,
          status: true,
          createdAt: true,
          quotationDeadline: true,
          _count: { select: { quotations: true, vendors: true } },
        },
      }),
      prisma.purchaseOrder.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: { select: { name: true } },
          rfq: { select: { rfqNumber: true } },
        },
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: { select: { name: true } },
          purchaseOrder: { select: { poNumber: true } },
        },
      }),
    ]);

    return {
      role: user.role,
      totalSpend: poSum._sum.total?.toString() ?? "0",
      cards: {
        activeRfqs: activeRfqsCount,
        pendingQuotations: pendingQuotesCount,
        pendingApprovals: pendingApprovalsCount,
        totalVendors: totalVendorsCount,
        purchaseOrders: totalPosCount,
        invoices: totalInvoicesCount,
        totalProcurementValue: poSum._sum.total?.toString() ?? "0",
      },
      recentRfqs,
      recentPurchaseOrders: recentPos,
      recentInvoices,
    };
  }
}

export const dashboardService = new DashboardService();
