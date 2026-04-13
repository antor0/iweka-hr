import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [
            departmentsCount,
            positionsCount,
            gradesCount,
            employeesCount,
            departments
        ] = await Promise.all([
            prisma.department.count(),
            prisma.position.count(),
            prisma.grade.count(),
            prisma.employee.count({ where: { employmentStatus: { in: ['ACTIVE', 'PROBATION'] } } }),
            prisma.department.findMany({
                include: {
                    head: { select: { fullName: true } },
                    _count: { select: { employees: true, positions: true } }
                },
                orderBy: { name: 'asc' }
            })
        ]);

        const colors = [
            "from-blue-500/20 to-blue-500/5",
            "from-purple-500/20 to-purple-500/5",
            "from-orange-500/20 to-orange-500/5",
            "from-green-500/20 to-green-500/5",
            "from-cyan-500/20 to-cyan-500/5",
            "from-indigo-500/20 to-indigo-500/5",
            "from-pink-500/20 to-pink-500/5"
        ];

        const formattedDepartments = departments.map((dept, index) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            locationId: dept.locationId,
            description: dept.description,
            isActive: dept.isActive,
            head: dept.head?.fullName || "Unassigned",
            employees: dept._count.employees,
            positions: dept._count.positions,
            color: colors[index % colors.length]
        }));

        const stats = {
            departments: departmentsCount,
            positions: positionsCount,
            grades: gradesCount,
            employees: employeesCount
        };

        return NextResponse.json({ success: true, data: { stats, departments: formattedDepartments } });
    } catch (error: any) {
        console.error("GET /api/v1/organization/dashboard error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
