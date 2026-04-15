import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { WebhookApplySchema } from '@/lib/validators/recruitment.schema';

// This is a public unauthenticated endpoint designed to receive applications from a corporate website.
export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Validate the incoming payload
        const validatedData = WebhookApplySchema.parse(body);

        // Check if the requisition exists and is open
        const requisition = await prisma.jobRequisition.findUnique({
            where: { id: validatedData.requisitionId }
        });

        if (!requisition) {
            return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 });
        }

        if (requisition.status !== 'OPEN') {
            return NextResponse.json({ success: false, error: 'Requisition is not open for applications' }, { status: 400 });
        }

        // Process within a transaction to ensure both Candidate and Application are created or neither
        const application = await prisma.$transaction(async (tx) => {
            // First, see if the candidate already exists by email
            let candidate = await tx.candidate.findUnique({
                where: { email: validatedData.email }
            });

            if (!candidate) {
                // Create new candidate
                candidate = await tx.candidate.create({
                    data: {
                        firstName: validatedData.firstName,
                        lastName: validatedData.lastName,
                        email: validatedData.email,
                        phone: validatedData.phone,
                        source: validatedData.source,
                        resumeUrl: validatedData.resumeUrl,
                        portfolioUrl: validatedData.portfolioUrl
                    }
                });
            } else {
                 // Update candidate with provided info if available
                 candidate = await tx.candidate.update({
                      where: { id: candidate.id },
                      data: {
                          firstName: validatedData.firstName,
                          lastName: validatedData.lastName,
                          phone: validatedData.phone || candidate.phone,
                          source: validatedData.source || candidate.source,
                          resumeUrl: validatedData.resumeUrl || candidate.resumeUrl,
                          portfolioUrl: validatedData.portfolioUrl || candidate.portfolioUrl
                      }
                 })
            }

            // Check if the candidate has already applied to THIS requisition
            const existingApplication = await tx.application.findUnique({
                 where: {
                     requisitionId_candidateId: {
                         requisitionId: validatedData.requisitionId,
                         candidateId: candidate.id
                     }
                 }
            });

            if (existingApplication) {
                 throw new Error("Candidate has already applied for this requisition");
            }

            // Create the application in 'NEW' status
            return tx.application.create({
                data: {
                    requisitionId: validatedData.requisitionId,
                    candidateId: candidate.id,
                    status: 'NEW',
                    expectedSalary: validatedData.expectedSalary
                }
            });
        });

        return NextResponse.json({
            success: true,
            data: { applicationId: application.id, candidateId: application.candidateId },
            message: 'Application received successfully'
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.issues || error.message || 'Failed to process application webhook' },
            { status: 400 }
        );
    }
}
