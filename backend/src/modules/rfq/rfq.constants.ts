export const RFQ_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "OPEN",
  "CLOSED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "AWAITING_APPROVAL",
  "AWARDED",
  "CANCELLED",
  "EXPIRED",
] as const;

export const RFQ_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const RFQ_INVITATION_STATUSES = [
  "INVITED",
  "VIEWED",
  "QUOTATION_SUBMITTED",
  "DECLINED",
  "EXPIRED",
] as const;

export const QUOTATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "SHORTLISTED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "AWARDED",
  "REVOKED",
  "WITHDRAWN",
] as const;

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

// A vendor may only see RFQs that are not internal drafts.
export const VENDOR_FORBIDDEN_STATUSES = ["DRAFT"] as const;

// Statuses in which the RFQ is still accepting vendor quotations.
export const ACCEPTING_QUOTATIONS_STATUSES = ["PUBLISHED", "OPEN"] as const;

// Statuses in which an officer is allowed to shortlist a quotation.
export const SHORTLISTABLE_RFQ_STATUSES = [
  "CLOSED",
  "UNDER_REVIEW",
  "SHORTLISTED",
] as const;

// Statuses that are terminal and forbid every kind of state transition.
export const TERMINAL_RFQ_STATUSES = [
  "CANCELLED",
  "AWARDED",
  "EXPIRED",
] as const;

export const RFQ_NUMBER_PREFIX = "RFQ";

// Hands-on statuses the comparison/approval workflow uses.
export const REVIEW_RFQ_STATUSES = [
  "CLOSED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "AWAITING_APPROVAL",
] as const;

export const RFQ_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "quotationDeadline",
  "title",
  "status",
] as const;