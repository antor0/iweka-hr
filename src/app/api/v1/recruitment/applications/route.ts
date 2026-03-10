import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { CreateApplicationSchema } from '@/lib/validators/recruitment.schema';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const requisitionId = searchParams.get('requisitionId') || undefined;

        const applications = await RecruitmentService.getApplications(requisitionId);
        return NextResponse.json({ success: true, data: applications });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validatedData = CreateApplicationSchema.parse(body);
        const application = await RecruitmentService.createApplication(validatedData as any);

        return NextResponse.json({ success: true, data: application }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
