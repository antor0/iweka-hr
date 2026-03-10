-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('TK_0', 'TK_1', 'TK_2', 'TK_3', 'K_0', 'K_1', 'K_2', 'K_3');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'PROBATION', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT', 'INTERN');

-- CreateEnum
CREATE TYPE "EmployeeChangeType" AS ENUM ('PROMOTION', 'TRANSFER', 'GRADE_CHANGE', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "FamilyRelationship" AS ENUM ('SPOUSE', 'CHILD', 'PARENT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('WEB', 'BIOMETRIC', 'MOBILE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'CALCULATING', 'REVIEW', 'APPROVED', 'FINALIZED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('EARNING', 'DEDUCTION', 'BENEFIT');

-- CreateEnum
CREATE TYPE "CalculationType" AS ENUM ('FIXED', 'PERCENTAGE', 'FORMULA');

-- CreateEnum
CREATE TYPE "TaxMethod" AS ENUM ('TER', 'PROGRESSIVE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SYSTEM_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'PAYROLL_SPECIALIST', 'FINANCE', 'LINE_MANAGER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "hr_employees" (
    "id" TEXT NOT NULL,
    "employee_number" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "date_of_birth" DATE,
    "gender" "Gender",
    "marital_status" "MaritalStatus",
    "npwp" TEXT,
    "bpjs_kes_number" TEXT,
    "bpjs_tk_number" TEXT,
    "hire_date" DATE NOT NULL,
    "employment_status" "EmploymentStatus" NOT NULL,
    "employment_type" "EmploymentType" NOT NULL,
    "department_id" TEXT,
    "position_id" TEXT,
    "grade_id" TEXT,
    "manager_id" TEXT,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parent_id" TEXT,
    "head_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hr_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_positions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "department_id" TEXT,
    "grade_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hr_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_grades" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "min_salary" DECIMAL(15,2) NOT NULL,
    "max_salary" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "hr_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employment_history" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "change_type" "EmployeeChangeType" NOT NULL,
    "effective_date" DATE NOT NULL,
    "old_value" JSONB NOT NULL,
    "new_value" JSONB NOT NULL,
    "reason" TEXT,
    "approved_by_id" TEXT,

    CONSTRAINT "hr_employment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_family" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "relationship" "FamilyRelationship" NOT NULL,
    "full_name" TEXT NOT NULL,
    "date_of_birth" DATE,
    "nik" TEXT,
    "is_bpjs_dependent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "hr_employee_family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ta_attendances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clock_in" TIMESTAMP(3),
    "clock_out" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL,
    "work_hours" DECIMAL(5,2),
    "overtime_hours" DECIMAL(5,2),
    "source" "AttendanceSource" NOT NULL DEFAULT 'WEB',
    "notes" TEXT,

    CONSTRAINT "ta_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ta_shifts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 60,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ta_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ta_overtime_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "planned_hours" DECIMAL(5,2) NOT NULL,
    "actual_hours" DECIMAL(5,2),
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by_id" TEXT,

    CONSTRAINT "ta_overtime_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lv_leave_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "annual_entitlement" INTEGER NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "requires_attachment" BOOLEAN NOT NULL DEFAULT false,
    "is_carry_over" BOOLEAN NOT NULL DEFAULT false,
    "max_carry_over_days" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lv_leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lv_leave_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" DECIMAL(5,1) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by_id" TEXT,
    "attachment_url" TEXT,

    CONSTRAINT "lv_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lv_leave_balances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "entitlement" DECIMAL(5,1) NOT NULL,
    "used" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "carry_over" DECIMAL(5,1) NOT NULL DEFAULT 0,

    CONSTRAINT "lv_leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_payroll_runs" (
    "id" TEXT NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "total_gross" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_net" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_bpjs_company" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_bpjs_employee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "run_by_id" TEXT,
    "approved_by_id" TEXT,
    "finalized_at" TIMESTAMP(3),
    "config_snapshot" JSONB,

    CONSTRAINT "pay_payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_payroll_items" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "basic_salary" DECIMAL(15,2) NOT NULL,
    "total_allowances" DECIMAL(15,2) NOT NULL,
    "total_overtime" DECIMAL(15,2) NOT NULL,
    "gross_income" DECIMAL(15,2) NOT NULL,
    "pph21_amount" DECIMAL(15,2) NOT NULL,
    "bpjs_kes_employee" DECIMAL(15,2) NOT NULL,
    "bpjs_kes_company" DECIMAL(15,2) NOT NULL,
    "bpjs_tk_jht_employee" DECIMAL(15,2) NOT NULL,
    "bpjs_tk_jht_company" DECIMAL(15,2) NOT NULL,
    "bpjs_tk_jp_employee" DECIMAL(15,2) NOT NULL,
    "bpjs_tk_jp_company" DECIMAL(15,2) NOT NULL,
    "bpjs_tk_jkk_company" DECIMAL(15,2) NOT NULL,
    "bpjs_tk_jkm_company" DECIMAL(15,2) NOT NULL,
    "total_deductions" DECIMAL(15,2) NOT NULL,
    "net_salary" DECIMAL(15,2) NOT NULL,
    "components" JSONB NOT NULL,

    CONSTRAINT "pay_payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_salary_components" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ComponentType" NOT NULL,
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "is_bpjs_base" BOOLEAN NOT NULL DEFAULT true,
    "calculation_type" "CalculationType" NOT NULL,
    "default_amount" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pay_salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_pph21_config" (
    "id" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "end_date" DATE,
    "method" "TaxMethod" NOT NULL DEFAULT 'TER',
    "brackets" JSONB NOT NULL,
    "ptkp_values" JSONB NOT NULL,
    "ter_rates" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tax_pph21_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_pph21_monthly" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "payroll_item_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "gross_income" DECIMAL(15,2) NOT NULL,
    "ptkp_status" TEXT NOT NULL,
    "taxable_income" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL,
    "ytd_gross" DECIMAL(15,2) NOT NULL,
    "ytd_tax" DECIMAL(15,2) NOT NULL,
    "config_id" TEXT NOT NULL,

    CONSTRAINT "tax_pph21_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bpjs_rate_config" (
    "id" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "end_date" DATE,
    "kes_employee_rate" DECIMAL(5,4) NOT NULL,
    "kes_company_rate" DECIMAL(5,4) NOT NULL,
    "kes_salary_cap" DECIMAL(15,2) NOT NULL,
    "jht_employee_rate" DECIMAL(5,4) NOT NULL,
    "jht_company_rate" DECIMAL(5,4) NOT NULL,
    "jkk_company_rate" DECIMAL(5,4) NOT NULL,
    "jkm_company_rate" DECIMAL(5,4) NOT NULL,
    "jp_employee_rate" DECIMAL(5,4) NOT NULL,
    "jp_company_rate" DECIMAL(5,4) NOT NULL,
    "jp_salary_cap" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bpjs_rate_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_users" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_employee_number_key" ON "hr_employees"("employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_email_key" ON "hr_employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "hr_departments_code_key" ON "hr_departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "hr_positions_code_key" ON "hr_positions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "hr_grades_level_key" ON "hr_grades"("level");

-- CreateIndex
CREATE UNIQUE INDEX "ta_attendances_employee_id_date_key" ON "ta_attendances"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "lv_leave_types_code_key" ON "lv_leave_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lv_leave_balances_employee_id_leave_type_id_year_key" ON "lv_leave_balances"("employee_id", "leave_type_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "pay_payroll_runs_period_month_period_year_key" ON "pay_payroll_runs"("period_month", "period_year");

-- CreateIndex
CREATE UNIQUE INDEX "pay_payroll_items_payroll_run_id_employee_id_key" ON "pay_payroll_items"("payroll_run_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "pay_salary_components_code_key" ON "pay_salary_components"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_pph21_monthly_payroll_item_id_key" ON "tax_pph21_monthly"("payroll_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "tax_pph21_monthly_employee_id_month_year_key" ON "tax_pph21_monthly"("employee_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "sys_users_employee_id_key" ON "sys_users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_users_email_key" ON "sys_users"("email");

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "hr_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "hr_grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_positions" ADD CONSTRAINT "hr_positions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_positions" ADD CONSTRAINT "hr_positions_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "hr_grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employment_history" ADD CONSTRAINT "hr_employment_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employment_history" ADD CONSTRAINT "hr_employment_history_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_family" ADD CONSTRAINT "hr_employee_family_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ta_attendances" ADD CONSTRAINT "ta_attendances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ta_overtime_requests" ADD CONSTRAINT "ta_overtime_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ta_overtime_requests" ADD CONSTRAINT "ta_overtime_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lv_leave_requests" ADD CONSTRAINT "lv_leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lv_leave_requests" ADD CONSTRAINT "lv_leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "lv_leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lv_leave_requests" ADD CONSTRAINT "lv_leave_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lv_leave_balances" ADD CONSTRAINT "lv_leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lv_leave_balances" ADD CONSTRAINT "lv_leave_balances_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "lv_leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_payroll_runs" ADD CONSTRAINT "pay_payroll_runs_run_by_id_fkey" FOREIGN KEY ("run_by_id") REFERENCES "sys_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_payroll_runs" ADD CONSTRAINT "pay_payroll_runs_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "sys_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_payroll_items" ADD CONSTRAINT "pay_payroll_items_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "pay_payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_payroll_items" ADD CONSTRAINT "pay_payroll_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_pph21_monthly" ADD CONSTRAINT "tax_pph21_monthly_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_pph21_monthly" ADD CONSTRAINT "tax_pph21_monthly_payroll_item_id_fkey" FOREIGN KEY ("payroll_item_id") REFERENCES "pay_payroll_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_pph21_monthly" ADD CONSTRAINT "tax_pph21_monthly_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "tax_pph21_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_users" ADD CONSTRAINT "sys_users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_audit_logs" ADD CONSTRAINT "sys_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
