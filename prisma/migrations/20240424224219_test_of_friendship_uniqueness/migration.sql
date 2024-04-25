/*
  Warnings:

  - A unique constraint covering the columns `[user2Id,user1Id]` on the table `Friendship` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Friendship_user2Id_user1Id_key" ON "Friendship"("user2Id", "user1Id");
