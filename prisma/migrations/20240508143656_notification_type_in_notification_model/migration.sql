/*
  Warnings:

  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('meetingInvitation', 'meetingReminder', 'meetingUpdated', 'meetingCanceled', 'friendshipRequest', 'friendshipAccepted', 'friendshipRejected');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "type" "NotificationType" NOT NULL;
