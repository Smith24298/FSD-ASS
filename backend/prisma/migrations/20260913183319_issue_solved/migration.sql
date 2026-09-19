/*
  Warnings:

  - You are about to drop the column `mobilNumber` on the `Profile` table. All the data in the column will be lost.
  - Added the required column `mobileNumber` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "mobilNumber",
ADD COLUMN     "mobileNumber" TEXT NOT NULL;
