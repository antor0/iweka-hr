import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions-config";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q") || "";

        if (q.length < 2) {
            return NextResponse.json({
                success: true,
                data: { employees: [], departments: [], positions: [], leaveRequests: [], claims: [], payrollRuns: [] }
            });
        }

        const userRole = session.role;
        const queries: Array<Promise<any>> = [];

        // Employees
        if (hasPermission(userRole, "employees.read" as any)) {
            queries.push(
                prisma.employee.findMany({
                    where: {
                        OR: [
                            { fullName: { contains: q, mode: "insensitive" } },
                            { employeeNumber: { contains: q, mode: "insensitive" } },
                            { email: { contains: q, mode: "insensitive" } }
                        ]
                    },
                    take: 5,
                    include: { department: true, position: true }
                }).then(res => ({
                    type: "employees",
                    data: res.map(e => ({
                        id: e.id,
                        fullName: e.fullName,
                        employeeNumber: e.employeeNumber,
                        department: e.department?.name,
                        position: e.position?.title,
                        photoUrl: e.photoUrl,
                        href: `/employees/${e.id}`
                    }))
                }))
            );
        } else {
            queries.push(Promise.resolve({ type: "employees", data: [] }));
        }

        // Departments
        if (hasPermission(userRole, "organization.read" as any)) {
            queries.push(
                prisma.department.findMany({
                    where: {
                        OR: [
                            { name: { contains: q, mode: "insensitive" } },
                            { code: { contains: q, mode: "insensitive" } }
                        ]
                    },
                    take: 5
                }).then(res => ({
                    type: "departments",
                    data: res.map(d => ({
                        id: d.id,
                        name: d.name,
                        code: d.code,
                        href: `/organization`
                    }))
                }))
            );
        } else {
            queries.push(Promise.resolve({ type: "departments", data: [] }));
        }

        // Positions
        if (hasPermission(userRole, "organization.read" as any)) {
             queries.push(
                prisma.position.findMany({
                    where: {
                        OR: [
                            { title: { contains: q, mode: "insensitive" } },
                            { code: { contains: q, mode: "insensitive" } }
                        ]
                    },
                    take: 5
                }).then(res => ({
                    type: "positions",
                    data: res.map(p => ({
                        id: p.id,
                        title: p.title,
                        code: p.code,
                        href: `/organization`
                    }))
                }))
            );
        } else {
            queries.push(Promise.resolve({ type: "positions", data: [] }));
        }

        // Leave Requests
        if (hasPermission(userRole, "leave.read" as any)) {
            queries.push(
                prisma.leaveRequest.findMany({
                    where: {
                        OR: [
                            { employee: { fullName: { contains: q, mode: "insensitive" } } },
                            { reason: { contains: q, mode: "insensitive" } },
                            { leaveType: { name: { contains: q, mode: "insensitive" } } }
                        ]
                    },
                    take: 5,
                    include: { employee: true, leaveType: true }
                }).then(res => ({
                    type: "leaveRequests",
                    data: res.map(l => ({
                        id: l.id,
                        employeeName: l.employee.fullName,
                        leaveTypeName: l.leaveType.name,
                        status: l.status,
                        startDate: l.startDate,
                        endDate: l.endDate,
                        href: `/leave`
                    }))
                }))
            );
        } else {
            queries.push(Promise.resolve({ type: "leaveRequests", data: [] }));
        }

        // Claims
        if (hasPermission(userRole, "claims.read" as any)) {
            queries.push(
                prisma.claim.findMany({
                    where: {
                        OR: [
                            { claimNumber: { contains: q, mode: "insensitive" } },
                            { title: { contains: q, mode: "insensitive" } },
                            { employee: { fullName: { contains: q, mode: "insensitive" } } }
                        ]
                    },
                    take: 5,
                    include: { employee: true }
                }).then(res => ({
                    type: "claims",
                    data: res.map(c => ({
                        id: c.id,
                        claimNumber: c.claimNumber,
                        title: c.title,
                        employeeName: c.employee.fullName,
                        totalAmount: c.totalAmount,
                        status: c.status,
                        href: `/claims`
                    }))
                }))
            );
        } else {
            queries.push(Promise.resolve({ type: "claims", data: [] }));
        }

        // Payroll Runs
        if (hasPermission(userRole, "payroll.read" as any)) {
            const qNum = parseInt(q, 10);
            if (!isNaN(qNum)) {
                queries.push(
                    prisma.payrollRun.findMany({
                        where: {
                            OR: [
                                { periodYear: qNum },
                                { periodMonth: qNum }
                            ]
                        },
                        take: 5
                    }).then(res => ({
                        type: "payrollRuns",
                        data: res.map(p => ({
                            id: p.id,
                            period: `${p.periodMonth}/${p.periodYear}`,
                            status: p.status,
                            totalNet: p.totalNet,
                            href: `/payroll/runs/${p.id}`
                        }))
                    }))
                );
            } else {
                 queries.push(Promise.resolve({ type: "payrollRuns", data: [] }));
            }
        } else {
            queries.push(Promise.resolve({ type: "payrollRuns", data: [] }));
        }

        const results = await Promise.all(queries);
        
        const data: any = {};
        results.forEach(res => {
            data[res.type] = res.data;
        });

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error: any) {
        console.error("GET /api/v1/search error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
