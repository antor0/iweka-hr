import { z } from "zod";

export const GenerateCustomReportSchema = z.object({
    module: z.enum(["employees", "attendance", "leave", "payroll"]),
    fields: z.array(z.string()).min(1, "Select at least one field"),
    filters: z.record(z.string(), z.any()).optional().default({}),
});
