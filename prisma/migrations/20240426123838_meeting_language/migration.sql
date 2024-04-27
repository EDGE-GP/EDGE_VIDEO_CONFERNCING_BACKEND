-- CreateEnum
CREATE TYPE "MeetingLanguage" AS ENUM ('English', 'Arabic');

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "language" "MeetingLanguage" NOT NULL DEFAULT 'English';
