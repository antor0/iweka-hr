import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const [activePostings, totalCandidates, interviewsThisMonth, hiredThisMonth] = await Promise.all([
            // Active OPEN postings
            prisma.jobRequisition.count({ where: { status: 'OPEN' } }),

            // Total unique candidates in active postings
            prisma.application.count({ where: { requisition: { status: 'OPEN' } } }),

            // Interviews scheduled this month (not yet past)
            prisma.interview.count({
                where: {
                    scheduledDate: { gte: monthStart, lte: monthEnd }
                }
            }),

            // Hired this month
            prisma.application.count({
                where: {
                    status: 'HIRED',
                    appliedDate: { gte: monthStart, lte: monthEnd }
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: { activePostings, totalCandidates, interviewsThisMonth, hiredThisMonth }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
