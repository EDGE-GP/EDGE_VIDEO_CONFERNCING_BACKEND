/*
  Warnings:

  - You are about to drop the column `oranizerId` on the `Meeting` table. All the data in the column will be lost.
  - Added the required column `organizerId` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_oranizerId_fkey";

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "oranizerId",
ADD COLUMN     "organizerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
