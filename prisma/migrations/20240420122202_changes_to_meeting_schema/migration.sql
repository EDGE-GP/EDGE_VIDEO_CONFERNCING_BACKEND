/*
  Warnings:

  - You are about to drop the column `conferenceLink` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Meeting` table. All the data in the column will be lost.
  - Added the required column `activityFlag` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conferenceId` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enableAvatar` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enableInterpreter` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saveConversation` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Made the column `startTime` on table `Meeting` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "conferenceLink",
DROP COLUMN "endTime",
DROP COLUMN "location",
ADD COLUMN     "activityFlag" TEXT NOT NULL,
ADD COLUMN     "conferenceId" TEXT NOT NULL,
ADD COLUMN     "enableAvatar" BOOLEAN NOT NULL,
ADD COLUMN     "enableInterpreter" BOOLEAN NOT NULL,
ADD COLUMN     "saveConversation" BOOLEAN NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "startTime" SET NOT NULL,
ALTER COLUMN "startTime" SET DEFAULT CURRENT_TIMESTAMP;
