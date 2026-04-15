-- AlterTable
ALTER TABLE "pay_monthly_variable_inputs" ADD COLUMN     "deduction_amount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "sys_company_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "company_name" TEXT NOT NULL,
    "company_tax_id" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "payroll_date" INTEGER DEFAULT 25,
    "jkk_risk_group" TEXT,
    "main_bank" TEXT,
    "late_grace_period_mins" INTEGER DEFAULT 15,
    "late_penalty_amount" DECIMAL(15,2) DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_company_config_pkey" PRIMARY KEY ("id")
);
