import { prisma } from "@/lib/db/prisma";
import { AuditService } from "./audit.service";
import { JobRequisition, Candidate, Application } from "@prisma/client";

export class RecruitmentService {
    // -------------------------------------------------------------
    // JOB REQUISITIONS
    // -------------------------------------------------------------
    static async getRequisitions(filters?: { departmentId?: string; status?: any }) {
        return prisma.jobRequisition.findMany({
            where: {
                ...(filters?.departmentId && { departmentId: filters.departmentId }),
                ...(filters?.status && { status: filters.status })
            },
            include: {
                department: { select: { name: true } },
                position: { select: { title: true } },
                requestedBy: { select: { fullName: true } },
                _count: { select: { applications: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getRequisitionById(id: string) {
        return prisma.jobRequisition.findUnique({
            where: { id },
            include: {
                department: true,
                position: true,
                applications: {
                    include: { 
                        candidate: true,
                        interviews: true
                    },
                    orderBy: { appliedDate: 'desc' }
                }
            }
        });
    }

    static async createRequisition(payload: Omit<JobRequisition, "id" | "createdAt" | "updatedAt" | "requestedById" | "approvedById">, userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.employeeId) throw new Error("Only employees can create requisitions");

        const req = await prisma.jobRequisition.create({
            data: {
                ...payload,
                requestedById: user.employeeId
            }
        });

        AuditService.log(userId, "CREATE", "JobRequisition", req.id, null, payload);
        return req;
    }

    static async updateRequisitionStatus(id: string, newStatus: any, userId: string) {
        const req = await prisma.jobRequisition.update({
            where: { id },
            data: { status: newStatus }
        });
        AuditService.log(userId, "UPDATE_STATUS", "JobRequisition", id, { status: "PREVIOUS" }, { status: newStatus });
        return req;
    }

    static async updateRequisition(id: string, payload: Partial<JobRequisition>, userId: string) {
        const req = await prisma.jobRequisition.update({
            where: { id },
            data: payload
        });
        AuditService.log(userId, "UPDATE", "JobRequisition", id, null, payload);
        return req;
    }

    static async deleteRequisition(id: string, userId: string) {
        const req = await prisma.jobRequisition.delete({
            where: { id }
        });
        AuditService.log(userId, "DELETE", "JobRequisition", id, req, null);
        return req;
    }


    // -------------------------------------------------------------
    // CANDIDATES
    // -------------------------------------------------------------
    static async getCandidates() {
        return prisma.candidate.findMany({
            include: {
                applications: {
                    include: { requisition: { select: { title: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async createCandidate(payload: Omit<Candidate, "id" | "createdAt" | "updatedAt">) {
        return prisma.candidate.create({
            data: payload
        });
    }


    // -------------------------------------------------------------
    // APPLICATIONS
    // -------------------------------------------------------------
    static async getApplications(requisitionId?: string) {
        return prisma.application.findMany({
            where: {
                ...(requisitionId && { requisitionId })
            },
            include: {
                candidate: true,
                requisition: { include: { position: true, department: true } },
                interviews: true
            },
            orderBy: { appliedDate: 'desc' }
        });
    }

    static async createApplication(payload: Omit<Application, "id" | "appliedDate" | "status">) {
        // Prevent duplicate applications
        const existing = await prisma.application.findUnique({
            where: {
                requisitionId_candidateId: {
                    requisitionId: payload.requisitionId,
                    candidateId: payload.candidateId
                }
            }
        });

        if (existing) {
            throw new Error("Candidate has already applied for this requisition");
        }

        return prisma.application.create({
            data: payload
        });
    }

    static async updateApplicationStatus(id: string, newStatus: any, userId: string) {
        const app = await prisma.application.update({
            where: { id },
            data: { status: newStatus }
        });
        AuditService.log(userId, "UPDATE_STATUS", "Application", id, { status: "PREVIOUS" }, { status: newStatus });
        return app;
    }


    // -------------------------------------------------------------
    // INTERVIEWS
    // -------------------------------------------------------------
    static async getInterviews(filters?: { applicationId?: string; interviewerId?: string }) {
        return prisma.interview.findMany({
            where: {
                ...(filters?.applicationId && { applicationId: filters.applicationId }),
                ...(filters?.interviewerId && { interviewerId: filters.interviewerId }),
            },
            include: {
                application: {
                    include: {
                        candidate: { select: { firstName: true, lastName: true, email: true } },
                        requisition: { select: { title: true } }
                    }
                },
                interviewer: { select: { fullName: true, employeeNumber: true } }
            },
            orderBy: { scheduledDate: 'asc' }
        });
    }

    static async createInterview(payload: { applicationId: string; interviewerId: string; scheduledDate: Date; durationMinutes: number; type: string }) {
        return prisma.interview.create({ data: payload });
    }

    static async updateInterview(id: string, payload: { result?: string; feedback?: string }) {
        return prisma.interview.update({ where: { id }, data: payload });
    }

    static async deleteInterview(id: string) {
        return prisma.interview.delete({ where: { id } });
    }
}
