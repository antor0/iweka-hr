import { z } from "zod";
import { SuratType } from "@prisma/client";

export const SuratTemplateSchema = z.object({
    name: z.string().min(2, "Template name is required"),
    type: z.nativeEnum(SuratType),
    htmlContent: z.string().min(10, "Template content is required"),
    numberFormat: z.string().min(5, "Number format is required. Ex: {{seq}}/{{month}}/TYPE/HR/{{year}}"),
});

export const GenerateSuratSchema = z.object({
    templateId: z.string().min(1, "Template is required"),
    reason: z.string().min(5, "Reason is required"),
});
