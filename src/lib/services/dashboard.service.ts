import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";

export class DashboardService {
    static async getDashboardStats() {
        // Today's date for attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Total Employees
        const totalEmployees = await prisma.employee.count({
            where: { employmentStatus: { in: ['ACTIVE', 'PROBATION'] } }
        });

        // 2. Present Today (Assuming WEB source or any attendance today)
        const presentToday = await prisma.attendance.count({
            where: {
                date: today,
                status: { in: ['PRESENT', 'LATE'] }
            }
        });

        const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;

        // 3. Leave Requests
        const leaveRequestsTotal = await prisma.leaveRequest.count();
        const pendingLeaves = await prisma.leaveRequest.count({
            where: { status: 'PENDING' }
        });

        // 4. Payroll This Month
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // Find latest payroll run if current month doesn't exist
        let latestPayroll = await prisma.payrollRun.findFirst({
            where: { periodMonth: currentMonth, periodYear: currentYear },
        });

        if (!latestPayroll) {
            latestPayroll = await prisma.payrollRun.findFirst({
                orderBy: [
                    { periodYear: 'desc' },
                    { periodMonth: 'desc' }
                ]
            });
        }

        const totalPayroll = latestPayroll?.totalNet ? Number(latestPayroll.totalNet) : 0;
        const payrollLabel = latestPayroll ? `${format(new Date(latestPayroll.periodYear, latestPayroll.periodMonth - 1, 1), 'MMMM yyyy')} Period` : 'No data';

        // 5. Recent Activities
        const recentLogs = await prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { include: { employee: true } } }
        });

        const recentActivities = recentLogs.map((log: any) => {
            const name = log.user?.employee?.fullName || 'System';
            let actionText = log.action;
            let type = 'alert';

            if (log.action === 'LOGIN') { actionText = 'logged in'; type = 'join'; }
            if (log.action === 'CREATE_EMPLOYEE') { actionText = 'added a new employee'; type = 'join'; }
            if (log.action === 'RUN_PAYROLL') { actionText = 'ran payroll'; type = 'payroll'; }
            if (log.action.includes('LEAVE')) { actionText = 'updated a leave request'; type = 'leave'; }

            return {
                type,
                name,
                action: actionText,
                time: log.createdAt.toISOString()
            };
        });

        // 6. Department Distribution
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: { employees: { where: { employmentStatus: { in: ['ACTIVE', 'PROBATION'] } } } }
                }
            }
        });

        const departmentData = departments
            .filter((d: any) => d._count.employees > 0)
            .map((d: any) => ({
                name: d.name,
                count: d._count.employees,
                percentage: totalEmployees > 0 ? Math.round((d._count.employees / totalEmployees) * 100) : 0
            }))
            .sort((a: any, b: any) => b.count - a.count);

        return {
            stats: [
                { title: "Total Employees", value: totalEmployees.toString(), subtitle: "Active & Probation", trend: { value: 0, label: "0%" }, accent: "primary" },
                { title: "Present Today", value: presentToday.toString(), subtitle: `${attendanceRate.toFixed(1)}% attendance rate`, trend: { value: 0, label: "0%" }, accent: "success" },
                { title: "Leave Requests", value: leaveRequestsTotal.toString(), subtitle: `${pendingLeaves} pending approval`, trend: { value: 0, label: "0%" }, accent: "warning" },
                { title: "Total Payroll", value: totalPayroll, subtitle: payrollLabel, trend: { value: 0, label: "0%" }, accent: "accent" }
            ],
            recentActivities,
            departmentData
        };
    }
}
