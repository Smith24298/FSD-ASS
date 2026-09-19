-- CreateEnum
CREATE TYPE "RFQStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'OPEN', 'CLOSED', 'UNDER_REVIEW', 'SHORTLISTED', 'AWAITING_APPROVAL', 'AWARDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RFQPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RFQInvitationStatus" AS ENUM ('INVITED', 'VIEWED', 'QUOTATION_SUBMITTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'AWARDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityEvent" AS ENUM ('RFQ_CREATED', 'RFQ_UPDATED', 'RFQ_PUBLISHED', 'VENDOR_INVITED', 'RFQ_VIEWED', 'ATTACHMENT_UPLOADED', 'RFQ_CANCELLED', 'RFQ_EXPIRED', 'RFQ_CLOSED', 'RFQ_UNDER_REVIEW', 'QUOTATION_SUBMITTED', 'QUOTATION_UPDATED', 'QUOTATION_SHORTLISTED', 'APPROVAL_REQUESTED', 'APPROVAL_DECISION', 'RFQ_AWARDED', 'QUOTATION_REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RFQ_PUBLISHED', 'VENDOR_INVITED', 'RFQ_DEADLINE_APPROACHING', 'RFQ_CANCELLED', 'QUOTATION_SUBMITTED', 'QUOTATION_SHORTLISTED', 'APPROVAL_REQUESTED', 'APPROVAL_DECISION', 'RFQ_AWARDED');

-- AlterTable
ALTER TABLE "RFQ" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expectedDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "priority" "RFQPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "quotationDeadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "rfqNumber" TEXT NOT NULL,
ADD COLUMN     "status" "RFQStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RFQItem" DROP COLUMN "updateAt",
ADD COLUMN     "expectedDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "productId" INTEGER,
ADD COLUMN     "technicalRequirements" TEXT,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "Quantity",
ADD COLUMN     "Quantity" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "RFQVendor" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "status" "RFQInvitationStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "declineReason" TEXT,

    CONSTRAINT "RFQVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQAttachment" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQActivity" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "event" "ActivityEvent" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentTerms" TEXT,
    "validityDays" INTEGER,
    "deliveryDays" INTEGER,
    "deliveryDate" TIMESTAMP(3),
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "rfqItemId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30),
    "notes" TEXT,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "comment" TEXT,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RFQVendor_rfqId_idx" ON "RFQVendor"("rfqId");

-- CreateIndex
CREATE INDEX "RFQVendor_vendorId_idx" ON "RFQVendor"("vendorId");

-- CreateIndex
CREATE INDEX "RFQVendor_status_idx" ON "RFQVendor"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RFQVendor_rfqId_vendorId_key" ON "RFQVendor"("rfqId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQAttachment_storageKey_key" ON "RFQAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "RFQAttachment_rfqId_idx" ON "RFQAttachment"("rfqId");

-- CreateIndex
CREATE INDEX "RFQActivity_rfqId_idx" ON "RFQActivity"("rfqId");

-- CreateIndex
CREATE INDEX "RFQActivity_createdAt_idx" ON "RFQActivity"("createdAt");

-- CreateIndex
CREATE INDEX "RFQActivity_event_idx" ON "RFQActivity"("event");

-- CreateIndex
CREATE INDEX "Quotation_rfqId_idx" ON "Quotation"("rfqId");

-- CreateIndex
CREATE INDEX "Quotation_vendorId_idx" ON "Quotation"("vendorId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_rfqId_vendorId_key" ON "Quotation"("rfqId", "vendorId");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationItem_rfqItemId_idx" ON "QuotationItem"("rfqItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRequest_quotationId_key" ON "ApprovalRequest"("quotationId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_rfqId_idx" ON "ApprovalRequest"("rfqId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RFQ_rfqNumber_key" ON "RFQ"("rfqNumber");

-- CreateIndex
CREATE INDEX "RFQ_status_idx" ON "RFQ"("status");

-- CreateIndex
CREATE INDEX "RFQ_createdBy_idx" ON "RFQ"("createdBy");

-- CreateIndex
CREATE INDEX "RFQ_createdAt_idx" ON "RFQ"("createdAt");

-- CreateIndex
CREATE INDEX "RFQ_quotationDeadline_idx" ON "RFQ"("quotationDeadline");

-- CreateIndex
CREATE INDEX "RFQ_priority_idx" ON "RFQ"("priority");

-- CreateIndex
CREATE INDEX "RFQItem_rfqId_idx" ON "RFQItem"("rfqId");

-- CreateIndex
CREATE INDEX "RFQItem_productId_idx" ON "RFQItem"("productId");

-- AddForeignKey
ALTER TABLE "RFQVendor" ADD CONSTRAINT "RFQVendor_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQVendor" ADD CONSTRAINT "RFQVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQAttachment" ADD CONSTRAINT "RFQAttachment_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQAttachment" ADD CONSTRAINT "RFQAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQActivity" ADD CONSTRAINT "RFQActivity_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQActivity" ADD CONSTRAINT "RFQActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "RFQItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;