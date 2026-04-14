import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const CompanyConfigSchema = z.object({
    companyName: z.string().min(2, "Company name is required"),
    companyTaxId: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email().nullable().optional().or(z.literal("")),
    payrollDate: z.number().int().min(1).max(31).nullable().optional(),
    jkkRiskGroup: z.string().nullable().optional(),
    mainBank: z.string().nullable().optional(),
});

export async function GET() {
    try {
        let config = await prisma.companyConfig.findFirst();
        if (!config) {
            config = await prisma.companyConfig.create({
                data: {
                    id: "default",
                    companyName: "PT. Indowebhost Kreasi",
                    companyTaxId: "01.234.567.8-012.345",
                    address: "Jl. Sudirman No. 123, Jakarta Selatan",
                    phone: "(021) 1234-5678",
                    email: "hr@indowebhost.co.id",
                    payrollDate: 25,
                    jkkRiskGroup: "Level 2 (0.54%)",
                    mainBank: "Bank Mandiri"
                }
            });
        }
        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Convert empty string email to null for zod validation
        if (body.email === "") body.email = null;

        const validated = CompanyConfigSchema.parse(body);
        
        const config = await prisma.companyConfig.upsert({
            where: { id: "default" },
            update: validated,
            create: {
                id: "default",
                ...validated
            }
        });

        return NextResponse.json(config);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
