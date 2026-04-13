import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export class AuthService {
    /**
     * Authenticates a user with email and password
     */
    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { employee: true },
        });

        if (!user || (!user.isActive && user.role !== UserRole.SYSTEM_ADMIN)) {
            return null; // Invalid credentials or inactive user
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return null;
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            fullName: user.fullName || user.employee?.fullName || user.email.split("@")[0],
            photoUrl: user.photoUrl || user.employee?.photoUrl || null,
        };
    }
}
