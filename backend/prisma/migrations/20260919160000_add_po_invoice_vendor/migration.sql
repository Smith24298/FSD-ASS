-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'ISSUED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'OVERDUE');

-- AlterEnum
ALTER TYPE "ActivityEvent" ADD VALUE 'PO_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PO_ISSUED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PO_CANCELLED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PO_COMPLETED';
ALTER TYPE "ActivityEvent" ADD VALUE 'INVOICE_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'INVOICE_SENT';
ALTER TYPE "ActivityEvent" ADD VALUE 'INVOICE_PAID';
ALTER TYPE "ActivityEvent" ADD VALUE 'VENDOR_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'VENDOR_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'VENDOR_STATUS_CHANGED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PO_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'PO_ISSUED';
ALTER TYPE "NotificationType" ADD VALUE 'INVOICE_GENERATED';
ALTER TYPE "NotificationType" ADD VALUE 'INVOICE_SENT';

-- AlterEnum
ALTER TYPE "QuotationStatus" ADD VALUE 'DRAFT';
ALTER TYPE "QuotationStatus" ADD VALUE 'WITHDRAWN';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "category" TEXT,
ADD COLUMN     "rating" DECIMAL(65,30) DEFAULT 4.5,
ADD COLUMN     "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "vendorCode" TEXT;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "quotationNumber" TEXT,
ADD COLUMN     "subtotal" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "tax" DECIMAL(65,30) DEFAULT 0;

-- AlterTable
ALTER TABLE "QuotationItem" ADD COLUMN     "tax" DECIMAL(65,30) DEFAULT 0;

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" SERIAL NOT NULL,
    "poNumber" TEXT NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'ISSUED',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "subtotal" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "rfqItemId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_quotationId_key" ON "PurchaseOrder"("quotationId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_rfqId_idx" ON "PurchaseOrder"("rfqId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_poNumber_idx" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_purchaseOrderId_key" ON "Invoice"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "Invoice_purchaseOrderId_idx" ON "Invoice"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "Invoice_vendorId_idx" ON "Invoice"("vendorId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_vendorCode_key" ON "Profile"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "RFQItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
