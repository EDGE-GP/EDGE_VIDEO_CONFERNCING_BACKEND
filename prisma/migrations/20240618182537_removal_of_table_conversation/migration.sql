/*
  Warnings:

  - You are about to drop the column `conversationsId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `meetingId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationsId_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "conversationsId",
ADD COLUMN     "meetingId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Conversation";

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
