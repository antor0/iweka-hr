"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateEmployeeSchema } from "@/lib/validators/employee.schema";
import { z } from "zod";

type BaseEmployeeFormValues = z.infer<typeof CreateEmployeeSchema>;
type EmployeeFormValues = Omit<BaseEmployeeFormValues, "hireDate"> & {
    hireDate: string;
};

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
            employmentStatus: "ACTIVE",
            employmentType: "PERMANENT",
            departmentId: "",
            positionId: "",
        }
    });

    const selectedDepartmentId = useWatch({
        control: form.control,
        name: "departmentId",
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
                return;
            }
            setIsFetchingPositions(true);
            try {
                const posRes = await fetch(`/api/v1/positions?departmentId=${selectedDepartmentId}`);
                const posData = await posRes.json();
                if (posData.data) setPositions(posData.data);

                // Clear position if the new list doesn't contain the currently selected position
                // BUT only if it's not the initial load where the API might still be fetching
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

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                // In Next 15+ params handling
                const unresolvedParams = params as any;
                const id = unresolvedParams.id;

                const res = await fetch(`/api/v1/employees/${id}`);
                const data = await res.json();
                if (data.data) {
                    const emp = data.data;
                    form.reset({
                        employeeNumber: emp.employeeNumber,
                        nik: emp.nik,
                        fullName: emp.fullName,
                        email: emp.email,
                        phone: emp.phone || "",
                        gender: emp.gender,
                        maritalStatus: emp.maritalStatus,
                        hireDate: new Date(emp.hireDate).toISOString().split('T')[0],
                        employmentStatus: emp.employmentStatus,
                        employmentType: emp.employmentType,
                        departmentId: emp.departmentId || "",
                        positionId: emp.positionId || "",
                    });
                }
            } catch (error) {
                console.error("Failed to load employee:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEmployee();
    }, [params, form]);

    async function onSubmit(data: EmployeeFormValues) {
        setIsSaving(true);
        try {
            const id = (params as any).id;
            const res = await fetch(`/api/v1/employees/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to edit employee");
            }

            router.push("/employees");
            router.refresh();
        } catch (error: any) {
            console.error("Error saving employee:", error);
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/employees">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Edit Employee</h1>
                    <p className="text-sm text-muted-foreground mt-1">Update employee's core personnel data.</p>
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit as any, (err) => console.log(err))} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employeeNumber">Employee Number *</Label>
                                <Input id="employeeNumber" {...form.register("employeeNumber")} placeholder="EMP-0001" readOnly className="bg-muted" />
                                {form.formState.errors.employeeNumber && <p className="text-xs text-destructive">{form.formState.errors.employeeNumber.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nik">NIK (National ID) *</Label>
                                <Input id="nik" {...form.register("nik")} placeholder="16 digit KTP number" />
                                {form.formState.errors.nik && <p className="text-xs text-destructive">{form.formState.errors.nik.message}</p>}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input id="fullName" {...form.register("fullName")} placeholder="John Doe" />
                                {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address *</Label>
                                <Input id="email" type="email" {...form.register("email")} placeholder="john@company.co.id" />
                                {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" {...form.register("phone")} placeholder="08123456789" />
                                {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select
                                    onValueChange={(val) => form.setValue("gender", val as any)}
                                    defaultValue={form.getValues("gender")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Marital Status</Label>
                                <Select
                                    onValueChange={(val) => form.setValue("maritalStatus", val as any)}
                                    defaultValue={form.getValues("maritalStatus")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TK_0">TK/0 (Single)</SelectItem>
                                        <SelectItem value="K_0">K/0 (Married, No Kids)</SelectItem>
                                        <SelectItem value="K_1">K/1 (Married, 1 Kid)</SelectItem>
                                        <SelectItem value="K_2">K/2 (Married, 2 Kids)</SelectItem>
                                        <SelectItem value="K_3">K/3 (Married, 3 Kids)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid grid-cols-2 gap-4 md:col-span-2">
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
                                <Label htmlFor="hireDate">Hire Date *</Label>
                                <Input
                                    id="hireDate"
                                    type="date"
                                    {...form.register("hireDate")}
                                />
                                {form.formState.errors.hireDate && <p className="text-xs text-destructive">{form.formState.errors.hireDate.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Employment Status</Label>
                                <Select
                                    onValueChange={(val) => form.setValue("employmentStatus", val as any)}
                                    defaultValue={form.getValues("employmentStatus")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="PROBATION">Probation</SelectItem>
                                        <SelectItem value="RESIGNED">Resigned</SelectItem>
                                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Employment Type</Label>
                                <Select
                                    onValueChange={(val) => form.setValue("employmentType", val as any)}
                                    defaultValue={form.getValues("employmentType")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERMANENT">Permanent</SelectItem>
                                        <SelectItem value="CONTRACT">Contract (PKWT)</SelectItem>
                                        <SelectItem value="INTERNSHIP">Internship</SelectItem>
                                        <SelectItem value="PART_TIME">Part-Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3 mt-8">
                    <Button variant="outline" type="button" onClick={() => router.push("/employees")}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
