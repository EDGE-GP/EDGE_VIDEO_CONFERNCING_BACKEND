/*
  Warnings:

  - You are about to drop the column `settingsId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_settingsId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "settingsId",
ADD COLUMN     "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "remindersViaEmail" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "Settings";
