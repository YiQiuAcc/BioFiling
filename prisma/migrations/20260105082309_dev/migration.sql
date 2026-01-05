/*
  Warnings:

  - You are about to drop the column `createdAt` on the `forms` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `forms` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `forms` table. All the data in the column will be lost.
  - You are about to drop the column `submitterId` on the `forms` table. All the data in the column will be lost.
  - You are about to drop the column `submitterName` on the `forms` table. All the data in the column will be lost.
  - Added the required column `project_name` to the `forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submitter_id` to the `forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submitter_name` to the `forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `forms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forms" DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "submitterId",
DROP COLUMN "submitterName",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "leader_name" TEXT,
ADD COLUMN     "project_name" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN     "submitter_id" TEXT NOT NULL,
ADD COLUMN     "submitter_name" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
