/*
  Warnings:

  - You are about to drop the column `private` on the `Meeting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "private",
ADD COLUMN     "privacyStatus" BOOLEAN NOT NULL DEFAULT false;
