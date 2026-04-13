-- CreateEnum
CREATE TYPE "WorkTimeModelType" AS ENUM ('REGULAR', 'SHIFT_2', 'SHIFT_3', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('LEAVE', 'OVERTIME', 'CLAIM', 'BUDGETING', 'RECRUITMENT');

-- CreateEnum
CREATE TYPE "AllowanceCategory" AS ENUM ('FIXED', 'VARIABLE');

-- CreateEnum
CREATE TYPE "AllowanceBasis" AS ENUM ('FIXED_AMOUNT', 'ATTENDANCE_BASED');

-- CreateEnum
CREATE TYPE "SuratType" AS ENUM ('SP1', 'SP2', 'SP3', 'PENGANGKATAN_TETAP', 'PROMOSI', 'DEMOSI', 'MUTASI', 'PEMBERHENTIAN', 'PENGUNDURAN_DIRI', 'PURCHASE_REQUEST', 'TUGAS', 'KETERANGAN_PENGHASILAN', 'PAKLARING', 'KETERANGAN_KERJA');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_NEEDED', 'APPROVAL_RESULT', 'SURAT_ISSUED', 'PAYROLL_READY', 'GENERAL');

-- AlterTable
ALTER TABLE "hr_departments" ADD COLUMN     "location_id" TEXT,
ADD COLUMN     "work_time_model_id" TEXT;

-- AlterTable
ALTER TABLE "hr_employees" ADD COLUMN     "location_id" TEXT,
ADD COLUMN     "work_time_model_id" TEXT;

-- CreateTable
CREATE TABLE "org_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "org_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_work_time_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkTimeModelType" NOT NULL DEFAULT 'REGULAR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "org_work_time_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_work_time_schedules" (
    "id" TEXT NOT NULL,
    "work_time_model_id" TEXT NOT NULL,
    "shift_name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "org_work_time_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_approval_workflows" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "approval_type" "ApprovalType" NOT NULL,
    "level1_approver_id" TEXT NOT NULL,
    "level2_approver_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "org_approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_position_grades" (
    "id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "grade_id" TEXT NOT NULL,

    CONSTRAINT "org_position_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_employee_allowances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AllowanceCategory" NOT NULL,
    "basis" "AllowanceBasis" NOT NULL DEFAULT 'FIXED_AMOUNT',
    "amount" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pay_employee_allowances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_monthly_variable_inputs" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "thr_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overtime_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commission_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bonus_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pay_monthly_variable_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_surat_templates" (
    "id" TEXT NOT NULL,
    "type" "SuratType" NOT NULL,
    "name" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "number_format" TEXT NOT NULL DEFAULT 'SEQ/MONTH/TYPE/HR/YEAR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doc_surat_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_surat_history" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "surat_number" TEXT NOT NULL,
    "issued_date" DATE NOT NULL,
    "rendered_data" JSONB NOT NULL,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_surat_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_email_config" (
    "id" TEXT NOT NULL,
    "smtp_host" TEXT NOT NULL,
    "smtp_port" INTEGER NOT NULL,
    "smtp_user" TEXT NOT NULL,
    "smtp_pass" TEXT NOT NULL,
    "from_name" TEXT NOT NULL,
    "from_email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sys_email_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_approval_workflows_department_id_approval_type_key" ON "org_approval_workflows"("department_id", "approval_type");

-- CreateIndex
CREATE UNIQUE INDEX "org_position_grades_position_id_grade_id_key" ON "org_position_grades"("position_id", "grade_id");

-- CreateIndex
CREATE UNIQUE INDEX "pay_monthly_variable_inputs_employee_id_month_year_key" ON "pay_monthly_variable_inputs"("employee_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "doc_surat_templates_type_key" ON "doc_surat_templates"("type");

-- CreateIndex
CREATE INDEX "sys_notifications_user_id_is_read_idx" ON "sys_notifications"("user_id", "is_read");

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "org_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_work_time_model_id_fkey" FOREIGN KEY ("work_time_model_id") REFERENCES "org_work_time_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "org_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_work_time_model_id_fkey" FOREIGN KEY ("work_time_model_id") REFERENCES "org_work_time_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_work_time_schedules" ADD CONSTRAINT "org_work_time_schedules_work_time_model_id_fkey" FOREIGN KEY ("work_time_model_id") REFERENCES "org_work_time_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_approval_workflows" ADD CONSTRAINT "org_approval_workflows_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "hr_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_approval_workflows" ADD CONSTRAINT "org_approval_workflows_level1_approver_id_fkey" FOREIGN KEY ("level1_approver_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_approval_workflows" ADD CONSTRAINT "org_approval_workflows_level2_approver_id_fkey" FOREIGN KEY ("level2_approver_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_position_grades" ADD CONSTRAINT "org_position_grades_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "hr_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_position_grades" ADD CONSTRAINT "org_position_grades_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "hr_grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_employee_allowances" ADD CONSTRAINT "pay_employee_allowances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_monthly_variable_inputs" ADD CONSTRAINT "pay_monthly_variable_inputs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_surat_history" ADD CONSTRAINT "doc_surat_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_surat_history" ADD CONSTRAINT "doc_surat_history_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "doc_surat_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_surat_history" ADD CONSTRAINT "doc_surat_history_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "sys_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_notifications" ADD CONSTRAINT "sys_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
