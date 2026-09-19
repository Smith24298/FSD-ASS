-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VENDOR', 'OFFICR', 'MANAGER');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendorProfile" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "gstNumber" TEXT NOT NULL,
    "mobilNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "Quantity" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "rfqId" INTEGER NOT NULL,

    CONSTRAINT "RFQItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_userName_key" ON "user"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "vendorProfile_profileId_key" ON "vendorProfile"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "vendorProfile_gstNumber_key" ON "vendorProfile"("gstNumber");

-- AddForeignKey
ALTER TABLE "vendorProfile" ADD CONSTRAINT "vendorProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQItem" ADD CONSTRAINT "RFQItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
