-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'HOLIDAY', 'OFF_DAY');

-- CreateTable
CREATE TABLE "org_department_work_models" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "work_time_model_id" TEXT NOT NULL,

    CONSTRAINT "org_department_work_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ta_employee_work_schedules" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "work_time_model_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift_name" TEXT NOT NULL,
    "scheduled_start" TEXT NOT NULL,
    "scheduled_end" TEXT NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 60,
    "is_weekend" BOOLEAN NOT NULL DEFAULT false,
    "is_holiday" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ta_employee_work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ta_timesheets" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "schedule_id" TEXT,
    "scheduled_start" TEXT,
    "scheduled_end" TEXT,
    "actual_clock_in" TIMESTAMP(3),
    "actual_clock_out" TIMESTAMP(3),
    "work_hours" DECIMAL(5,2),
    "overtime_hours" DECIMAL(5,2),
    "late_minutes" INTEGER,
    "early_leave_minutes" INTEGER,
    "status" "TimesheetStatus" NOT NULL,
    "notes" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ta_timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "year" INTEGER NOT NULL,
    "is_national" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,

    CONSTRAINT "sys_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_department_work_models_department_id_work_time_model_id_key" ON "org_department_work_models"("department_id", "work_time_model_id");

-- CreateIndex
CREATE UNIQUE INDEX "ta_employee_work_schedules_employee_id_date_key" ON "ta_employee_work_schedules"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ta_timesheets_employee_id_date_key" ON "ta_timesheets"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "sys_holidays_date_key" ON "sys_holidays"("date");

-- AddForeignKey
ALTER TABLE "org_department_work_models" ADD CONSTRAINT "org_department_work_models_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "hr_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_department_work_models" ADD CONSTRAINT "org_department_work_models_work_time_model_id_fkey" FOREIGN KEY ("work_time_model_id") REFERENCES "org_work_time_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ta_employee_work_schedules" ADD CONSTRAINT "ta_employee_work_schedules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ta_employee_work_schedules" ADD CONSTRAINT "ta_employee_work_schedules_work_time_model_id_fkey" FOREIGN KEY ("work_time_model_id") REFERENCES "org_work_time_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ta_timesheets" ADD CONSTRAINT "ta_timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ta_timesheets" ADD CONSTRAINT "ta_timesheets_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "ta_employee_work_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
