import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../../../generated/prisma/client.js";

const h = vi.hoisted(() => {
  const rfqRepository = {
    generateRfqNumber: vi.fn(),
    create: vi.fn(),
    findUniqueById: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateWhere: vi.fn(),
    findVendorUsersByIds: vi.fn(),
    findActiveVendorById: vi.fn(),
    createInvitation: vi.fn(),
    findInvitation: vi.fn(),
    updateInvitation: vi.fn(),
    deleteInvitation: vi.fn(),
    updateInvitationsForRfq: vi.fn(),
    createActivity: vi.fn(),
    createActivityMany: vi.fn(),
    findManagers: vi.fn(),
    findDueRfqs: vi.fn(),
    findApproachingDeadlineRfqs: vi.fn(),
  };
  const quotationRepository = {
    findById: vi.fn(),
    findByRfqAndVendor: vi.fn(),
    generateQuotationNumber: vi.fn().mockResolvedValue("QT-2026-000001"),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  };
  const approvalRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByRfq: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    updateStatus: vi.fn(),
  };
  const notificationService = {
    notify: vi.fn(),
    notifyMany: vi.fn(),
  };
  const notificationRepository = {
    findExisting: vi.fn(),
  };
  const purchaseOrderService = {
    createFromQuotation: vi.fn(),
  };
  const storage = {
    saveFile: vi.fn(),
    deleteFile: vi.fn(),
    getFilePath: vi.fn(),
  };
  const prisma = {
    $transaction: vi.fn(async (fn: (tx: any) => any) => fn({})),
  };
  return {
    rfqRepository,
    quotationRepository,
    approvalRepository,
    notificationService,
    notificationRepository,
    purchaseOrderService,
    storage,
    prisma,
  };
});

vi.mock("../../infrastructure/database/prisma", () => ({ prisma: h.prisma }));
vi.mock("./rfq.repository", () => ({ rfqRepository: h.rfqRepository }));
vi.mock("../quotation/quotation.repository", () => ({
  quotationRepository: h.quotationRepository,
}));
vi.mock("../approval/approval.repository", () => ({
  approvalRepository: h.approvalRepository,
}));
vi.mock("../notification/notification.service", () => ({
  notificationService: h.notificationService,
}));
vi.mock("../notification/notification.repository", () => ({
  notificationRepository: h.notificationRepository,
}));
vi.mock("../purchase-order/purchase-order.service", () => ({
  purchaseOrderService: h.purchaseOrderService,
}));
vi.mock("../../infrastructure/storage/storage", () => ({
  saveFile: h.storage.saveFile,
  deleteFile: h.storage.deleteFile,
  getFilePath: h.storage.getFilePath,
}));

import { rfqService } from "./rfq.service";
import { quotationService } from "../quotation/quotation.service";
import { approvalService } from "../approval/approval.service";
import { resolveRfqDeadlineState } from "./rfq.state-helpers";
import { AppError } from "../../shared/errors/app-error";

const rfqRepository = h.rfqRepository;
const quotationRepository = h.quotationRepository;
const approvalRepository = h.approvalRepository;
const notificationService = h.notificationService;

interface RfqFixture {
  id: number;
  rfqNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  requestedById: number;
  quotationDeadline: Date | null;
  vendors: any[];
  quotations: any[];
  items?: any[];
  [key: string]: any;
}

function makeRfq(over: Partial<RfqFixture> = {}): any {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return {
    id: 1,
    rfqNumber: "RFQ-20260917-ABC123",
    title: "Office Laptops",
    description: "Need ten units",
    status: "DRAFT",
    priority: "MEDIUM",
    requestedById: 1,
    requestedBy: {
      id: 1,
      name: "Officer A",
      email: "officer@x.io",
      role: "OFFICR",
    },
    quotationDeadline: future,
    expectedDeliveryDate: null,
    publishedAt: null,
    closedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 1,
        rfqId: 1,
        productId: 1,
        name: "Laptop",
        description: null,
        quantity: 10,
        unit: "unit",
        technicalRequirements: null,
        expectedDeliveryDate: null,
      },
    ],
    vendors: [
      {
        id: 1,
        rfqId: 1,
        vendorId: 10,
        status: "INVITED",
        invitedAt: new Date(),
        viewedAt: null,
        respondedAt: null,
        declineReason: null,
        vendor: { id: 10, name: "Vendor A", email: "v@x.io" },
      },
    ],
    attachments: [],
    activities: [],
    quotations: [],
    approvals: [],
    ...over,
  };
}

const officer = {
  id: 1,
  name: "Officer A",
  email: "officer@x.io",
  role: "OFFICR",
} as any;
const vendorUser = {
  id: 10,
  name: "Vendor A",
  email: "v@x.io",
  role: "VENDOR",
} as any;
const managerUser = {
  id: 2,
  name: "Manager B",
  email: "m@x.io",
  role: "MANAGER",
} as any;

const expectOperationalError = (error: any, code: string) => {
  expect(error).toBeInstanceOf(AppError);
  expect(error.isOperational).toBe(true);
  expect(error.code).toBe(code);
};

beforeEach(() => {
  vi.resetAllMocks();
  h.prisma.$transaction.mockImplementation(async (fn: (tx: any) => any) =>
    fn({}),
  );
});

describe("RFQ publish guards", () => {
  it("rejects publishing without items", async () => {
    const rfq = makeRfq({ status: "DRAFT", items: [] });
    rfqRepository.findUniqueById.mockResolvedValueOnce(rfq);

    await expect(rfqService.publish(officer, 1)).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "RFQ_ITEMS_REQUIRED");
      return true;
    });
  });

  it("rejects publishing without a deadline", async () => {
    const rfq = makeRfq({ status: "DRAFT", quotationDeadline: null });
    rfqRepository.findUniqueById.mockResolvedValueOnce(rfq);

    await expect(rfqService.publish(officer, 1)).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "RFQ_DEADLINE_REQUIRED");
      return true;
    });
  });

  it("rejects publishing with a past deadline", async () => {
    const rfq = makeRfq({ status: "DRAFT" });
    rfq.quotationDeadline = new Date(Date.now() - 1000);
    rfqRepository.findUniqueById.mockResolvedValueOnce(rfq);

    await expect(rfqService.publish(officer, 1)).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "RFQ_DEADLINE_IN_PAST");
      return true;
    });
  });

  it("rejects publishing without vendors", async () => {
    const rfq = makeRfq({ status: "DRAFT", vendors: [] });
    rfqRepository.findUniqueById.mockResolvedValueOnce(rfq);

    await expect(rfqService.publish(officer, 1)).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "VENDORS_REQUIRED");
      return true;
    });
  });

  it("publishes a valid draft and notifies invited vendors", async () => {
    const draft = makeRfq({ status: "DRAFT" });
    rfqRepository.findUniqueById.mockImplementation(async () => {
      if ((rfqRepository.findUniqueById as any).mock.calls.length === 1) {
        return draft;
      }
      return makeRfq({ status: "PUBLISHED" });
    });
    rfqRepository.findVendorUsersByIds.mockResolvedValue([
      { id: 10, name: "Vendor A" },
    ]);

    const result = await rfqService.publish(officer, 1);

    expect(rfqRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: "PUBLISHED" }),
      {},
    );
    expect(rfqRepository.createActivity).toHaveBeenCalled();
    expect(notificationService.notifyMany).toHaveBeenCalledWith(
      [10],
      "RFQ_PUBLISHED",
      expect.any(String),
      expect.any(String),
      "/rfqs/1",
    );
    expect(result.effectiveStatus).toBe("OPEN");
  });
});

describe("RFQ create vendor validation", () => {
  it("rejects creation with an invalid vendor id", async () => {
    rfqRepository.generateRfqNumber.mockResolvedValueOnce("RFQ-TEST-AABBCC");
    rfqRepository.findVendorUsersByIds.mockResolvedValueOnce([]);

    await expect(
      rfqService.create(
        officer,
        {
          title: "RFQ",
          items: [{ name: "Laptop", quantity: 1 }],
          deadline: new Date(Date.now() + 86400000).toISOString(),
          vendorIds: [999],
        },
        false,
      ),
    ).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "INVALID_VENDOR");
      return true;
    });
  });
});

describe("Quotation submission rules", () => {
  it("rejects a vendor who is not invited", async () => {
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "PUBLISHED" }),
    );
    rfqRepository.findInvitation.mockResolvedValueOnce(null);

    await expect(
      quotationService.submit(vendorUser, {
        rfqId: 1,
        currency: "USD",
        deliveryDays: 5,
        validityDays: 10,
        items: [{ name: "Laptop", quantity: 1, unitPrice: 1000 }],
      }),
    ).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "NOT_INVITED");
      return true;
    });
  });

  it("rejects a vendor who declined the invitation", async () => {
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "PUBLISHED" }),
    );
    rfqRepository.findInvitation.mockResolvedValueOnce({ status: "DECLINED" });

    await expect(
      quotationService.submit(vendorUser, {
        rfqId: 1,
        currency: "USD",
        deliveryDays: 5,
        validityDays: 10,
        items: [{ name: "Laptop", quantity: 1, unitPrice: 1000 }],
      }),
    ).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "INVITATION_DECLINED");
      return true;
    });
  });

  it("rejects a second quotation for the same RFQ", async () => {
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "PUBLISHED" }),
    );
    rfqRepository.findInvitation.mockResolvedValueOnce({
      status: "INVITED",
      invitedAt: new Date(),
    });
    quotationRepository.findByRfqAndVendor.mockResolvedValueOnce({
      id: 5,
      status: "SUBMITTED",
    });

    await expect(
      quotationService.submit(vendorUser, {
        rfqId: 1,
        currency: "USD",
        deliveryDays: 5,
        validityDays: 10,
        items: [{ name: "Laptop", quantity: 1, unitPrice: 1000 }],
      }),
    ).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "QUOTATION_ALREADY_SUBMITTED");
      return true;
    });
  });

  it("rejects submission after the deadline", async () => {
    const rfq = makeRfq({ status: "PUBLISHED" });
    rfq.quotationDeadline = new Date(Date.now() - 1000);
    rfq.quotations = [];
    rfqRepository.findUniqueById
      .mockResolvedValueOnce(rfq)
      .mockResolvedValue(makeRfq({ status: "EXPIRED" }));
    rfqRepository.findInvitation.mockResolvedValueOnce({
      status: "INVITED",
      invitedAt: new Date(),
    });

    await expect(
      quotationService.submit(vendorUser, {
        rfqId: 1,
        currency: "USD",
        deliveryDays: 5,
        validityDays: 10,
        items: [{ name: "Laptop", quantity: 1, unitPrice: 1000 }],
      }),
    ).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "INVALID_RFQ_STATE");
      return true;
    });
  });

  it("creates a quotation with server-computed totals and notifies the officer", async () => {
    const rfq = makeRfq({ status: "PUBLISHED" });
    rfqRepository.findUniqueById.mockResolvedValueOnce(rfq);
    rfqRepository.findInvitation.mockResolvedValueOnce({
      status: "INVITED",
      invitedAt: new Date(),
    });
    quotationRepository.findByRfqAndVendor.mockResolvedValueOnce(null);
    quotationRepository.create.mockResolvedValueOnce({
      id: 5,
      currency: "USD",
      rfqId: 1,
      vendorId: 10,
    });
    quotationRepository.findById.mockResolvedValueOnce(
      makeQuotationFixture({ totalAmount: new Prisma.Decimal("1000") }),
    );

    await quotationService.submit(vendorUser, {
      rfqId: 1,
      currency: "USD",
      deliveryDays: 5,
      validityDays: 10,
      items: [{ name: "Laptop", quantity: 2, unitPrice: 500 }],
    });

    expect(quotationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        totalAmount: new Prisma.Decimal("1000"),
        items: expect.arrayContaining([
          expect.objectContaining({
            unitPrice: new Prisma.Decimal("500"),
            subtotal: new Prisma.Decimal("1000"),
          }),
        ]),
      }),
      expect.anything(),
    );
    expect(rfqRepository.updateInvitation).toHaveBeenCalledWith(
      1,
      10,
      expect.objectContaining({ status: "QUOTATION_SUBMITTED" }),
      expect.anything(),
    );
    expect(notificationService.notify).toHaveBeenCalledWith(
      1,
      "QUOTATION_SUBMITTED",
      expect.any(String),
      expect.stringContaining("1000"),
      "/rfqs/1",
    );
  });
});

function makeQuotationFixture(over: Record<string, any> = {}) {
  return {
    id: 5,
    rfqId: 1,
    vendorId: 10,
    status: "SUBMITTED",
    totalAmount: new Prisma.Decimal("0"),
    currency: "USD",
    paymentTerms: null,
    deliveryDays: 5,
    deliveryDate: null,
    validityDays: 10,
    notes: null,
    submittedAt: new Date(),
    updatedAt: new Date(),
    rfq: makeRfq({ status: "CLOSED" }),
    vendor: { id: 10, name: "Vendor A", email: "v@x.io" },
    items: [],
    approval: null,
    ...over,
  };
}

describe("Shortlist and approval workflow", () => {
  it("rejects shortlisting before the deadline has passed", async () => {
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "PUBLISHED" }),
    );
    rfqRepository.findInvitation.mockResolvedValueOnce(() => {});

    await expect(quotationService.shortlist(officer, 1, 5)).rejects.toSatisfy(
      (e: any) => {
        expectOperationalError(e, "RFQ_DEADLINE_NOT_REACHED");
        return true;
      },
    );
  });

  it("shortlists a quotation, moves RFQ to SHORTLISTED and requests approval", async () => {
    const rfq = makeRfq({ status: "CLOSED" });
    rfqRepository.findUniqueById.mockResolvedValueOnce(rfq);
    quotationRepository.findById.mockResolvedValueOnce(makeQuotationFixture());
    approvalRepository.findByRfq.mockResolvedValueOnce(null);
    rfqRepository.findManagers.mockResolvedValueOnce([managerUser]);
    quotationRepository.findById.mockResolvedValueOnce(makeQuotationFixture());

    await quotationService.shortlist(officer, 1, 5);

    expect(quotationRepository.updateStatus).toHaveBeenCalledWith(
      5,
      "SHORTLISTED",
      {},
    );
    expect(rfqRepository.update).toHaveBeenCalledWith(
      1,
      { status: "SHORTLISTED" },
      {},
    );
    expect(approvalRepository.create).toHaveBeenCalledWith(
      { rfqId: 1, quotationId: 5, requestedById: 1 },
      {},
    );
    expect(notificationService.notifyMany).toHaveBeenCalledWith(
      [2],
      "APPROVAL_REQUESTED",
      expect.any(String),
      expect.any(String),
      "/rfqs/1",
    );
    expect(notificationService.notify).toHaveBeenCalledWith(
      10,
      "QUOTATION_SHORTLISTED",
      expect.any(String),
      expect.any(String),
      "/rfqs/1",
    );
  });

  it("rejects shortlisting a quotation that is not SUBMITTED", async () => {
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "CLOSED" }),
    );
    quotationRepository.findById.mockResolvedValueOnce(
      makeQuotationFixture({ status: "SHORTLISTED" }),
    );

    await expect(quotationService.shortlist(officer, 1, 5)).rejects.toSatisfy(
      (e: any) => {
        expectOperationalError(e, "INVALID_QUOTATION_STATE");
        return true;
      },
    );
  });
});

describe("Approval decisions", () => {
  const pendingApproval = (over: Record<string, any> = {}) => ({
    id: 9,
    rfqId: 1,
    quotationId: 5,
    requestedById: 1,
    approvedById: null,
    status: "PENDING",
    requestedAt: new Date(),
    decidedAt: null,
    comment: null,
    rfq: { id: 1, rfqNumber: "RFQ-20260917-ABC123" },
    quotation: { id: 5, vendorId: 10 },
    ...over,
  });

  it("approves a pending request and approves the quotation", async () => {
    approvalRepository.findById
      .mockResolvedValueOnce(pendingApproval())
      .mockResolvedValueOnce(pendingApproval({ status: "APPROVED" }));

    await approvalService.approve(managerUser, 9, { comment: "Looks good" });

    expect(approvalRepository.updateStatus).toHaveBeenCalledWith(
      9,
      expect.objectContaining({
        status: "APPROVED",
        approvedById: 2,
        comment: "Looks good",
      }),
      {},
    );
    expect(quotationRepository.updateStatus).toHaveBeenCalledWith(
      5,
      "APPROVED",
      {},
    );
    expect(notificationService.notify).toHaveBeenCalledWith(
      1,
      "APPROVAL_DECISION",
      expect.any(String),
      expect.any(String),
      "/rfqs/1",
    );
  });

  it("rejects a pending request and moves the RFQ back to review", async () => {
    approvalRepository.findById
      .mockResolvedValueOnce(pendingApproval())
      .mockResolvedValueOnce(pendingApproval({ status: "REJECTED" }));

    await approvalService.reject(managerUser, 9, { comment: "Too expensive" });

    expect(approvalRepository.updateStatus).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ status: "REJECTED" }),
      {},
    );
    expect(quotationRepository.updateStatus).toHaveBeenCalledWith(
      5,
      "REJECTED",
      {},
    );
    expect(rfqRepository.update).toHaveBeenCalledWith(
      1,
      { status: "UNDER_REVIEW" },
      {},
    );
  });

  it("rejects double decisions", async () => {
    approvalRepository.findById.mockResolvedValueOnce(
      pendingApproval({ status: "APPROVED" }),
    );

    await expect(approvalService.approve(managerUser, 9, {})).rejects.toSatisfy(
      (e: any) => {
        expectOperationalError(e, "APPROVAL_ALREADY_DECIDED");
        return true;
      },
    );
  });
});

describe("Award", () => {
  it("requires the RFQ to be shortlisted", async () => {
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "CLOSED" }),
    );

    await expect(rfqService.award(officer, 1, 5)).rejects.toSatisfy(
      (e: any) => {
        expectOperationalError(e, "INVALID_RFQ_STATE");
        return true;
      },
    );
  });

  it("requires an approved approval request", async () => {
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "SHORTLISTED" }),
    );
    quotationRepository.findById.mockResolvedValueOnce(
      makeQuotationFixture({ status: "APPROVED" }),
    );
    approvalRepository.findByRfq.mockResolvedValueOnce({
      status: "PENDING",
      quotationId: 5,
    });

    await expect(rfqService.award(officer, 1, 5)).rejects.toSatisfy(
      (e: any) => {
        expectOperationalError(e, "APPROVAL_REQUIRED");
        return true;
      },
    );
  });

  it("awards the winner, revokes the rest and notifies the winner", async () => {
    rfqRepository.findUniqueById
      .mockResolvedValueOnce(makeRfq({ status: "SHORTLISTED" }))
      .mockResolvedValue(makeRfq({ status: "AWARDED" }));
    quotationRepository.findById.mockResolvedValueOnce(
      makeQuotationFixture({ status: "APPROVED" }),
    );
    approvalRepository.findByRfq.mockResolvedValueOnce({
      status: "APPROVED",
      quotationId: 5,
    });

    const result = await rfqService.award(officer, 1, 5);

    expect(quotationRepository.updateStatus).toHaveBeenCalledWith(
      5,
      "AWARDED",
      {},
    );
    expect(quotationRepository.updateMany).toHaveBeenCalledWith(
      {
        rfqId: 1,
        id: { not: 5 },
        status: { in: ["SUBMITTED", "SHORTLISTED", "APPROVED"] },
      },
      { status: "REVOKED" },
      {},
    );
    expect(rfqRepository.update).toHaveBeenCalledWith(
      1,
      { status: "AWARDED" },
      {},
    );
    expect(h.purchaseOrderService.createFromQuotation).toHaveBeenCalledWith(
      officer,
      { quotationId: 5 },
    );
    expect(notificationService.notify).toHaveBeenCalledWith(
      10,
      "RFQ_AWARDED",
      expect.any(String),
      expect.any(String),
      "/rfqs/1",
    );
    expect(result.status).toBe("AWARDED");
  });
});

describe("Vendor data isolation", () => {
  it("hides other vendors and quotations from an invited vendor", async () => {
    const rfq = makeRfq({ status: "PUBLISHED" });
    rfq.quotations = [
      {
        id: 5,
        rfqId: 1,
        vendorId: 10,
        status: "SUBMITTED",
        totalAmount: new Prisma.Decimal("1000"),
        currency: "USD",
        submittedAt: new Date(),
        vendor: { id: 10, name: "Vendor A" },
      },
      {
        id: 6,
        rfqId: 1,
        vendorId: 11,
        status: "SUBMITTED",
        totalAmount: new Prisma.Decimal("900"),
        currency: "USD",
        submittedAt: new Date(),
        vendor: { id: 11, name: "Vendor B" },
      },
    ];
    rfq.vendors[0].viewedAt = new Date();
    rfqRepository.findUniqueById.mockResolvedValueOnce(rfq);

    const result = await rfqService.getDetail(vendorUser, 1);

    expect(result.vendors).toEqual([]);
    expect(result.quotations).toEqual([]);
    expect(result.activities).toEqual([]);
    expect(result.approvals).toEqual([]);
    expect(result.ownInvitation).toMatchObject({ status: "INVITED" });
    expect(result.ownQuotation).toMatchObject({ id: 5, totalAmount: "1000" });
  });

  it("returns 404 for a vendor who is not invited", async () => {
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "PUBLISHED" }),
    );

    await expect(
      rfqService.getDetail({ ...vendorUser, id: 99 } as any, 1),
    ).rejects.toSatisfy((e: any) => {
      expectOperationalError(e, "RFQ_NOT_FOUND");
      return true;
    });
  });
});

describe("Lazy deadline enforcement", () => {
  it("closes a due RFQ with quotations and expires pending invitations", async () => {
    const rfq = makeRfq({ status: "PUBLISHED" });
    rfq.quotationDeadline = new Date(Date.now() - 1000);
    rfq.quotations = [{ id: 5, rfqId: 1, vendorId: 10 }];
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "CLOSED" }),
    );

    const result = await resolveRfqDeadlineState(rfq);

    expect(rfqRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: "CLOSED" }),
      expect.anything(),
    );
    expect(rfqRepository.updateInvitationsForRfq).toHaveBeenCalledWith(
      1,
      { status: "EXPIRED" },
      { status: { in: ["INVITED", "VIEWED"] } },
      expect.anything(),
    );
    expect(rfqRepository.createActivity).toHaveBeenCalledWith(
      1,
      1,
      "RFQ_CLOSED",
      expect.any(String),
      expect.anything(),
    );
    expect(result.changed).toBe(true);
    expect(result.rfq?.status).toBe("CLOSED");
  });

  it("expires a due RFQ with no quotations", async () => {
    const rfq = makeRfq({ status: "PUBLISHED" });
    rfq.quotationDeadline = new Date(Date.now() - 1000);
    rfq.quotations = [];
    rfqRepository.findUniqueById.mockResolvedValueOnce(
      makeRfq({ status: "EXPIRED" }),
    );

    const result = await resolveRfqDeadlineState(rfq);

    expect(rfqRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: "EXPIRED" }),
      expect.anything(),
    );
    expect(rfqRepository.createActivity).toHaveBeenCalledWith(
      1,
      1,
      "RFQ_EXPIRED",
      expect.any(String),
      expect.anything(),
    );
    expect(result.rfq?.status).toBe("EXPIRED");
  });
});

describe("Invitation decline", () => {
  it("prevents declining after a quotation is submitted", async () => {
    rfqRepository.findInvitation.mockResolvedValueOnce({
      id: 1,
      status: "QUOTATION_SUBMITTED",
    });

    await expect(rfqService.decline(vendorUser, 1, "busy")).rejects.toSatisfy(
      (e: any) => {
        expectOperationalError(e, "QUOTATION_ALREADY_SUBMITTED");
        return true;
      },
    );
  });

  it("marks the invitation as declined", async () => {
    rfqRepository.findInvitation.mockResolvedValueOnce({
      id: 1,
      status: "INVITED",
    });

    await rfqService.decline(vendorUser, 1, "busy");

    expect(rfqRepository.updateInvitation).toHaveBeenCalledWith(
      1,
      10,
      expect.objectContaining({ status: "DECLINED", declineReason: "busy" }),
      {},
    );
  });
});
