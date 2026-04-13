import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { SessionPayload } from "./session";
import { Permission, ROLE_PERMISSIONS, PERMISSION_GROUPS, hasPermission } from "./permissions-config";

export { type Permission, ROLE_PERMISSIONS, PERMISSION_GROUPS, hasPermission };

export function requirePermission(session: SessionPayload | null, permission: Permission): NextResponse | null {
    if (!session || !session.role) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, permission)) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    return null;
}
