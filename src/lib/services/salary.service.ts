import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { EmployeeAllowanceSchema, MonthlyVariableInputSchema } from "../validators/salary.schema";

export class SalaryService {
    // ----------------------------------------------------------------------
    // EMPLOYEE ALLOWANCES
    // ----------------------------------------------------------------------
    static async getEmployeeAllowances(employeeId: string) {
        return prisma.employeeAllowance.findMany({
            where: { employeeId },
            orderBy: { name: "asc" },
        });
    }

    static async createEmployeeAllowance(employeeId: string, payload: z.infer<typeof EmployeeAllowanceSchema>) {
        return prisma.employeeAllowance.create({
            data: {
                employeeId,
                name: payload.name,
                category: payload.category,
                basis: payload.basis,
                amount: payload.amount,
                isActive: payload.isActive,
            },
        });
    }

    static async updateEmployeeAllowance(id: string, payload: z.infer<typeof EmployeeAllowanceSchema>) {
        return prisma.employeeAllowance.update({
            where: { id },
            data: {
                name: payload.name,
                category: payload.category,
                basis: payload.basis,
                amount: payload.amount,
                isActive: payload.isActive,
            },
        });
    }

    static async deleteEmployeeAllowance(id: string) {
        return prisma.employeeAllowance.delete({ where: { id } });
    }

    // ----------------------------------------------------------------------
    // MONTHLY VARIABLE INPUTS
    // ----------------------------------------------------------------------
    static async getMonthlyVariableInputs(employeeId: string, limit = 12) {
        return prisma.monthlyVariableInput.findMany({
            where: { employeeId },
            orderBy: [
                { year: "desc" },
                { month: "desc" }
            ],
            take: limit
        });
    }

    static async getMonthlyVariableInputByPeriod(employeeId: string, month: number, year: number) {
        return prisma.monthlyVariableInput.findUnique({
            where: {
                employeeId_month_year: {
                    employeeId,
                    month,
                    year
                }
            }
        });
    }

    static async upsertMonthlyVariableInput(employeeId: string, payload: z.infer<typeof MonthlyVariableInputSchema>) {
        return prisma.monthlyVariableInput.upsert({
            where: {
                employeeId_month_year: {
                    employeeId,
                    month: payload.month,
                    year: payload.year,
                }
            },
            update: {
                thrAmount: payload.thrAmount,
                overtimeAmount: payload.overtimeAmount,
                commissionAmount: payload.commissionAmount,
                bonusAmount: payload.bonusAmount,
                notes: payload.notes,
            },
            create: {
                employeeId,
                month: payload.month,
                year: payload.year,
                thrAmount: payload.thrAmount,
                overtimeAmount: payload.overtimeAmount,
                commissionAmount: payload.commissionAmount,
                bonusAmount: payload.bonusAmount,
                notes: payload.notes,
            }
        });
    }
}
