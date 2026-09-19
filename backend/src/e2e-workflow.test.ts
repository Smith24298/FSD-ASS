import { describe, it, expect, beforeAll } from "vitest";
import { createApp } from "./app/app";
import { prisma } from "./infrastructure/database/prisma";
import argon2 from "argon2";
import { FastifyInstance } from "fastify";

describe("VendorBridge End-to-End Procurement Flow", { timeout: 60000 }, () => {
  let app: FastifyInstance;
  let adminToken: string;
  let officerToken: string;
  let managerToken: string;
  let vendor1Token: string;
  let vendor2Token: string;

  let officerId: number;
  let managerId: number;
  let vendor1Id: number;
  let vendor2Id: number;

  let createdRfqId: number;
  let quote1Id: number;
  let quote2Id: number;
  let approvalId: number;
  let poId: number;
  let invoiceId: number;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();

    // Setup or retrieve test users in DB
    const hash = await argon2.hash("Password123!");

    // 1. Admin
    const admin = await prisma.user.upsert({
      where: { email: "e2e_admin@vendorbridge.com" },
      update: { passwordHash: hash },
      create: {
        organizationId: 1,
        email: "e2e_admin@vendorbridge.com",
        userName: "e2e_admin",
        name: "E2E Admin",
        role: "ADMIN",
        passwordHash: hash,
        isActive: true,
      },
    });

    // 2. Procurement Officer
    const officer = await prisma.user.upsert({
      where: { email: "e2e_officer@vendorbridge.com" },
      update: { passwordHash: hash },
      create: {
        organizationId: 1,
        email: "e2e_officer@vendorbridge.com",
        userName: "e2e_officer",
        name: "E2E Officer",
        role: "OFFICR",
        passwordHash: hash,
        isActive: true,
      },
    });
    officerId = officer.id;

    // 3. Manager
    const manager = await prisma.user.upsert({
      where: { email: "e2e_manager@vendorbridge.com" },
      update: { passwordHash: hash },
      create: {
        organizationId: 1,
        email: "e2e_manager@vendorbridge.com",
        userName: "e2e_manager",
        name: "E2E Finance Manager",
        role: "MANAGER",
        passwordHash: hash,
        isActive: true,
      },
    });
    managerId = manager.id;

    // 4. Vendor 1
    const vendor1 = await prisma.user.upsert({
      where: { email: "e2e_vendor1@example.com" },
      update: { passwordHash: hash },
      create: {
        email: "e2e_vendor1@example.com",
        userName: "e2e_vendor1",
        name: "TechSupply Corp",
        role: "VENDOR",
        passwordHash: hash,
        isActive: true,
        organizationId: 1,
        profile: {
          create: {
            organizationId: 1,
            companyName: "TechSupply Corporation Ltd",
            vendorCode: "VND-E2E-001",
            category: "Hardware",
            status: "ACTIVE",
            rating: 4.8,
            gstNumber: "07AAAAA0000A1Z5",
            address: "123 Tech Park, New Delhi",
            mobileNumber: "+91 98765 43210",
          },
        },
      },
    });
    vendor1Id = vendor1.id;

    // 5. Vendor 2
    const vendor2 = await prisma.user.upsert({
      where: { email: "e2e_vendor2@example.com" },
      update: { passwordHash: hash },
      create: {
        email: "e2e_vendor2@example.com",
        userName: "e2e_vendor2",
        name: "Global Instruments",
        role: "VENDOR",
        passwordHash: hash,
        isActive: true,
        organizationId: 1,
        profile: {
          create: {
            organizationId: 1,
            companyName: "Global Instruments Inc",
            vendorCode: "VND-E2E-002",
            category: "Hardware",
            status: "ACTIVE",
            rating: 4.2,
            gstNumber: "27BBBBB1111B1Z9",
            address: "456 Industrial Zone, Mumbai",
            mobileNumber: "+91 98765 43211",
          },
        },
      },
    });
    vendor2Id = vendor2.id;
  });

  it("Step 1: Authentication & JWT Login for all roles", async () => {
    // Login Officer
    const offRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "e2e_officer@vendorbridge.com",
        password: "Password123!",
      },
    });
    expect(offRes.statusCode).toBe(200);
    officerToken = offRes.json().data.token;
    expect(officerToken).toBeDefined();

    // Login Manager
    const mgrRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "e2e_manager@vendorbridge.com",
        password: "Password123!",
      },
    });
    expect(mgrRes.statusCode).toBe(200);
    managerToken = mgrRes.json().data.token;
    expect(managerToken).toBeDefined();

    // Login Vendor 1
    const v1Res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "e2e_vendor1@example.com", password: "Password123!" },
    });
    expect(v1Res.statusCode).toBe(200);
    vendor1Token = v1Res.json().data.token;
    expect(vendor1Token).toBeDefined();

    // Login Vendor 2
    const v2Res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "e2e_vendor2@example.com", password: "Password123!" },
    });
    expect(v2Res.statusCode).toBe(200);
    vendor2Token = v2Res.json().data.token;
    expect(vendor2Token).toBeDefined();
  });

  it("Step 2: Officer creates and publishes an RFQ with invited suppliers", async () => {
    const deadline = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const createRes = await app.inject({
      method: "POST",
      url: "/api/rfqs",
      headers: { authorization: `Bearer ${officerToken}` },
      payload: {
        title: "E2E Procurement of Server Equipment",
        description: "High-availability rack servers and networking switches",
        deadline,
        vendorIds: [vendor1Id, vendor2Id],
        items: [
          { name: "Rack Server 2U", quantity: 2, unit: "Units" },
          { name: "Managed 48-Port Switch", quantity: 4, unit: "Units" },
        ],
      },
    });

    expect(createRes.statusCode).toBe(201);
    const rfq = createRes.json().data;
    expect(rfq.status).toBe("DRAFT");
    createdRfqId = rfq.id;

    // Publish RFQ
    const pubRes = await app.inject({
      method: "POST",
      url: `/api/rfqs/${createdRfqId}/publish`,
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(pubRes.statusCode).toBe(200);
    expect(pubRes.json().data.status).toBe("PUBLISHED");
  });

  it("Step 3: Vendor 1 saves draft quotation, then submits final bid", async () => {
    // Get RFQ details as Vendor 1 to find item IDs
    const rfqRes = await app.inject({
      method: "GET",
      url: `/api/rfqs/${createdRfqId}`,
      headers: { authorization: `Bearer ${vendor1Token}` },
    });
    expect(rfqRes.statusCode).toBe(200);
    const items = rfqRes.json().data.items;

    // Save as DRAFT first
    const draftRes = await app.inject({
      method: "POST",
      url: "/api/quotations",
      headers: { authorization: `Bearer ${vendor1Token}` },
      payload: {
        rfqId: createdRfqId,
        isDraft: true,
        currency: "INR",
        deliveryDays: 5,
        paymentTerms: "Net 30",
        items: [
          {
            rfqItemId: items[0].id,
            name: items[0].name,
            quantity: 2,
            unitPrice: 180000,
            tax: 32400,
          },
          {
            rfqItemId: items[1].id,
            name: items[1].name,
            quantity: 4,
            unitPrice: 45000,
            tax: 16200,
          },
        ],
      },
    });
    expect(draftRes.statusCode).toBe(201);
    const draft = draftRes.json().data;
    expect(draft.status).toBe("DRAFT");
    quote1Id = draft.id;

    // Submit the draft
    const submitRes = await app.inject({
      method: "POST",
      url: `/api/quotations/${quote1Id}/submit`,
      headers: { authorization: `Bearer ${vendor1Token}` },
    });
    expect(submitRes.statusCode).toBe(200);
    expect(submitRes.json().data.status).toBe("SUBMITTED");
  });

  it("Step 4: Vendor 2 submits a competing bid", async () => {
    const rfqRes = await app.inject({
      method: "GET",
      url: `/api/rfqs/${createdRfqId}`,
      headers: { authorization: `Bearer ${vendor2Token}` },
    });
    const items = rfqRes.json().data.items;

    const quote2Res = await app.inject({
      method: "POST",
      url: "/api/quotations",
      headers: { authorization: `Bearer ${vendor2Token}` },
      payload: {
        rfqId: createdRfqId,
        currency: "INR",
        deliveryDays: 10,
        paymentTerms: "Net 45",
        items: [
          {
            rfqItemId: items[0].id,
            name: items[0].name,
            quantity: 2,
            unitPrice: 195000,
            tax: 35100,
          },
          {
            rfqItemId: items[1].id,
            name: items[1].name,
            quantity: 4,
            unitPrice: 42000,
            tax: 15120,
          },
        ],
      },
    });
    expect(quote2Res.statusCode).toBe(201);
    expect(quote2Res.json().data.status).toBe("SUBMITTED");
    quote2Id = quote2Res.json().data.id;
  });

  it("Step 5: Officer evaluates Side-by-Side Quotation Comparison Matrix", async () => {
    const compareRes = await app.inject({
      method: "GET",
      url: `/api/rfqs/${createdRfqId}/compare`,
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(compareRes.statusCode).toBe(200);
    const comp = compareRes.json().data;

    expect(comp.quotations).toHaveLength(2);
    expect(comp.summary.totalQuotations).toBe(2);
    expect(comp.summary.lowestTotalQuoteId).toBe(quote1Id); // Vendor 1 is cheaper overall
    expect(comp.summary.fastestDeliveryDays).toBe(5); // Vendor 1 is 5 days vs 10 days
    expect(comp.summary.itemComparisons).toHaveLength(2);
  });

  it("Step 6: Officer shortlists winning quote, creating Approval request for Manager", async () => {
    // Fast-forward RFQ status/deadline so shortlist is permitted
    await prisma.rFQ.update({
      where: { id: createdRfqId },
      data: {
        status: "CLOSED",
        quotationDeadline: new Date(Date.now() - 1000),
      },
    });

    const shortlistRes = await app.inject({
      method: "POST",
      url: `/api/rfqs/${createdRfqId}/shortlist/${quote1Id}`,
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(shortlistRes.statusCode).toBe(200);
    expect(shortlistRes.json().data.status).toBe("SHORTLISTED");
  });

  it("Step 7: Finance Manager reviews and approves the quotation", async () => {
    // List pending approvals
    const listRes = await app.inject({
      method: "GET",
      url: "/api/approvals?status=PENDING",
      headers: { authorization: `Bearer ${managerToken}` },
    });
    expect(listRes.statusCode).toBe(200);
    const approvals = listRes.json().data;
    const req = approvals.find((a: any) => a.rfqId === createdRfqId);
    expect(req).toBeDefined();
    approvalId = req.id;

    // Test rejection validation (mandatory comment)
    const badRejectRes = await app.inject({
      method: "POST",
      url: `/api/approvals/${approvalId}/reject`,
      headers: { authorization: `Bearer ${managerToken}` },
      payload: { comment: "" },
    });
    expect(badRejectRes.statusCode).toBe(400); // Fails validation because comment is mandatory

    // Approve quotation
    const appRes = await app.inject({
      method: "POST",
      url: `/api/approvals/${approvalId}/approve`,
      headers: { authorization: `Bearer ${managerToken}` },
      payload: {
        comment:
          "Approved. Pricing is competitive and within allocated FY26 budget.",
      },
    });
    expect(appRes.statusCode).toBe(200);
    expect(appRes.json().data.status).toBe("APPROVED");
  });

  it("Step 8: Officer awards the RFQ and generates Purchase Order", async () => {
    const awardRes = await app.inject({
      method: "POST",
      url: `/api/rfqs/${createdRfqId}/award`,
      headers: { authorization: `Bearer ${officerToken}` },
      payload: { quotationId: quote1Id },
    });
    expect(awardRes.statusCode).toBe(200);
    expect(awardRes.json().data.status).toBe("AWARDED");

    // Verify PO was created in DB
    const poListRes = await app.inject({
      method: "GET",
      url: `/api/purchase-orders?rfqId=${createdRfqId}`,
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(poListRes.statusCode).toBe(200);
    const pos = poListRes.json().data;
    expect(pos).toHaveLength(1);
    expect(pos[0].poNumber).toMatch(/^PO-\d{4}-\d{6}$/);
    poId = pos[0].id;
  });

  it("Step 9: Generate Invoice from Purchase Order", async () => {
    const invRes = await app.inject({
      method: "POST",
      url: "/api/invoices",
      headers: { authorization: `Bearer ${officerToken}` },
      payload: {
        purchaseOrderId: poId,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Remit payment to vendor account upon inspection",
      },
    });
    expect(invRes.statusCode).toBe(201);
    const invoice = invRes.json().data;
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}$/);
    expect(invoice.status).toBe("ISSUED");
    invoiceId = invoice.id;
  });

  it("Step 10: Invoice PDF Generation, Email Dispatch & Payment", async () => {
    // 1. PDF Download
    const pdfRes = await app.inject({
      method: "GET",
      url: `/api/invoices/${invoiceId}/pdf`,
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(pdfRes.statusCode).toBe(200);
    expect(pdfRes.headers["content-type"]).toBe("application/pdf");
    expect(pdfRes.rawPayload.length).toBeGreaterThan(1000); // Valid PDF stream

    // 2. Email Invoice
    const emailRes = await app.inject({
      method: "POST",
      url: `/api/invoices/${invoiceId}/email`,
      headers: { authorization: `Bearer ${officerToken}` },
      payload: {
        recipientEmail: "accounts@techsupply.com",
        customMessage: "Please find attached invoice for server procurement PO",
      },
    });
    expect(emailRes.statusCode).toBe(200);
    expect(emailRes.json().success).toBe(true);

    // 3. Mark invoice as PAID
    const payRes = await app.inject({
      method: "PATCH",
      url: `/api/invoices/${invoiceId}/status`,
      headers: { authorization: `Bearer ${officerToken}` },
      payload: { status: "PAID", notes: "NEFT transfer completed" },
    });
    expect(payRes.statusCode).toBe(200);
    expect(payRes.json().data.status).toBe("PAID");
  });

  it("Step 11: Audit Activity Trail & Reports CSV Export", async () => {
    // Activity trail for RFQ
    const actRes = await app.inject({
      method: "GET",
      url: `/api/rfqs/${createdRfqId}/activity`,
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(actRes.statusCode).toBe(200);
    const acts = actRes.json().data;
    expect(acts.length).toBeGreaterThanOrEqual(4);

    // Dashboard stats
    const dashRes = await app.inject({
      method: "GET",
      url: "/api/dashboard/stats",
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(dashRes.statusCode).toBe(200);
    expect(dashRes.json().data.totalSpend).toBeDefined();

    // Reports Analytics
    const rptRes = await app.inject({
      method: "GET",
      url: "/api/reports/analytics",
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(rptRes.statusCode).toBe(200);
    const analytics = rptRes.json().data;
    expect(analytics.spendingByVendor).toBeDefined();
    expect(analytics.vendorPerformance).toBeDefined();

    // Reports CSV Export
    const csvRes = await app.inject({
      method: "GET",
      url: "/api/reports/export",
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(csvRes.statusCode).toBe(200);
    expect(csvRes.headers["content-type"]).toBe("text/csv");
    expect(csvRes.payload).toContain("PO Number");
    expect(csvRes.payload).toContain("Subtotal");
  });
});
