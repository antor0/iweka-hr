-- AlterTable
ALTER TABLE "hr_employees" ADD COLUMN     "pin" TEXT,
ADD COLUMN     "pin_must_change" BOOLEAN NOT NULL DEFAULT true;
