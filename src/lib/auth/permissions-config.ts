import { UserRole } from "@prisma/client";

// Define all permission keys
export type Permission =
    | "*" // Wildcard for full access
    | "users.manage"
    | "employees.read" | "employees.write"
    | "organization.read" | "organization.write"
    | "attendance.read" | "attendance.write"
    | "leave.read" | "leave.approve"
    | "claims.read" | "claims.approve"
    | "payroll.read" | "payroll.run" | "payroll.approve"
    | "recruitment.manage"
    | "reports.read"
    | "settings.manage"
    | "surat.manage";

// Map: which roles have which permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    SYSTEM_ADMIN: ["*"],
    HR_ADMIN: [
        "employees.*", 
        "organization.*", 
        "attendance.*", 
        "leave.*", 
        "claims.*", 
        "payroll.*", 
        "reports.*", 
        "surat.*",
        "recruitment.manage"
    ],
    HR_MANAGER: [
        "employees.read", 
        "organization.read", 
        "attendance.read", 
        "leave.read", 
        "leave.approve", 
        "claims.read", 
        "claims.approve", 
        "payroll.read",
        "recruitment.manage",
        "reports.read"
    ],
    PAYROLL_SPECIALIST: [
        "employees.read", 
        "payroll.*", 
        "reports.read"
    ],
    FINANCE: [
        "claims.read", 
        "claims.approve", 
        "payroll.read", 
        "reports.read"
    ],
    LINE_MANAGER: [
        "employees.read", 
        "attendance.read", 
        "leave.read", 
        "leave.approve"
    ],
    EMPLOYEE: [], // ESS-only, no desktop access
};

export const PERMISSION_GROUPS = [
    {
        name: "Employees",
        permissions: ["employees.read", "employees.write"],
    },
    {
        name: "Organization",
        permissions: ["organization.read", "organization.write"],
    },
    {
        name: "Attendance",
        permissions: ["attendance.read", "attendance.write"],
    },
    {
        name: "Leave",
        permissions: ["leave.read", "leave.approve"],
    },
    {
        name: "Claims",
        permissions: ["claims.read", "claims.approve"],
    },
    {
        name: "Payroll",
        permissions: ["payroll.read", "payroll.run", "payroll.approve"],
    },
    {
        name: "Recruitment",
        permissions: ["recruitment.manage"],
    },
    {
        name: "Reports",
        permissions: ["reports.read"],
    },
    {
        name: "Settings & Users",
        permissions: ["settings.manage", "users.manage"],
    },
    {
        name: "Surat",
        permissions: ["surat.manage"],
    }
];

export function hasPermission(role: string, requiredPermission: Permission): boolean {
    const userRole = role as UserRole;
    if (!ROLE_PERMISSIONS[userRole]) {
        return false;
    }

    const permissions = ROLE_PERMISSIONS[userRole];

    if (permissions.includes("*")) {
        return true;
    }

    if (permissions.includes(requiredPermission)) {
        return true;
    }

    // Check for group wildcards (e.g., "employees.*" grants "employees.write")
    const [module] = requiredPermission.split(".");
    if (module && permissions.includes(`${module}.*` as string)) {
        return true;
    }

    return false;
}
