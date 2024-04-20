/*
  Warnings:

  - You are about to drop the `_MeetingToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_MeetingToUser" DROP CONSTRAINT "_MeetingToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_MeetingToUser" DROP CONSTRAINT "_MeetingToUser_B_fkey";

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_MeetingToUser";

-- CreateTable
CREATE TABLE "_MeetingParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingParticipants_AB_unique" ON "_MeetingParticipants"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingParticipants_B_index" ON "_MeetingParticipants"("B");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingParticipants" ADD CONSTRAINT "_MeetingParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingParticipants" ADD CONSTRAINT "_MeetingParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
