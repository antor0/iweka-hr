-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'OPEN', 'ON_HOLD', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AppraisalStatus" AS ENUM ('DRAFT', 'SELF_ASSESSMENT', 'MANAGER_ASSESSMENT', 'REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "rec_job_requisitions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "target_date" DATE,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rec_job_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rec_candidates" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resume_url" TEXT,
    "portfolio_url" TEXT,
    "source" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rec_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rec_applications" (
    "id" TEXT NOT NULL,
    "requisition_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "applied_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "expected_salary" DECIMAL(15,2),

    CONSTRAINT "rec_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rec_interviews" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "type" TEXT NOT NULL,
    "result" TEXT,
    "feedback" TEXT,

    CONSTRAINT "rec_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perf_cycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perf_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perf_appraisals" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "status" "AppraisalStatus" NOT NULL DEFAULT 'DRAFT',
    "self_score" DECIMAL(5,2),
    "manager_score" DECIMAL(5,2),
    "final_score" DECIMAL(5,2),
    "summary_feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perf_appraisals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perf_goals" (
    "id" TEXT NOT NULL,
    "appraisal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "self_rating" INTEGER,
    "manager_rating" INTEGER,
    "feedback" TEXT,

    CONSTRAINT "perf_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rec_candidates_email_key" ON "rec_candidates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rec_applications_requisition_id_candidate_id_key" ON "rec_applications"("requisition_id", "candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "perf_appraisals_cycle_id_employee_id_key" ON "perf_appraisals"("cycle_id", "employee_id");

-- AddForeignKey
ALTER TABLE "rec_job_requisitions" ADD CONSTRAINT "rec_job_requisitions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "hr_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rec_job_requisitions" ADD CONSTRAINT "rec_job_requisitions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "hr_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rec_job_requisitions" ADD CONSTRAINT "rec_job_requisitions_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rec_job_requisitions" ADD CONSTRAINT "rec_job_requisitions_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rec_applications" ADD CONSTRAINT "rec_applications_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "rec_job_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rec_applications" ADD CONSTRAINT "rec_applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "rec_candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rec_interviews" ADD CONSTRAINT "rec_interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "rec_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rec_interviews" ADD CONSTRAINT "rec_interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perf_appraisals" ADD CONSTRAINT "perf_appraisals_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "perf_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perf_appraisals" ADD CONSTRAINT "perf_appraisals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perf_appraisals" ADD CONSTRAINT "perf_appraisals_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perf_goals" ADD CONSTRAINT "perf_goals_appraisal_id_fkey" FOREIGN KEY ("appraisal_id") REFERENCES "perf_appraisals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
