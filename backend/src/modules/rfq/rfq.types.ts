import { SafeUser } from "../../shared/types/index.js";
import {
  RFQInvitationStatus,
  RFQPriority,
  RFQStatus,
} from "../../../generated/prisma/enums.js";

export type UserRole = SafeUser["role"];

export interface RfqVendorInvitationResponse {
  id: number;
  vendor: SafeUser;
  status: RFQInvitationStatus;
  invitedAt: Date;
  viewedAt: Date | null;
  respondedAt: Date | null;
  declineReason: string | null;
}

export interface VendorOwnInvitationResponse {
  id: number;
  status: RFQInvitationStatus;
  invitedAt: Date;
  viewedAt: Date | null;
  respondedAt: Date | null;
  declineReason: string | null;
}

export interface RfqItemResponse {
  id: number;
  productId: number | null;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  technicalRequirements: string | null;
  expectedDeliveryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RfqAttachmentResponse {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: SafeUser | null;
  createdAt: Date;
}

export interface RfqActivityResponse {
  id: number;
  event: string;
  details: string | null;
  user: SafeUser | null;
  createdAt: Date;
}

export interface QuotationSummaryResponse {
  id: number;
  vendorId: number;
  vendorName: string;
  status: string;
  totalAmount: string | null;
  currency: string;
  submittedAt: Date;
}

export interface OwnQuotationSummaryResponse {
  id: number;
  status: string;
  totalAmount: string | null;
  currency: string;
  submittedAt: Date;
}

export interface RfqDetailResponse {
  id: number;
  rfqNumber: string;
  title: string;
  description: string | null;
  status: RFQStatus;
  effectiveStatus: RFQStatus;
  priority: RFQPriority;
  requestedBy: SafeUser;
  quotationDeadline: Date | null;
  expectedDeliveryDate: Date | null;
  publishedAt: Date | null;
  closedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: RfqItemResponse[];
  attachments: RfqAttachmentResponse[];
  vendors: RfqVendorInvitationResponse[];
  quotations: QuotationSummaryResponse[];
  ownInvitation: VendorOwnInvitationResponse | null;
  ownQuotation: OwnQuotationSummaryResponse | null;
  activities: RfqActivityResponse[];
}

export interface RfqListItem {
  id: number;
  rfqNumber: string;
  title: string;
  description: string | null;
  status: RFQStatus;
  effectiveStatus: RFQStatus;
  priority: RFQPriority;
  quotationDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  invitingVendorCount: number;
  quotationCount: number;
  requestedById: number;
}

export interface PaginatedRfqsResponse {
  data: RfqListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}