/*
  Warnings:

  - You are about to drop the column `adminId` on the `Meeting` table. All the data in the column will be lost.
  - Added the required column `oranizerId` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_adminId_fkey";

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "adminId",
ADD COLUMN     "oranizerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_oranizerId_fkey" FOREIGN KEY ("oranizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
