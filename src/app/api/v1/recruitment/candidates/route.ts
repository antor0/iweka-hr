import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RecruitmentService } from '@/lib/services/recruitment.service';
import { CreateCandidateSchema } from '@/lib/validators/recruitment.schema';

export async function GET() {
    try {
        const candidates = await RecruitmentService.getCandidates();
        return NextResponse.json({ success: true, data: candidates });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validatedData = CreateCandidateSchema.parse(body);
        const candidate = await RecruitmentService.createCandidate(validatedData as any);

        return NextResponse.json({ success: true, data: candidate }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
