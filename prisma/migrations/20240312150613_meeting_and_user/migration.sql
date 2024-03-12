-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "conferenceLink" TEXT,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MeetingToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingToUser_AB_unique" ON "_MeetingToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingToUser_B_index" ON "_MeetingToUser"("B");

-- AddForeignKey
ALTER TABLE "_MeetingToUser" ADD CONSTRAINT "_MeetingToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingToUser" ADD CONSTRAINT "_MeetingToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
