export type Role = "ADMIN" | "OFFICR" | "MANAGER" | "VENDOR";

export interface User {
  id: number;
  organizationId: number;
  isActive: boolean;
  organization?: { id: number; name: string; slug: string; code: string };
  name: string;
  email: string;
  userName: string;
  role: Role;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface RFQ {
  id: number;
  rfqNumber: string;
  title: string;
  description?: string;
  status: string;
  quotationDeadline?: string;
  expectedDeliveryDate?: string;
  budget?: string;
  currency?: string;
  createdAt: string;
  requestedBy?: User;
  vendors?: any[];
  items?: RFQItem[];
  quotations?: Quotation[];
}

export interface RFQItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  estimatedUnitPrice?: string;
}

export interface Quotation {
  id: number;
  quotationNumber?: string;
  rfqId: number;
  vendorId: number;
  status: string;
  subtotal?: string;
  tax?: string;
  totalAmount?: string;
  currency?: string;
  paymentTerms?: string;
  deliveryDays?: number;
  validityDays?: number;
  notes?: string;
  submittedAt?: string;
  updatedAt?: string;
  vendor?: User & { profile?: VendorProfile };
  rfq?: RFQ;
  items?: QuotationItem[];
  approval?: ApprovalRequest;
  purchaseOrder?: PurchaseOrder;
}

export interface QuotationItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice?: string;
  tax?: string;
  subtotal?: string;
}

export interface ApprovalRequest {
  id: number;
  rfqId: number;
  quotationId?: number;
  status: string;
  comment?: string;
  requestedAt?: string;
  decidedAt?: string;
  requestedBy?: User;
  decidedBy?: User;
  rfq?: RFQ;
  quotation?: Quotation;
}

export interface VendorProfile {
  companyName?: string;
  vendorCode?: string;
  category?: string;
  gstNumber?: string;
  address?: string;
  mobileNumber?: string;
  rating?: number;
  status?: string;
}

export interface Vendor {
  id: number;
  name: string;
  email: string;
  userName: string;
  role: Role;
  profile?: VendorProfile;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  rfqId: number;
  quotationId: number;
  vendorId: number;
  status: string;
  issueDate: string;
  deliveryDate?: string;
  subtotal: string;
  tax: string;
  total: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  vendor?: Vendor;
  rfq?: RFQ;
  quotation?: Quotation;
  items?: POItem[];
  invoice?: Invoice;
  createdBy?: User;
}

export interface POItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: string;
  tax: string;
  subtotal: string;
  total: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  purchaseOrderId: number;
  vendorId: number;
  status: string;
  issueDate: string;
  dueDate?: string;
  subtotal: string;
  tax: string;
  total: string;
  notes?: string;
  createdAt: string;
  vendor?: Vendor;
  purchaseOrder?: PurchaseOrder;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: string;
  tax: string;
  subtotal: string;
  total: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Activity {
  id: number;
  rfqId: number;
  userId: number;
  event: string;
  description: string;
  createdAt: string;
  user?: User;
  rfq?: RFQ;
}
