/*
  Warnings:

  - You are about to drop the column `userId` on the `Meeting` table. All the data in the column will be lost.
  - Added the required column `adminId` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_userId_fkey";

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "userId",
ADD COLUMN     "adminId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
