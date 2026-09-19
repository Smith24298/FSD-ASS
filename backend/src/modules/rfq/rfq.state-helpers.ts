import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { rfqRepository } from "./rfq.repository";

export const ACCEPTING_STATUSES = ["PUBLISHED", "OPEN"];

/**
 * Lazy deadline enforcement. When a published RFQ's quotation deadline has
 * passed it transitions to CLOSED (at least one quotation) or EXPIRED (no
 * quotations). Non-responder invitations are marked EXPIRED. This guarantees
 * the backend enforces the deadline even without a scheduled job.
 */
export async function resolveRfqDeadlineState(rfq: any, now: Date = new Date()) {
  if (
    !rfq ||
    rfq.status === "CANCELLED" ||
    rfq.status === "EXPIRED" ||
    rfq.status === "AWARDED" ||
    rfq.status === "CLOSED" ||
    rfq.status === "UNDER_REVIEW" ||
    rfq.status === "SHORTLISTED" ||
    rfq.status === "AWAITING_APPROVAL" ||
    rfq.status === "DRAFT"
  ) {
    return { rfq, changed: false };
  }

  const deadline = rfq.quotationDeadline;
  if (!deadline || deadline > now) {
    return { rfq, changed: false };
  }

  const hasQuotations = (rfq.quotations ?? []).length > 0;
  const nextStatus = hasQuotations ? "CLOSED" : "EXPIRED";

  await prisma.$transaction(async (tx) => {
    await rfqRepository.update(
      rfq.id,
      { status: nextStatus as any, closedAt: hasQuotations ? now : rfq.closedAt ?? null },
      tx
    );
    await rfqRepository.updateInvitationsForRfq(
      rfq.id,
      { status: "EXPIRED" as any },
      { status: { in: ["INVITED", "VIEWED"] } },
      tx
    );
    await rfqRepository.createActivity(
      rfq.id,
      rfq.requestedById,
      hasQuotations ? "RFQ_CLOSED" : "RFQ_EXPIRED",
      hasQuotations
        ? "Quotation deadline reached. RFQ closed for submissions."
        : "Quotation deadline reached with no submissions. RFQ expired.",
      tx
    );
  });

  const updated = await rfqRepository.findUniqueById(rfq.id);
  return { rfq: updated, changed: true };
}

export async function processDueRfqs(now: Date = new Date()) {
  const due = await rfqRepository.findDueRfqs(now);
  const results: Array<{ id: number; status: string }> = [];
  for (const rfq of due) {
    const next = await resolveRfqDeadlineState(rfq, now);
    if (next.changed && next.rfq) {
      results.push({ id: next.rfq.id, status: next.rfq.status });
    }
  }
  return results;
}

export async function assertQuotationSubmissionAllowed(rfq: any, now: Date = new Date()) {
  if (!rfq) {
    throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
  }
  if (rfq.status === "CANCELLED" || rfq.status === "EXPIRED") {
    throw AppError.conflict(`RFQ is ${rfq.status}; quotations are no longer accepted`, "INVALID_RFQ_STATE");
  }
  if (rfq.status === "AWARDED" || rfq.status === "AWAITING_APPROVAL" || rfq.status === "SHORTLISTED") {
    throw AppError.conflict("RFQ is no longer accepting quotations", "RFQ_NOT_ACCEPTING");
  }
  if (rfq.status === "DRAFT" || rfq.status === "CLOSED" || rfq.status === "UNDER_REVIEW") {
    throw AppError.conflict("RFQ is not accepting quotations", "RFQ_NOT_ACCEPTING");
  }
  if (!rfq.quotationDeadline) {
    throw AppError.conflict("RFQ has no quotation deadline", "RFQ_DEADLINE_MISSING");
  }
  if (rfq.quotationDeadline <= now) {
    throw AppError.badRequest("Quotation deadline has passed", "RFQ_DEADLINE_PASSED");
  }
}