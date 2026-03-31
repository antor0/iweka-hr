"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Pencil, User, Mail, Phone, Building2, Briefcase, Calendar, FileText, Loader2, KeyRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ViewEmployeePage() {
    const params = useParams();
    const router = useRouter();
    const [employee, setEmployee] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isResettingPin, setIsResettingPin] = useState(false);
    const [pinResetMsg, setPinResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleResetPin = async () => {
        if (!employee) return;
        const confirmed = window.confirm(`Reset PIN ESS untuk ${employee.fullName} ke 123456? Mereka akan diminta ganti PIN saat login berikutnya.`);
        if (!confirmed) return;
        setIsResettingPin(true);
        setPinResetMsg(null);
        try {
            const res = await fetch(`/api/v1/employees/${employee.id}/reset-pin`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setPinResetMsg({ type: "success", text: data.message });
            } else {
                setPinResetMsg({ type: "error", text: data.error || "Gagal reset PIN" });
            }
        } catch {
            setPinResetMsg({ type: "error", text: "Tidak dapat terhubung ke server" });
        } finally { setIsResettingPin(false); }
    };

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                // In Next 15+ params handling
                const unresolvedParams = params as any;
                const id = unresolvedParams.id;

                const res = await fetch(`/api/v1/employees/${id}`);
                const data = await res.json();
                if (data.data) {
                    setEmployee(data.data);
                }
            } catch (error) {
                console.error("Failed to load employee:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEmployee();
    }, [params]);

    if (isLoading) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
                <p className="text-muted-foreground">Employee not found.</p>
                <Button onClick={() => router.push("/employees")}>Back to Directory</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/employees">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Employee Profile</h1>
                        <p className="text-sm text-muted-foreground mt-1">Detailed personnel view.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleResetPin} disabled={isResettingPin} id="reset-pin-btn">
                        {isResettingPin ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />}
                        Reset ESS PIN
                    </Button>
                    <Button asChild>
                        <Link href={`/employees/${employee.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit Profile
                        </Link>
                    </Button>
                </div>
            </div>

            {pinResetMsg && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
                    pinResetMsg.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}>
                    {pinResetMsg.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Profile Snapshot */}
                <Card className="md:col-span-1 border-primary/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-xl" />
                    <CardContent className="pt-12 flex flex-col items-center relative z-10">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-md shadow-primary/10">
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                {employee.fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>

                        <h2 className="mt-4 text-xl font-semibold text-center">{employee.fullName}</h2>
                        <p className="text-sm text-muted-foreground mb-4">{employee.position?.title || "No Position"}</p>

                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <Badge variant={employee.employmentStatus === 'ACTIVE' ? 'success' : 'secondary'}>
                                {employee.employmentStatus}
                            </Badge>
                            <Badge variant="outline">{employee.employmentType}</Badge>
                        </div>

                        <div className="w-full pt-4 border-t border-border/50 flex flex-col gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4 shrink-0 text-primary/70" />
                                <span className="truncate">{employee.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                                <span>{employee.phone || "-"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Section */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5 text-primary/70" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">National ID (NIK)</p>
                                <p className="font-medium text-sm mt-1">{employee.nik}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Gender</p>
                                <p className="font-medium text-sm mt-1 capitalize">{employee.gender.toLowerCase()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Marital Status</p>
                                <p className="font-medium text-sm mt-1">{employee.maritalStatus.replace("_", " ")}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tax ID (NPWP)</p>
                                <p className="font-medium text-sm mt-1">{employee.npwp || "-"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Briefcase className="h-5 w-5 text-primary/70" />
                                Employment Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Employee ID</p>
                                <p className="font-mono text-sm mt-1">{employee.employeeNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Department</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="font-medium text-sm">{employee.department?.name || "-"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Join Date</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="font-medium text-sm">
                                        {(() => {
                                            const d = new Date(employee.hireDate);
                                            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                        })()}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Direct Manager</p>
                                <p className="font-medium text-sm mt-1">{employee.manager?.fullName || "None"}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
