/*
  Warnings:

  - You are about to drop the `vendorProfile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdBy` to the `RFQ` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "vendorProfile" DROP CONSTRAINT "vendorProfile_profileId_fkey";

-- AlterTable
ALTER TABLE "RFQ" ADD COLUMN     "createdBy" INTEGER NOT NULL;

-- DropTable
DROP TABLE "vendorProfile";

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "gstNumber" TEXT NOT NULL,
    "mobilNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_profileId_key" ON "Profile"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_gstNumber_key" ON "Profile"("gstNumber");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
