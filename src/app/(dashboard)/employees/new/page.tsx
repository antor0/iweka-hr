"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Gender, MaritalStatus, EmploymentStatus, EmploymentType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { CreateEmployeeSchema } from "@/lib/validators/employee.schema";

type BaseEmployeeFormValues = z.infer<typeof CreateEmployeeSchema>;
type EmployeeFormValues = Omit<BaseEmployeeFormValues, "hireDate" | "contractEndDate"> & {
    hireDate: string;
    contractEndDate?: string;
};

export default function AddEmployeePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Departments and Positions State
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [isFetchingPositions, setIsFetchingPositions] = useState(false);

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(CreateEmployeeSchema) as any,
        defaultValues: {
            employeeNumber: "",
            nik: "",
            fullName: "",
            email: "",
            phone: "",
            gender: "MALE",
            maritalStatus: "TK_0",
            hireDate: new Date().toISOString().split('T')[0],
            employmentStatus: EmploymentStatus.ACTIVE,
            employmentType: EmploymentType.PERMANENT,
            departmentId: "",
            positionId: "",
        },
    });

    const selectedDepartmentId = useWatch({
        control: form.control,
        name: "departmentId",
    });

    const selectedEmploymentType = useWatch({
        control: form.control,
        name: "employmentType",
    });

    // Fetch master data
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const depRes = await fetch("/api/v1/departments");
                const depData = await depRes.json();
                if (depData.data) setDepartments(depData.data);
            } catch (error) {
                console.error("Failed to load departments:", error);
            }
        };
        fetchMasterData();
    }, []);

    // Fetch positions dynamically when department changes
    useEffect(() => {
        const fetchPositions = async () => {
            if (!selectedDepartmentId) {
                setPositions([]);
                form.setValue("positionId", "");
                return;
            }
            setIsFetchingPositions(true);
            try {
                const posRes = await fetch(`/api/v1/positions?departmentId=${selectedDepartmentId}`);
                const posData = await posRes.json();
                if (posData.data) setPositions(posData.data);

                // Reset position if the new list doesn't contain the currently selected position
                const currentPos = form.getValues("positionId");
                if (currentPos && !posData.data.find((p: any) => p.id === currentPos)) {
                    form.setValue("positionId", "");
                }
            } catch (error) {
                console.error("Failed to load positions:", error);
            } finally {
                setIsFetchingPositions(false);
            }
        };
        fetchPositions();
    }, [selectedDepartmentId, form]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const response = await fetch("/api/v1/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to create employee");
            }

            router.push("/employees");
            router.refresh();
        } catch (error: any) {
            setErrorMsg(error.message || "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/employees">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
                    <p className="text-sm text-muted-foreground">Enter the details for the new employee record.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Employee Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">

                        {errorMsg && (
                            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium">
                                {errorMsg}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Details */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                                    <Input id="fullName" placeholder="e.g. Budi Santoso" {...form.register("fullName")} />
                                    {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nik">NIK (16 digits) <span className="text-destructive">*</span></Label>
                                    <Input id="nik" placeholder="16-digit National ID" {...form.register("nik")} />
                                    {form.formState.errors.nik && <p className="text-sm text-destructive">{form.formState.errors.nik.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                                    <Input id="email" type="email" placeholder="budi@company.co.id" {...form.register("email")} />
                                    {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" placeholder="081234567890" {...form.register("phone")} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select onValueChange={(v) => form.setValue('gender', v as Gender)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(Gender).map(g => (
                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maritalStatus">Marital Status</Label>
                                        <Select onValueChange={(v) => form.setValue('maritalStatus', v as MaritalStatus)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(MaritalStatus).map(m => (
                                                    <SelectItem key={m} value={m}>{m.replace('_', '/')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Details */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Employment Details</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="employeeNumber">Employee ID <span className="text-destructive">*</span></Label>
                                    <Input id="employeeNumber" placeholder="EMP-0001" {...form.register("employeeNumber")} />
                                    {form.formState.errors.employeeNumber && <p className="text-sm text-destructive">{form.formState.errors.employeeNumber.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Department <span className="text-destructive">*</span></Label>
                                        <Select
                                            onValueChange={(v) => form.setValue('departmentId', v)}
                                            value={form.watch('departmentId') || undefined}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Dept" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.departmentId && <p className="text-xs text-destructive">{form.formState.errors.departmentId.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role / Position <span className="text-destructive">*</span></Label>
                                        <Select
                                            onValueChange={(v) => form.setValue('positionId', v)}
                                            value={form.watch('positionId') || undefined}
                                            disabled={!selectedDepartmentId || isFetchingPositions}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={isFetchingPositions ? "Loading..." : "Select Position"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {positions.length > 0 ? positions.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                                )) : (
                                                    <SelectItem value="none" disabled>No positions available</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.positionId && <p className="text-xs text-destructive">{form.formState.errors.positionId.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hireDate">Hire Date <span className="text-destructive">*</span></Label>
                                    <Input id="hireDate" type="date" {...form.register("hireDate")} />
                                    {form.formState.errors.hireDate && <p className="text-sm text-destructive">{form.formState.errors.hireDate.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="employmentType">Type <span className="text-destructive">*</span></Label>
                                        <Select
                                            defaultValue={EmploymentType.PERMANENT}
                                            onValueChange={(v) => form.setValue('employmentType', v as EmploymentType)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.values(EmploymentType).map(t => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="employmentStatus">Status <span className="text-destructive">*</span></Label>
                                        <Select
                                            defaultValue={EmploymentStatus.ACTIVE}
                                            onValueChange={(v) => form.setValue('employmentStatus', v as EmploymentStatus)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.values(EmploymentStatus).map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {selectedEmploymentType === EmploymentType.CONTRACT && (
                                    <div className="space-y-2">
                                        <Label htmlFor="contractEndDate">Contract End Date <span className="text-destructive">*</span></Label>
                                        <Input id="contractEndDate" type="date" {...form.register("contractEndDate")} required={selectedEmploymentType === EmploymentType.CONTRACT} />
                                        {form.formState.errors.contractEndDate && <p className="text-sm text-destructive">{form.formState.errors.contractEndDate.message as string}</p>}
                                    </div>
                                )}

                                <div className="space-y-2 mt-6">
                                    <Label htmlFor="npwp">NPWP (Tax Number)</Label>
                                    <Input id="npwp" placeholder="00.000.000.0-000.000" {...form.register("npwp")} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="baseSalary">Basic Salary Override <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                                    <Input
                                        id="baseSalary"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        placeholder="e.g. 8000000"
                                        {...form.register("baseSalary")}
                                    />
                                    <p className="text-xs text-muted-foreground">If set, this overrides the grade midpoint during payroll calculation.</p>
                                    {form.formState.errors.baseSalary && <p className="text-sm text-destructive">{form.formState.errors.baseSalary.message as string}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button type="button" variant="outline" className="mr-4" asChild>
                                <Link href="/employees">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4" /> Save Employee</>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
