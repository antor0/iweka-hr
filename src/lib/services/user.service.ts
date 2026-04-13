import { prisma } from "../db/prisma";
import { CreateUserRequest, UpdateUserRequest } from "../validators/user.schema";
import bcrypt from "bcryptjs";

export class UserService {
    static async getUsers() {
        return prisma.user.findMany({
            include: {
                employee: {
                    select: {
                        fullName: true,
                        employeeNumber: true,
                        position: {
                            select: { title: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    static async createUser(data: CreateUserRequest) {
        if (data.employeeId) {
            const existing = await prisma.user.findUnique({ where: { employeeId: data.employeeId } });
            if (existing) throw new Error("Employee profile is already linked to another user account");
        }

        const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingEmail) throw new Error("Email is already in use by another user account");

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);

        return prisma.user.create({
            data: {
                email: data.email,
                role: data.role,
                isActive: data.isActive ?? true,
                employeeId: data.employeeId || null,
                passwordHash
            }
        });
    }

    static async updateUser(id: string, data: UpdateUserRequest) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error("User not found");

        if (data.email && data.email !== user.email) {
            const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
            if (existingEmail) throw new Error("Email is already in use by another user account");
        }

        if (data.employeeId && data.employeeId !== user.employeeId) {
            const existingEmp = await prisma.user.findUnique({ where: { employeeId: data.employeeId } });
            if (existingEmp) throw new Error("Employee profile is already linked to another user account");
        }

        return prisma.user.update({
            where: { id },
            data: {
                email: data.email,
                role: data.role,
                isActive: data.isActive,
                employeeId: data.employeeId === undefined ? undefined : data.employeeId
            }
        });
    }

    static async resetPassword(id: string, newPassword: string) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        return prisma.user.update({
            where: { id },
            data: { passwordHash }
        });
    }

    static async deleteUser(id: string) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error("User not found");

        // Prevent deleting the last system admin
        if (user.role === "SYSTEM_ADMIN") {
            const adminCount = await prisma.user.count({ where: { role: "SYSTEM_ADMIN" } });
            if (adminCount <= 1) throw new Error("Cannot delete the last System Administrator");
        }

        return prisma.user.delete({ where: { id } });
    }
}
