import { beforeAll, describe, expect, it } from "vitest";
import argon2 from "argon2";
import { FastifyInstance } from "fastify";
import { createApp } from "./app/app";
import { prisma } from "./infrastructure/database/prisma";

const password = "TenantTest123!";

async function login(app: FastifyInstance, email: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });
  expect(response.statusCode).toBe(200);
  return response.json().data.token as string;
}

describe("Multi-organization tenant isolation", { timeout: 60000 }, () => {
  let app: FastifyInstance;
  let organizationA: { id: number };
  let organizationB: { id: number };
  let officerAToken: string;
  let officerBToken: string;
  let rfqBId: number;
  let vendorBId: number;
  let quotationBId: number;
  let approvalBId: number;
  let purchaseOrderBId: number;
  let invoiceBId: number;
  let notificationBId: number;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
    const passwordHash = await argon2.hash(password);

    organizationA = await prisma.organization.upsert({
      where: { slug: "tenant-test-a" },
      update: { isActive: true },
      create: {
        name: "Tenant Test A",
        slug: "tenant-test-a",
        code: "TENANT-A",
        isActive: true,
        updatedAt: new Date(),
      },
      select: { id: true },
    });
    organizationB = await prisma.organization.upsert({
      where: { slug: "tenant-test-b" },
      update: { isActive: true },
      create: {
        name: "Tenant Test B",
        slug: "tenant-test-b",
        code: "TENANT-B",
        isActive: true,
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    await prisma.user.upsert({
      where: { email: "tenant-a-officer@example.com" },
      update: {
        passwordHash,
        organizationId: organizationA.id,
        isActive: true,
      },
      create: {
        email: "tenant-a-officer@example.com",
        userName: "tenant_a_officer",
        name: "Tenant A Officer",
        role: "OFFICR",
        passwordHash,
        organizationId: organizationA.id,
      },
    });
    await prisma.user.upsert({
      where: { email: "tenant-b-officer@example.com" },
      update: {
        passwordHash,
        organizationId: organizationB.id,
        isActive: true,
      },
      create: {
        email: "tenant-b-officer@example.com",
        userName: "tenant_b_officer",
        name: "Tenant B Officer",
        role: "OFFICR",
        passwordHash,
        organizationId: organizationB.id,
      },
    });

    const vendorB = await prisma.user.upsert({
      where: { email: "tenant-b-vendor@example.com" },
      update: {
        passwordHash,
        organizationId: organizationB.id,
        isActive: true,
      },
      create: {
        email: "tenant-b-vendor@example.com",
        userName: "tenant_b_vendor",
        name: "Tenant B Vendor",
        role: "VENDOR",
        passwordHash,
        organizationId: organizationB.id,
        profile: {
          create: {
            organizationId: organizationB.id,
            companyName: "Tenant B Supplies",
            gstNumber: "TENANTBGST001",
            address: "Tenant B Address",
            mobileNumber: "9000000002",
          },
        },
      },
    });
    vendorBId = vendorB.id;

    const existingRfq = await prisma.rFQ.findUnique({
      where: { rfqNumber: "TENANT-B-RFQ-001" },
    });
    const rfqB =
      existingRfq ??
      (await prisma.rFQ.create({
        data: {
          rfqNumber: "TENANT-B-RFQ-001",
          title: "Tenant B Private RFQ",
          status: "OPEN",
          priority: "MEDIUM",
          requestedById: (
            await prisma.user.findUniqueOrThrow({
              where: { email: "tenant-b-officer@example.com" },
            })
          ).id,
          organizationId: organizationB.id,
          items: {
            create: [{ name: "Private item", quantity: 1, unit: "Unit" }],
          },
        },
      }));
    rfqBId = rfqB.id;
    const rfqItemB = await prisma.rFQItem.findFirstOrThrow({
      where: { rfqId: rfqB.id },
    });
    const quotationB = await prisma.quotation.upsert({
      where: { rfqId_vendorId: { rfqId: rfqB.id, vendorId: vendorBId } },
      update: { organizationId: organizationB.id },
      create: {
        quotationNumber: "TENANT-B-QT-001",
        rfqId: rfqB.id,
        vendorId: vendorBId,
        organizationId: organizationB.id,
        status: "SUBMITTED",
        subtotal: 100,
        tax: 18,
        totalAmount: 118,
        items: {
          create: [
            {
              rfqItemId: rfqItemB.id,
              name: "Private item",
              quantity: 1,
              unit: "Unit",
              unitPrice: 100,
              tax: 18,
              subtotal: 100,
            },
          ],
        },
      },
    });
    quotationBId = quotationB.id;
    const approvalB = await prisma.approvalRequest.upsert({
      where: { quotationId: quotationB.id },
      update: { organizationId: organizationB.id },
      create: {
        rfqId: rfqB.id,
        quotationId: quotationB.id,
        requestedById: (
          await prisma.user.findUniqueOrThrow({
            where: { email: "tenant-b-officer@example.com" },
          })
        ).id,
        organizationId: organizationB.id,
      },
    });
    approvalBId = approvalB.id;
    const poB = await prisma.purchaseOrder.upsert({
      where: { quotationId: quotationB.id },
      update: { organizationId: organizationB.id },
      create: {
        poNumber: "TENANT-B-PO-001",
        quotationId: quotationB.id,
        rfqId: rfqB.id,
        vendorId: vendorBId,
        createdById: (
          await prisma.user.findUniqueOrThrow({
            where: { email: "tenant-b-officer@example.com" },
          })
        ).id,
        organizationId: organizationB.id,
        subtotal: 100,
        tax: 18,
        total: 118,
        items: {
          create: [
            {
              rfqItemId: rfqItemB.id,
              name: "Private item",
              quantity: 1,
              unit: "Unit",
              unitPrice: 100,
              tax: 18,
              subtotal: 100,
              total: 118,
            },
          ],
        },
      },
    });
    purchaseOrderBId = poB.id;
    const invoiceB = await prisma.invoice.upsert({
      where: { purchaseOrderId: poB.id },
      update: { organizationId: organizationB.id },
      create: {
        invoiceNumber: "TENANT-B-INV-001",
        purchaseOrderId: poB.id,
        vendorId: vendorBId,
        organizationId: organizationB.id,
        subtotal: 100,
        tax: 18,
        total: 118,
        items: {
          create: [
            {
              name: "Private item",
              quantity: 1,
              unit: "Unit",
              unitPrice: 100,
              tax: 18,
              subtotal: 100,
              total: 118,
            },
          ],
        },
      },
    });
    invoiceBId = invoiceB.id;

    const notificationB = await prisma.notification.create({
      data: {
        userId: vendorBId,
        organizationId: organizationB.id,
        type: "RFQ_PUBLISHED",
        title: "Tenant B private notification",
        message: "Private tenant event",
      },
    });
    notificationBId = notificationB.id;

    officerAToken = await login(app, "tenant-a-officer@example.com");
    officerBToken = await login(app, "tenant-b-officer@example.com");
  }, 60000);

  it("does not expose another organization's RFQ by direct ID", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/rfqs/${rfqBId}`,
      headers: { authorization: `Bearer ${officerAToken}` },
    });
    expect([403, 404]).toContain(response.statusCode);
    expect(response.json().data).toBeUndefined();
  });

  it("scopes RFQ lists to the authenticated organization", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/rfqs?limit=100",
      headers: { authorization: `Bearer ${officerAToken}` },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.some((rfq: any) => rfq.id === rfqBId)).toBe(
      false,
    );
  });

  it("does not expose another organization's vendor by direct ID", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/vendors/${vendorBId}`,
      headers: { authorization: `Bearer ${officerAToken}` },
    });
    expect([403, 404]).toContain(response.statusCode);
    expect(response.json().data).toBeUndefined();
  });

  it("rejects direct quotation, approval, PO, and invoice IDOR attempts", async () => {
    const requests = [
      ["/api/quotations/" + quotationBId, "GET"],
      ["/api/approvals/" + approvalBId, "GET"],
      ["/api/purchase-orders/" + purchaseOrderBId, "GET"],
      ["/api/invoices/" + invoiceBId, "GET"],
      ["/api/invoices/" + invoiceBId + "/pdf", "GET"],
      [`/api/rfqs/${rfqBId}/activity`, "GET"],
      ["/api/notifications/" + notificationBId + "/read", "PATCH"],
    ] as const;
    for (const [url, method] of requests) {
      const response = await app.inject({
        method,
        url,
        headers: { authorization: `Bearer ${officerAToken}` },
      });
      expect([403, 404]).toContain(response.statusCode);
    }
  });

  it("keeps notifications scoped to the authenticated organization", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/notifications?limit=100",
      headers: { authorization: `Bearer ${officerAToken}` },
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.json().data)).not.toContain(
      "Tenant B private notification",
    );
  });

  it("keeps dashboard and reports organization-scoped", async () => {
    const [dashboard, reports, csv] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/dashboard/stats",
        headers: { authorization: `Bearer ${officerAToken}` },
      }),
      app.inject({
        method: "GET",
        url: "/api/reports/analytics",
        headers: { authorization: `Bearer ${officerAToken}` },
      }),
      app.inject({
        method: "GET",
        url: "/api/reports/export",
        headers: { authorization: `Bearer ${officerAToken}` },
      }),
    ]);
    expect(dashboard.statusCode).toBe(200);
    expect(reports.statusCode).toBe(200);
    expect(csv.statusCode).toBe(200);
    expect(JSON.stringify(dashboard.json().data)).not.toContain(
      "Tenant B Private RFQ",
    );
    expect(JSON.stringify(reports.json().data)).not.toContain(
      "Tenant B Private RFQ",
    );
    expect(csv.payload).not.toContain("TENANT-B-RFQ-001");
  });

  it("keeps organizations distinct in trusted login context", async () => {
    const responseA = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "tenant-a-officer@example.com", password },
    });
    const responseB = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "tenant-b-officer@example.com", password },
    });
    expect(responseA.json().data.user.organizationId).toBe(organizationA.id);
    expect(responseB.json().data.user.organizationId).toBe(organizationB.id);
  });
});
