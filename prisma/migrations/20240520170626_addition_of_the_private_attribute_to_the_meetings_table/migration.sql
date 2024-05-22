/*
  Warnings:

  - The `privacyStatus` column on the `Meeting` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PrivacyStatus" AS ENUM ('public', 'private');

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "privacyStatus",
ADD COLUMN     "privacyStatus" "PrivacyStatus" NOT NULL DEFAULT 'public';
