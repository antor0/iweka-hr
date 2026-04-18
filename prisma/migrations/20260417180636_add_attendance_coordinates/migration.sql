-- AlterTable
ALTER TABLE "sys_company_config" ADD COLUMN     "require_location" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ta_attendances" ADD COLUMN     "clock_in_lat" DECIMAL(10,7),
ADD COLUMN     "clock_in_lng" DECIMAL(10,7),
ADD COLUMN     "clock_out_lat" DECIMAL(10,7),
ADD COLUMN     "clock_out_lng" DECIMAL(10,7);
