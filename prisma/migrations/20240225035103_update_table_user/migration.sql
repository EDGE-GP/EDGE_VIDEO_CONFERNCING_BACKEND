/*
  Warnings:

  - Made the column `passwordChangedAt` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordChangedAt" SET NOT NULL,
ALTER COLUMN "passwordChangedAt" SET DEFAULT CURRENT_TIMESTAMP;
