import { prisma } from "../../infrastructure/database/prisma";
import { SafeUser } from "../../shared/types/index.js";

export class ReportsService {
  async getAnalytics(user: SafeUser) {
    // 1. Overall Procurement Statistics
    const [
      rfqCount,
      quotationCount,
      approvedApprovalsCount,
      poCount,
      invoiceCount,
      totalSpendResult,
    ] = await Promise.all([
      prisma.rFQ.count(),
      prisma.quotation.count(),
      prisma.approvalRequest.count({ where: { status: "APPROVED" } }),
      prisma.purchaseOrder.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.invoice.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.purchaseOrder.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
    ]);

    const totalProcurementSpend = totalSpendResult._sum.total?.toString() ?? "0";

    // 2. Spending by Vendor
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { not: "CANCELLED" } },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            profile: { select: { companyName: true, category: true, rating: true } },
          },
        },
      },
    });

    const vendorSpendMap = new Map<number, { vendorId: number; name: string; companyName: string; category: string; totalSpend: number; poCount: number }>();
    for (const po of pos) {
      const vId = po.vendorId;
      const amount = Number(po.total);
      if (!vendorSpendMap.has(vId)) {
        vendorSpendMap.set(vId, {
          vendorId: vId,
          name: po.vendor.name,
          companyName: po.vendor.profile?.companyName ?? po.vendor.name,
          category: po.vendor.profile?.category ?? "General",
          totalSpend: 0,
          poCount: 0,
        });
      }
      const item = vendorSpendMap.get(vId)!;
      item.totalSpend += amount;
      item.poCount += 1;
    }

    const spendingByVendor = Array.from(vendorSpendMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);

    // 3. Spending by Category
    const categorySpendMap = new Map<string, number>();
    for (const item of spendingByVendor) {
      const cat = item.category || "General";
      categorySpendMap.set(cat, (categorySpendMap.get(cat) ?? 0) + item.totalSpend);
    }
    const spendingByCategory = Array.from(categorySpendMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));

    // 4. Monthly Spending & Activity Trends
    const monthlyMap = new Map<string, { month: string; spend: number; poCount: number; rfqCount: number }>();
    for (const po of pos) {
      const date = new Date(po.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { month: key, spend: 0, poCount: 0, rfqCount: 0 });
      }
      const m = monthlyMap.get(key)!;
      m.spend += Number(po.total);
      m.poCount += 1;
    }

    const rfqs = await prisma.rFQ.findMany({ select: { createdAt: true } });
    for (const rfq of rfqs) {
      const date = new Date(rfq.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { month: key, spend: 0, poCount: 0, rfqCount: 0 });
      }
      monthlyMap.get(key)!.rfqCount += 1;
    }

    const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // 5. Vendor Performance Analytics
    const vendors = await prisma.user.findMany({
      where: { role: "VENDOR" },
      include: {
        profile: true,
        vendorInvitations: true,
        quotations: {
          select: {
            id: true,
            status: true,
            deliveryDays: true,
            totalAmount: true,
          },
        },
        purchaseOrdersAsVendor: {
          where: { status: { not: "CANCELLED" } },
          select: { total: true },
        },
      },
    });

    const vendorPerformance = vendors.map((v) => {
      const invitationsCount = v.vendorInvitations.length;
      const quotationsCount = v.quotations.length;
      const responseRate = invitationsCount > 0 ? Math.round((quotationsCount / invitationsCount) * 100) : 0;
      const acceptedQuotes = v.quotations.filter((q) => q.status === "APPROVED" || q.status === "AWARDED").length;
      const rejectedQuotes = v.quotations.filter((q) => q.status === "REJECTED").length;

      const quotesWithDelivery = v.quotations.filter((q) => q.deliveryDays !== null && q.deliveryDays !== undefined);
      const avgDeliveryDays = quotesWithDelivery.length > 0
        ? Math.round(quotesWithDelivery.reduce((acc, q) => acc + (q.deliveryDays ?? 0), 0) / quotesWithDelivery.length)
        : null;

      const totalProcurementValue = v.purchaseOrdersAsVendor.reduce(
        (acc, po) => acc + Number(po.total),
        0
      );

      return {
        vendorId: v.id,
        name: v.name,
        companyName: v.profile?.companyName ?? v.name,
        vendorCode: v.profile?.vendorCode ?? "N/A",
        category: v.profile?.category ?? "General",
        rating: v.profile?.rating ? Number(v.profile.rating) : 4.5,
        rfqsReceived: invitationsCount,
        quotationsSubmitted: quotationsCount,
        responseRate,
        avgDeliveryDays,
        acceptedQuotations: acceptedQuotes,
        rejectedQuotations: rejectedQuotes,
        purchaseOrdersCount: v.purchaseOrdersAsVendor.length,
        totalProcurementValue,
      };
    });

    return {
      procurementStats: {
        rfqsCreated: rfqCount,
        quotationsReceived: quotationCount,
        approvalsProcessed: approvedApprovalsCount,
        purchaseOrdersGenerated: poCount,
        invoicesGenerated: invoiceCount,
        totalProcurementSpend,
      },
      spendingByVendor,
      spendingByCategory,
      monthlyTrends,
      vendorPerformance,
    };
  }

  async exportCsv(user: SafeUser): Promise<string> {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        vendor: {
          select: {
            name: true,
            profile: { select: { companyName: true, category: true, gstNumber: true } },
          },
        },
        rfq: { select: { rfqNumber: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "PO Number",
      "RFQ Number",
      "Vendor Company",
      "Contact Person",
      "GST Number",
      "Category",
      "Status",
      "Issue Date",
      "Subtotal",
      "Tax",
      "Total Amount",
    ];

    const rows = pos.map((po) => [
      `"${po.poNumber}"`,
      `"${po.rfq.rfqNumber}"`,
      `"${po.vendor.profile?.companyName ?? po.vendor.name}"`,
      `"${po.vendor.name}"`,
      `"${po.vendor.profile?.gstNumber ?? ""}"`,
      `"${po.vendor.profile?.category ?? "General"}"`,
      `"${po.status}"`,
      `"${new Date(po.issueDate).toLocaleDateString()}"`,
      `"${Number(po.subtotal).toFixed(2)}"`,
      `"${Number(po.tax).toFixed(2)}"`,
      `"${Number(po.total).toFixed(2)}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}

export const reportsService = new ReportsService();
