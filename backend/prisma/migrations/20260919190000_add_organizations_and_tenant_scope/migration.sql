CREATE TABLE IF NOT EXISTS "Organization" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "gstNumber" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_code_key" ON "Organization"("code");
CREATE INDEX IF NOT EXISTS "Organization_isActive_idx" ON "Organization"("isActive");

INSERT INTO "Organization" ("name", "slug", "code", "updatedAt")
SELECT 'Default Organization', 'default', 'DEFAULT', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Organization" WHERE "slug" = 'default');

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "RFQActivity" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "ApprovalRequest" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;

UPDATE "User" SET "organizationId" = 1 WHERE "organizationId" IS NULL;
UPDATE "Profile" p SET "organizationId" = u."organizationId" FROM "User" u WHERE p."userId" = u."id";
UPDATE "RFQ" r SET "organizationId" = u."organizationId" FROM "User" u WHERE r."createdBy" = u."id";
UPDATE "RFQActivity" a SET "organizationId" = r."organizationId" FROM "RFQ" r WHERE a."rfqId" = r."id";
UPDATE "Quotation" q SET "organizationId" = r."organizationId" FROM "RFQ" r WHERE q."rfqId" = r."id";
UPDATE "ApprovalRequest" a SET "organizationId" = r."organizationId" FROM "RFQ" r WHERE a."rfqId" = r."id";
UPDATE "PurchaseOrder" p SET "organizationId" = r."organizationId" FROM "RFQ" r WHERE p."rfqId" = r."id";
UPDATE "Invoice" i SET "organizationId" = p."organizationId" FROM "PurchaseOrder" p WHERE i."purchaseOrderId" = p."id";
UPDATE "Notification" n SET "organizationId" = u."organizationId" FROM "User" u WHERE n."userId" = u."id";

ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Profile" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "RFQ" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "RFQActivity" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Quotation" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ApprovalRequest" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "PurchaseOrder" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RFQActivity" ADD CONSTRAINT "RFQActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "User_organizationId_role_idx" ON "User"("organizationId", "role");
CREATE INDEX "Profile_organizationId_idx" ON "Profile"("organizationId");
CREATE INDEX "RFQ_organizationId_status_idx" ON "RFQ"("organizationId", "status");
CREATE INDEX "RFQActivity_organizationId_createdAt_idx" ON "RFQActivity"("organizationId", "createdAt");
CREATE INDEX "Quotation_organizationId_status_idx" ON "Quotation"("organizationId", "status");
CREATE INDEX "ApprovalRequest_organizationId_status_idx" ON "ApprovalRequest"("organizationId", "status");
CREATE INDEX "PurchaseOrder_organizationId_status_idx" ON "PurchaseOrder"("organizationId", "status");
CREATE INDEX "Invoice_organizationId_status_idx" ON "Invoice"("organizationId", "status");
CREATE INDEX "Notification_organizationId_userId_idx" ON "Notification"("organizationId", "userId");
