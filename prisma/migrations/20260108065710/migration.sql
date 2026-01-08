/*
  Warnings:

  - The `status` column on the `forms` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "audit_comment" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "FilingStatus" NOT NULL DEFAULT 'SUBMITTED';

-- CreateIndex
CREATE INDEX "forms_submitter_id_idx" ON "forms"("submitter_id");

-- CreateIndex
CREATE INDEX "forms_status_idx" ON "forms"("status");

-- CreateIndex
CREATE INDEX "forms_created_at_idx" ON "forms"("created_at");
