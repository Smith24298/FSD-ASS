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

      describe("Multi-organization tenant isolation", { timeout: 120000 }, () => {
  let app: FastifyInstance;
  let organizationA: { id: number };
  let organizationB: { id: number };
  let officerAToken: string;
  let officerBToken: string;
  let adminAToken: string;
  let adminBToken: string;
  let rfqBId: number;
  let vendorBId: number;
  let vendorAId: number;
  let quotationBId: number;
  let approvalBId: number;
  let purchaseOrderBId: number;
  let invoiceBId: number;
  let notificationBId: number;
  let adminBUserId: number;
  let managerAUserId: number;
  let managerBUserId: number;

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

    const adminA = await prisma.user.upsert({
      where: { email: "tenant-a-admin@example.com" },
      update: {
        passwordHash,
        organizationId: organizationA.id,
        isActive: true,
      },
      create: {
        email: "tenant-a-admin@example.com",
        userName: "tenant_a_admin",
        name: "Tenant A Admin",
        role: "ADMIN",
        passwordHash,
        organizationId: organizationA.id,
      },
    });
    const adminB = await prisma.user.upsert({
      where: { email: "tenant-b-admin@example.com" },
      update: {
        passwordHash,
        organizationId: organizationB.id,
        isActive: true,
      },
      create: {
        email: "tenant-b-admin@example.com",
        userName: "tenant_b_admin",
        name: "Tenant B Admin",
        role: "ADMIN",
        passwordHash,
        organizationId: organizationB.id,
      },
    });
    adminBUserId = adminB.id;

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

    const managerA = await prisma.user.upsert({
      where: { email: "tenant-a-manager@example.com" },
      update: {
        passwordHash,
        organizationId: organizationA.id,
        isActive: true,
      },
      create: {
        email: "tenant-a-manager@example.com",
        userName: "tenant_a_manager",
        name: "Tenant A Manager",
        role: "MANAGER",
        passwordHash,
        organizationId: organizationA.id,
      },
    });
    managerAUserId = managerA.id;
    const managerB = await prisma.user.upsert({
      where: { email: "tenant-b-manager@example.com" },
      update: {
        passwordHash,
        organizationId: organizationB.id,
        isActive: true,
      },
      create: {
        email: "tenant-b-manager@example.com",
        userName: "tenant_b_manager",
        name: "Tenant B Manager",
        role: "MANAGER",
        passwordHash,
        organizationId: organizationB.id,
      },
    });
    managerBUserId = managerB.id;

    const vendorA = await prisma.user.upsert({
      where: { email: "tenant-a-vendor@example.com" },
      update: {
        passwordHash,
        organizationId: organizationA.id,
        isActive: true,
      },
      create: {
        email: "tenant-a-vendor@example.com",
        userName: "tenant_a_vendor",
        name: "Tenant A Vendor",
        role: "VENDOR",
        passwordHash,
        organizationId: organizationA.id,
        profile: {
          create: {
            organizationId: organizationA.id,
            companyName: "Tenant A Supplies",
            gstNumber: "TENANTAGST001",
            address: "Tenant A Address",
            mobileNumber: "9000000001",
          },
        },
      },
    });
    vendorAId = vendorA.id;

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
    adminAToken = await login(app, "tenant-a-admin@example.com");
    adminBToken = await login(app, "tenant-b-admin@example.com");
  }, 90000);

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

  it("forces authenticated admin's organizationId when creating users", async () => {
    const maliciousPayload: any = {
      name: "Spoofed User",
      email: "spoofed-user-" + Date.now() + "@example.com",
      userName: "spoofed_" + Date.now(),
      password: password,
      role: "OFFICR",
      organizationId: organizationB.id,
    };
    const response = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { authorization: `Bearer ${adminAToken}` },
      payload: maliciousPayload,
    });
    expect(response.statusCode).toBe(201);
    const created = response.json().data;
    expect(created.organizationId).toBe(organizationA.id);
    expect(created.organizationId).not.toBe(organizationB.id);
  });

  it("scopes user lists to the admin's own organization", async () => {
    const aList = await app.inject({
      method: "GET",
      url: "/api/users?limit=100",
      headers: { authorization: `Bearer ${adminAToken}` },
    });
    const bList = await app.inject({
      method: "GET",
      url: "/api/users?limit=100",
      headers: { authorization: `Bearer ${adminBToken}` },
    });
    expect(aList.statusCode).toBe(200);
    expect(bList.statusCode).toBe(200);
    const aEmails = aList.json().data.map((u: any) => u.email);
    const bEmails = bList.json().data.map((u: any) => u.email);
    expect(aEmails).toContain("tenant-a-admin@example.com");
    expect(aEmails).toContain("tenant-a-officer@example.com");
    expect(aEmails).toContain("tenant-a-manager@example.com");
    expect(aEmails).toContain("tenant-a-vendor@example.com");
    expect(aEmails).not.toContain("tenant-b-admin@example.com");
    expect(aEmails).not.toContain("tenant-b-officer@example.com");
    expect(aEmails).not.toContain("tenant-b-manager@example.com");
    expect(aEmails).not.toContain("tenant-b-vendor@example.com");
    expect(bEmails).toContain("tenant-b-admin@example.com");
    expect(bEmails).not.toContain("tenant-a-admin@example.com");
  });

  it("blocks cross-organization user GET by IDOR", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/users/${adminBUserId}`,
      headers: { authorization: `Bearer ${adminAToken}` },
    });
    expect([403, 404]).toContain(response.statusCode);
    expect(response.json().data).toBeUndefined();
  });

  it("blocks cross-organization user PATCH by IDOR", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/users/${adminBUserId}`,
      headers: { authorization: `Bearer ${adminAToken}` },
      payload: { name: "Hacked Admin B" },
    });
    expect([403, 404]).toContain(response.statusCode);
    const stillAdminB = await prisma.user.findUnique({
      where: { id: adminBUserId },
      select: { name: true },
    });
    expect(stillAdminB?.name).toBe("Tenant B Admin");
  });

  it("blocks attaching a cross-organization user as an employee", async () => {
    const employeeCreate = await app.inject({
      method: "POST",
      url: "/api/employees",
      headers: { authorization: `Bearer ${adminAToken}` },
      payload: {
        employeeId: managerBUserId,
        title: "Manager",
        department: "Ops",
      },
    });
    expect([403, 404, 400, 409]).toContain(employeeCreate.statusCode);
    const adminAUser = await prisma.user.findUnique({
      where: { email: "tenant-a-admin@example.com" },
      select: { id: true },
    });
    if (adminAUser) {
      const employees = await prisma.employee.findMany({
        where: { adminId: adminAUser.id, employeeId: managerBUserId },
      });
      expect(employees.length).toBe(0);
    }
  });

  it("blocks cross-organization RFQ mutation (update)", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/rfqs/${rfqBId}`,
      headers: { authorization: `Bearer ${officerAToken}` },
      payload: { title: "Hacked by Org A" },
    });
    expect([403, 404]).toContain(response.statusCode);
    const stillRfqB = await prisma.rFQ.findUnique({
      where: { id: rfqBId },
      select: { title: true },
    });
    expect(stillRfqB?.title).toBe("Tenant B Private RFQ");
  });

  it("blocks cross-organization RFQ publish mutation", async () => {
    const draftB = await prisma.rFQ.create({
      data: {
        rfqNumber: "TENANT-B-DRAFT-" + Date.now(),
        title: "Tenant B Draft RFQ",
        status: "DRAFT",
        priority: "LOW",
        requestedById: (
          await prisma.user.findUniqueOrThrow({
            where: { email: "tenant-b-officer@example.com" },
          })
        ).id,
        organizationId: organizationB.id,
        items: { create: [{ name: "Item", quantity: 1, unit: "Unit" }] },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: `/api/rfqs/${draftB.id}/publish`,
      headers: { authorization: `Bearer ${officerAToken}` },
    });
    expect([403, 404]).toContain(response.statusCode);
    const stillDraft = await prisma.rFQ.findUnique({
      where: { id: draftB.id },
      select: { status: true },
    });
    expect(stillDraft?.status).toBe("DRAFT");
  });

  it("blocks cross-organization RFQ cancel mutation", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/api/rfqs/${rfqBId}/cancel`,
      headers: { authorization: `Bearer ${officerAToken}` },
      payload: { reason: "Malicious cancel" },
    });
    expect([403, 404]).toContain(response.statusCode);
    const stillOpen = await prisma.rFQ.findUnique({
      where: { id: rfqBId },
      select: { status: true },
    });
    expect(stillOpen?.status).toBe("OPEN");
  });

  it("blocks cross-organization vendor update mutation", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/vendors/${vendorBId}`,
      headers: { authorization: `Bearer ${adminAToken}` },
      payload: { companyName: "Hacked Vendor B Co." },
    });
    expect([403, 404]).toContain(response.statusCode);
    const vendorBProfile = await prisma.profile.findUnique({
      where: { userId: vendorBId },
      select: { companyName: true },
    });
    expect(vendorBProfile?.companyName).toBe("Tenant B Supplies");
  });

  it("returns different dashboard counts for different organizations", async () => {
    for (let i = 0; i < 4; i++) {
      await prisma.rFQ.create({
        data: {
          rfqNumber: "TENANT-A-DASH-" + Date.now() + "-" + i,
          title: "Tenant A Dashboard RFQ " + i,
          status: "OPEN",
          priority: "LOW",
          requestedById: (
            await prisma.user.findUniqueOrThrow({
              where: { email: "tenant-a-officer@example.com" },
            })
          ).id,
          organizationId: organizationA.id,
          items: {
            create: [{ name: "A Item " + i, quantity: 1, unit: "Unit" }],
          },
        },
      });
    }
    const [dashA, dashB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/dashboard/stats",
        headers: { authorization: `Bearer ${officerAToken}` },
      }),
      app.inject({
        method: "GET",
        url: "/api/dashboard/stats",
        headers: { authorization: `Bearer ${officerBToken}` },
      }),
    ]);
    expect(dashA.statusCode).toBe(200);
    expect(dashB.statusCode).toBe(200);
    const dataA = dashA.json().data;
    const dataB = dashB.json().data;
    const activeRfqA =
      typeof dataA?.cards?.activeRfqs === "number"
        ? dataA.cards.activeRfqs
        : -1;
    const activeRfqB =
      typeof dataB?.cards?.activeRfqs === "number"
        ? dataB.cards.activeRfqs
        : -1;
    const totalVendorsA =
      typeof dataA?.cards?.totalVendors === "number"
        ? dataA.cards.totalVendors
        : -1;
    const totalVendorsB =
      typeof dataB?.cards?.totalVendors === "number"
        ? dataB.cards.totalVendors
        : -1;
    expect(activeRfqA).toBeGreaterThanOrEqual(4);
    expect(totalVendorsA).toBeGreaterThanOrEqual(1);
    expect(activeRfqB).not.toBe(-1);
    expect(totalVendorsB).not.toBe(-1);
  });
});
