/*
  Warnings:

  - You are about to drop the column `name` on the `vendorProfile` table. All the data in the column will be lost.
  - Added the required column `name` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyName` to the `vendorProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vendorProfile" DROP COLUMN "name",
ADD COLUMN     "companyName" TEXT NOT NULL;
