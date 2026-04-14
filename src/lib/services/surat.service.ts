import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { SuratTemplateSchema, GenerateSuratSchema } from "../validators/surat.schema";

export class SuratService {
    // ----------------------------------------------------------------------
    // SURAT TEMPLATES
    // ----------------------------------------------------------------------
    static async getTemplates() {
        return prisma.suratTemplate.findMany({
            orderBy: { name: "asc" }
        });
    }

    static async getTemplateById(id: string) {
        return prisma.suratTemplate.findUnique({ where: { id } });
    }

    static async updateTemplate(id: string, payload: z.infer<typeof SuratTemplateSchema>) {
        return prisma.suratTemplate.update({
            where: { id },
            data: {
                name: payload.name,
                htmlContent: payload.htmlContent,
                numberFormat: payload.numberFormat
            }
        });
    }

    // ----------------------------------------------------------------------
    // SURAT HISTORY & GENERATION
    // ----------------------------------------------------------------------
    static async getEmployeeSuratHistory(employeeId: string) {
        return prisma.suratHistory.findMany({
            where: { employeeId },
            include: { template: true },
            orderBy: { issuedDate: "desc" }
        });
    }

    static toRoman(num: number): string {
        const roman: Record<string, number> = {
            M: 1000, CM: 900, D: 500, CD: 400,
            C: 100, XC: 90, L: 50, XL: 40,
            X: 10, IX: 9, V: 5, IV: 4, I: 1
        };
        let str = '';
        for (const i of Object.keys(roman)) {
            const q = Math.floor(num / roman[i]);
            num -= q * roman[i];
            str += i.repeat(q);
        }
        return str;
    }

    static async generateSurat(employeeId: string, payload: z.infer<typeof GenerateSuratSchema>) {
        const template = await prisma.suratTemplate.findUnique({
            where: { id: payload.templateId }
        });
        
        if (!template) throw new Error("Template not found");

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { department: true, position: true }
        });

        if (!employee) throw new Error("Employee not found");

        // Fetch Company Config
        const companyConfig = (await prisma.companyConfig.findFirst()) || {
            companyName: "PT. Indowebhost Kreasi",
            companyTaxId: "01.234.567.8-012.345",
            address: "Jl. Sudirman No. 123, Jakarta Selatan",
            phone: "(021) 1234-5678",
            email: "hr@indowebhost.co.id",
            payrollDate: 25,
            jkkRiskGroup: "Level 2 (0.54%)",
            mainBank: "Bank Mandiri"
        };

        // Generate Number sequence
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        // Count existing surat of this type in this year for the SEQ
        const count = await prisma.suratHistory.count({
            where: {
                templateId: template.id,
                issuedDate: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31, 23, 59, 59)
                }
            }
        });

        const seqStr = String(count + 1).padStart(3, '0');
        const monthRoman = SuratService.toRoman(month);
        
        let suratNumber = template.numberFormat
            .replace(/\{\{seq\}\}/gi, seqStr)
            .replace(/\{\{month\}\}/gi, monthRoman)
            .replace(/\{\{year\}\}/gi, String(year));

        // Inject HTML
        const hireDateStr = employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('id-ID') : '-';
        const issuedDateStr = now.toLocaleDateString('id-ID');
        
        let htmlContent = template.htmlContent
            .replace(/\{\{surat_number\}\}/gi, suratNumber)
            .replace(/\{\{employee_name\}\}/gi, employee.fullName)
            .replace(/\{\{employee_number\}\}/gi, employee.employeeNumber)
            .replace(/\{\{position\}\}/gi, employee.position?.title || '-')
            .replace(/\{\{department\}\}/gi, employee.department?.name || '-')
            .replace(/\{\{hire_date\}\}/gi, hireDateStr)
            .replace(/\{\{reason\}\}/gi, payload.reason)
            .replace(/\{\{issued_date\}\}/gi, issuedDateStr)
            .replace(/\{\{hr_name\}\}/gi, "HR Manager") // Can be dynamic based on logged in user later
            .replace(/\{\{hr_position\}\}/gi, "Head of Human Resources")
            .replace(/\{\{company_name\}\}/gi, companyConfig.companyName || '-')
            .replace(/\{\{company_tax_id\}\}/gi, companyConfig.companyTaxId || '-')
            .replace(/\{\{company_address\}\}/gi, companyConfig.address || '-')
            .replace(/\{\{company_email\}\}/gi, companyConfig.email || '-')
            .replace(/\{\{company_phone\}\}/gi, companyConfig.phone || '-');

        const history = await prisma.suratHistory.create({
            data: {
                employeeId,
                templateId: template.id,
                suratNumber,
                renderedData: { html: htmlContent },
                issuedDate: now,
                notes: payload.reason
            }
        });

        return history;
    }
}
