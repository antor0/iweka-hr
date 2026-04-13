import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { workTimeModelId, employeeIds } = body;
        
        if (!workTimeModelId) throw new Error("workTimeModelId is required");
        if (!employeeIds) throw new Error("employeeIds are required");

        // Verify the work model is assigned to this department
        const isAssignedToDepartment = await prisma.departmentWorkModel.findUnique({
            where: {
                departmentId_workTimeModelId: {
                    departmentId: id,
                    workTimeModelId
                }
            }
        });

        if (!isAssignedToDepartment) {
            throw new Error("This work model is not assigned to this department. Please assign it first.");
        }

        let updatedCount = 0;

        if (employeeIds === "ALL") {
            const updateRes = await prisma.employee.updateMany({
                where: { departmentId: id },
                data: { workTimeModelId }
            });
            updatedCount = updateRes.count;
        } else if (Array.isArray(employeeIds)) {
            const updateRes = await prisma.employee.updateMany({
                where: { id: { in: employeeIds }, departmentId: id },
                data: { workTimeModelId }
            });
            updatedCount = updateRes.count;
        } else {
            throw new Error("Invalid employeeIds payload format");
        }

        return NextResponse.json({ success: true, updatedCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
