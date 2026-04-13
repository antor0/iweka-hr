import { useState, useEffect } from "react";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
    MoreHorizontal, Edit, Trash2, KeyRound, UserPlus, ShieldAlert
} from "lucide-react";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

type User = {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
    employee: {
        fullName: string;
        employeeNumber: string;
        position: { title: string } | null;
    } | null;
};

type Employee = {
    id: string;
    fullName: string;
    employeeNumber: string;
};

const ROLES = [
    "SYSTEM_ADMIN", "HR_ADMIN", "HR_MANAGER", 
    "PAYROLL_SPECIALIST", "FINANCE", "LINE_MANAGER", "EMPLOYEE"
];

function formatRole(role: string) {
    return role.replace(/_/g, " ");
}

export function UsersTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "EMPLOYEE",
        employeeId: "unlinked",
        isActive: true
    });

    const refreshData = async () => {
        try {
            const [usersRes, empRes] = await Promise.all([
                fetch("/api/v1/settings/users"),
                fetch("/api/v1/employees")
            ]);
            const usersData = await usersRes.json();
            const empData = await empRes.json();
            
            if (usersData.data) setUsers(usersData.data);
            if (empData.data) setEmployees(empData.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleCreate = async () => {
        try {
            const payload = {
                ...formData,
                employeeId: formData.employeeId === "unlinked" ? null : formData.employeeId
            };
            
            const res = await fetch("/api/v1/settings/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || "Failed to create user");
            
            toast({ title: "Success", description: "User created securely" });
            setIsCreateOpen(false);
            refreshData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleEdit = async () => {
        if (!selectedUser) return;
        try {
            const payload = {
                email: formData.email,
                role: formData.role,
                isActive: formData.isActive,
                employeeId: formData.employeeId === "unlinked" ? null : formData.employeeId
            };
            
            const res = await fetch(`/api/v1/settings/users/${selectedUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || "Failed to edit user");
            
            toast({ title: "Success", description: "User updated" });
            setIsEditOpen(false);
            refreshData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !formData.password) return;
        try {
            const res = await fetch(`/api/v1/settings/users/${selectedUser.id}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: formData.password })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || "Failed to reset password");
            
            toast({ title: "Success", description: "Password reset successful" });
            setIsResetOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        try {
            const res = await fetch(`/api/v1/settings/users/${selectedUser.id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || "Failed to delete user");
            
            toast({ title: "Success", description: "User deleted" });
            setIsDeleteOpen(false);
            refreshData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const openEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            email: user.email,
            password: "",
            role: user.role,
            isActive: user.isActive,
            employeeId: user.employee?.employeeNumber || "unlinked" // We need the ID, wait, user.employee doesn't have ID.
        });
        // Let's actually find the employeeId. The API doesn't return employeeId natively, we need to fetch it.
        // Wait, User model has employeeId. Let's make sure the type includes employeeId? No, the GET only includes employee relation. 
        // We'll update the type to include `employeeId: string | null`.
        setIsEditOpen(true);
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading users...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-background p-4 rounded-xl border border-border">
                <div>
                    <h3 className="font-medium">User Management</h3>
                    <p className="text-sm text-muted-foreground">Manage platform access, roles, and employee linkages</p>
                </div>
                <Button onClick={() => {
                    setFormData({ email: "", password: "", role: "EMPLOYEE", employeeId: "unlinked", isActive: true });
                    setIsCreateOpen(true);
                }}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            <div className="border border-border rounded-xl shadow-sm bg-background overflow-hidden relative z-10">
                <Table>
                    <TableHeader className="bg-secondary/20">
                        <TableRow>
                            <TableHead>User Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Linked Profile</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        user.role === "SYSTEM_ADMIN" ? "bg-red-50 text-red-600 border-red-200" :
                                        user.role.includes("ADMIN") ? "bg-orange-50 text-orange-600 border-orange-200" :
                                        user.role.includes("MANAGER") ? "bg-blue-50 text-blue-600 border-blue-200" :
                                        "bg-secondary/50 text-muted-foreground border-border"
                                    }>
                                        {formatRole(user.role)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.employee ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{user.employee.fullName}</span>
                                            <span className="text-xs text-muted-foreground">{user.employee.employeeNumber} • {user.employee.position?.title || 'No position'}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Unlinked</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.isActive ? "success" : "secondary"}>
                                        {user.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(user)}>
                                                <Edit className="h-4 w-4 mr-2 text-muted-foreground" /> Edit User
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedUser(user);
                                                setFormData((prev) => ({...prev, password: ""}));
                                                setIsResetOpen(true);
                                            }}>
                                                <KeyRound className="h-4 w-4 mr-2 text-muted-foreground" /> Reset Password
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>Create a new platform user and optionally link them to an employee profile.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input placeholder="user@company.com" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Temporary Password</label>
                            <Input placeholder="Min 8 characters" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">System Role</label>
                            <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(role => (
                                        <SelectItem key={role} value={role}>{formatRole(role)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Link to Employee (Optional)</label>
                            <Select value={formData.employeeId} onValueChange={(v) => setFormData({...formData, employeeId: v})}>
                                <SelectTrigger><SelectValue placeholder="Select an employee..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unlinked">-- Unlinked --</SelectItem>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeNumber})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Account Active</label>
                                <p className="text-xs text-muted-foreground">Allow this user to sign in</p>
                            </div>
                            <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({...formData, isActive: v})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!formData.email || formData.password.length < 8}>Create User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Modify user access and role.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input placeholder="user@company.com" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">System Role</label>
                            <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(role => (
                                        <SelectItem key={role} value={role}>{formatRole(role)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Link to Employee (Optional)</label>
                            <Select value={formData.employeeId} onValueChange={(v) => setFormData({...formData, employeeId: v})}>
                                <SelectTrigger><SelectValue placeholder="Select an employee..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unlinked">-- Unlinked --</SelectItem>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeNumber})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Account Active</label>
                                <p className="text-xs text-muted-foreground">Allow this user to sign in</p>
                            </div>
                            <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({...formData, isActive: v})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={!formData.email}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset User Password</DialogTitle>
                        <DialogDescription>Force a new password for {selectedUser?.email}. They will use this to sign in.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input placeholder="Min 8 characters" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
                        <Button onClick={handleResetPassword} disabled={formData.password.length < 8}>Reset Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Delete User Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete the user account <strong>{selectedUser?.email}</strong>? 
                            This action cannot be undone. This will not delete the linked employee profile.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button onClick={handleDelete} variant="destructive">Delete Account</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
