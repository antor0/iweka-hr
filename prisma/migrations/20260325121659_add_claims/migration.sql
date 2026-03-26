-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "ClaimCategory" AS ENUM ('TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'PARKING_TOLLS', 'OFFICE_SUPPLIES', 'COMMUNICATION', 'OTHER');

-- CreateTable
CREATE TABLE "clm_claims" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clm_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clm_claim_items" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "category" "ClaimCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "receipt_date" DATE NOT NULL,
    "receipt_url" TEXT,
    "ocr_raw_text" TEXT,
    "merchant" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clm_claim_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clm_claims_claim_number_key" ON "clm_claims"("claim_number");

-- AddForeignKey
ALTER TABLE "clm_claims" ADD CONSTRAINT "clm_claims_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clm_claims" ADD CONSTRAINT "clm_claims_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clm_claim_items" ADD CONSTRAINT "clm_claim_items_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "clm_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
