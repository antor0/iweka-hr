import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { CreateInterviewSchema } from '@/lib/validators/recruitment.schema';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get('applicationId') || undefined;
        const interviewerId = searchParams.get('interviewerId') || undefined;

        const interviews = await RecruitmentService.getInterviews({ applicationId, interviewerId });
        return NextResponse.json({ success: true, data: interviews });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validatedData = CreateInterviewSchema.parse(body);

        const interview = await RecruitmentService.createInterview(validatedData);
        return NextResponse.json({ success: true, data: interview }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.issues || error.message }, { status: 400 });
    }
}
