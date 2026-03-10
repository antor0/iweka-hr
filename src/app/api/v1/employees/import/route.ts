import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { EmployeeService } from "@/lib/services/employee.service";
import { getSession } from "@/lib/auth/session";
import { CreateEmployeeSchema } from "@/lib/validators/employee.schema";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (!file.name.endsWith(".csv")) {
            return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
        }

        const text = await file.text();

        // Parse CSV
        const records = parse(text, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        if (!records || records.length === 0) {
            return NextResponse.json({ error: "File contains no data rows" }, { status: 400 });
        }

        const successfulRecords = [];
        const failedRecords = [];

        // Pre-fetch approver to ensure FK validity, same as we did for single create and update
        let validApproverId: string | undefined = undefined;
        if (session.employeeId) {
            const { prisma } = await import('@/lib/db/prisma');
            const approver = await prisma.employee.findUnique({ select: { id: true }, where: { id: session.employeeId } });
            if (approver) validApproverId = session.employeeId;
        }

        // Process sequentially so DB errors can be collected per row
        for (const [index, row] of (records as any[]).entries()) {
            try {
                // Manually coerce types before Zod validation since CSV gives us all strings
                const coercedData: any = {
                    ...row,
                };

                // Allow empty optional fields by deleting them instead of passing empty string
                const optionals = ['phone', 'departmentId', 'positionId', 'gradeId', 'managerId', 'bankName', 'bankAccount'];
                for (const opt of optionals) {
                    if (coercedData[opt] === '') delete coercedData[opt];
                }

                const payload = CreateEmployeeSchema.parse(coercedData);

                // Use the custom bulk or iterative approach, here we'll do iterative so we get error details per failure
                const emp = await EmployeeService.createEmployee(payload, validApproverId);
                successfulRecords.push(emp);

            } catch (error: any) {
                console.error(`Error importing row ${index + 2}:`, error); // +2 for header offset
                failedRecords.push({
                    row: index + 2,
                    data: row,
                    error: error.message || "Validation or database error"
                });
            }
        }

        return NextResponse.json({
            message: `Successfully imported ${successfulRecords.length} employees.`,
            successCount: successfulRecords.length,
            failedCount: failedRecords.length,
            failures: failedRecords
        });


    } catch (error: any) {
        console.error("CSV Import Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process the CSV import" },
            { status: 500 }
        );
    }
}
