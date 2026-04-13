"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Users, MapPin, Loader2, Briefcase, Plus, Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { GitMerge, Settings2, ShieldCheck, UserCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DepartmentWorkModelsCard } from "./components/work-models-card";
import { DepartmentScheduleCard } from "./components/schedule-card";
import { DepartmentTimesheetCard } from "./components/timesheet-card";

export default function DepartmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [department, setDepartment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

    // Position state
    const [isCreatePositionOpen, setIsCreatePositionOpen] = useState(false);
    const [isCreatingPosition, setIsCreatingPosition] = useState(false);
    const [newPositionTitle, setNewPositionTitle] = useState("");
    const [newPositionCode, setNewPositionCode] = useState("");

    // Head of Department state
    const [isAssignHeadOpen, setIsAssignHeadOpen] = useState(false);
    const [isAssigningHead, setIsAssigningHead] = useState(false);
    const [headSearchQuery, setHeadSearchQuery] = useState("");
    const [headSearchResults, setHeadSearchResults] = useState<any[]>([]);
    const [selectedHeadId, setSelectedHeadId] = useState<string>("");
    const { toast } = useToast();

    // Workflow state
    const [isManageWorkflowsOpen, setIsManageWorkflowsOpen] = useState(false);
    const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
    const [workflowData, setWorkflowData] = useState<any[]>([]);
    const [allEmployees, setAllEmployees] = useState<any[]>([]);

    // Employee Work Model state
    const [isAssignEmployeeWorkModelOpen, setIsAssignEmployeeWorkModelOpen] = useState(false);
    const [isAssigningEmployeeWorkModel, setIsAssigningEmployeeWorkModel] = useState(false);
    const [selectedEmployeeForWorkModel, setSelectedEmployeeForWorkModel] = useState<string>("ALL");
    const [selectedWorkModelForEmployee, setSelectedWorkModelForEmployee] = useState<string>("");

    const fetchDepartment = async () => {
        try {
            const res = await fetch(`/api/v1/departments/${params.id}`);
            const json = await res.json();
            if (json.data) {
                setDepartment(json.data);
                setWorkflowData(json.data.approvalWorkflows || []);
            }
        } catch (error) {
            console.error("Failed to fetch department", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllEmployees = async () => {
        try {
            const res = await fetch("/api/v1/employees?limit=200");
            const json = await res.json();
            if (json.data) setAllEmployees(json.data);
        } catch { }
    };

    const handleApplyHeadToAll = async () => {
        if (!department?.headId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Department must have a head assigned first."
            });
            return;
        }

        setIsSavingWorkflow(true);
        try {
            const res = await fetch("/api/v1/organization/approval-workflows", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    departmentId: department.id,
                    headId: department.headId
                })
            });

            if (!res.ok) throw new Error("Failed to apply head to all workflows");

            toast({
                title: "Success",
                description: "All workflows updated to Department Head."
            });
            fetchDepartment();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message
            });
        } finally {
            setIsSavingWorkflow(false);
        }
    };

    const handleSaveWorkflow = async (type: string, l1: string, l2: string | null) => {
        setIsSavingWorkflow(true);
        try {
            const res = await fetch("/api/v1/organization/approval-workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    departmentId: department.id,
                    approvalType: type,
                    level1ApproverId: l1,
                    level2ApproverId: l2 === "none" ? null : l2,
                    isActive: true
                })
            });

            if (!res.ok) throw new Error("Failed to save workflow");

            toast({
                title: "Success",
                description: `${type} workflow updated.`
            });
            fetchDepartment();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message
            });
        } finally {
            setIsSavingWorkflow(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchDepartment();
            fetchAllEmployees();
        }
    }, [params.id]);

    const handleSearchEmployees = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/v1/employees?search=${query}&limit=20`);
            const json = await res.json();
            if (json.data) {
                const filtered = json.data.filter((emp: any) => emp.departmentId !== department?.id);
                setSearchResults(filtered);
            }
        } catch (error) {
            console.error("Failed to search employees", error);
        }
    };

    const handleAssignEmployee = async () => {
        if (!selectedEmployeeId) {
            alert("Please select an employee");
            return;
        }
        setIsAssigning(true);
        try {
            const res = await fetch(`/api/v1/employees/${selectedEmployeeId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ departmentId: department.id })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to assign employee");

            setIsAssignOpen(false);
            setSearchQuery("");
            setSearchResults([]);
            setSelectedEmployeeId("");
            fetchDepartment();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleAssignEmployeeWorkModel = async () => {
        if (!selectedWorkModelForEmployee) {
            alert("Please select a work model");
            return;
        }
        setIsAssigningEmployeeWorkModel(true);
        try {
            const res = await fetch(`/api/v1/departments/${department.id}/assign-work-model`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workTimeModelId: selectedWorkModelForEmployee,
                    employeeIds: selectedEmployeeForWorkModel === "ALL" ? "ALL" : [selectedEmployeeForWorkModel]
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to assign work model to employee(s)");

            toast({ title: "Success", description: `Updated ${json.updatedCount} employees` });
            setIsAssignEmployeeWorkModelOpen(false);
            fetchDepartment();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsAssigningEmployeeWorkModel(false);
        }
    };

    const handleCreatePosition = async () => {
        if (!newPositionTitle || !newPositionCode) {
            alert("Title and Code are required");
            return;
        }

        setIsCreatingPosition(true);
        try {
            const res = await fetch("/api/v1/positions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newPositionTitle,
                    code: newPositionCode,
                    departmentId: department.id
                })
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to create position");

            setIsCreatePositionOpen(false);
            setNewPositionTitle("");
            setNewPositionCode("");
            fetchDepartment(); // Refresh department to fetch new positions
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsCreatingPosition(false);
        }
    };

    const handleSearchHead = async (query: string) => {
        setHeadSearchQuery(query);
        if (query.length < 2) {
            setHeadSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/v1/employees?search=${query}&limit=20`);
            const json = await res.json();
            if (json.data) {
                const filtered = json.data.filter((emp: any) => emp.id !== department?.headId);
                setHeadSearchResults(filtered);
            }
        } catch (error) {
            console.error("Failed to search heads", error);
        }
    };

    const handleAssignHead = async () => {
        if (!selectedHeadId) {
            alert("Please select an employee");
            return;
        }
        setIsAssigningHead(true);
        try {
            const res = await fetch(`/api/v1/departments/${department.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ headId: selectedHeadId })
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to update department head");

            setIsAssignHeadOpen(false);
            setHeadSearchQuery("");
            setHeadSearchResults([]);
            setSelectedHeadId("");
            fetchDepartment();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsAssigningHead(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!department) {
        return (
            <div className="flex flex-col h-[300px] w-full items-center justify-center space-y-4">
                <h2 className="text-xl font-semibold">Department Not Found</h2>
                <Button variant="outline" onClick={() => router.push("/organization")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Organization
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        {department.name}
                    </h1>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Badge variant="outline">{department.code}</Badge>
                        </span>
                        {department.parent && (
                            <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                Parent: {department.parent.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 1: Dept Info (left) + Work Models (right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Department Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b group">
                            <span className="text-sm font-medium text-muted-foreground w-1/3">Head of Department</span>
                            <div className="flex items-center gap-2 justify-end w-2/3">
                                <span className="text-sm truncate">
                                    {department.head?.fullName || "Not Assigned"}
                                </span>
                                <Dialog open={isAssignHeadOpen} onOpenChange={setIsAssignHeadOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Assign Department Head</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search employees by name..."
                                                        className="pl-9"
                                                        value={headSearchQuery}
                                                        onChange={(e) => handleSearchHead(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {headSearchResults.length > 0 && (
                                                <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                                                    {headSearchResults.map(emp => (
                                                        <div
                                                            key={emp.id}
                                                            className={`p-3 cursor-pointer hover:bg-muted transition-colors ${selectedHeadId === emp.id ? 'bg-primary/10' : ''}`}
                                                            onClick={() => setSelectedHeadId(emp.id)}
                                                        >
                                                            <p className="font-medium text-sm">{emp.fullName}</p>
                                                            <p className="text-xs text-muted-foreground">{emp.employeeNumber} - {emp.department?.name || 'No Dept'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {headSearchQuery.length >= 2 && headSearchResults.length === 0 && (
                                                <p className="text-sm text-center text-muted-foreground py-4">No employees found.</p>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAssignHeadOpen(false)} disabled={isAssigningHead}>Cancel</Button>
                                            <Button onClick={handleAssignHead} disabled={isAssigningHead || !selectedHeadId}>
                                                {isAssigningHead && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                Assign Head
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium text-muted-foreground">Location</span>
                            <span className="text-sm flex items-center gap-1 text-right">
                                <MapPin className="h-3.5 w-3.5" />
                                {department.location?.name || "Not Assigned"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium text-muted-foreground">Description</span>
                            <span className="text-sm text-right max-w-[200px] leading-relaxed">
                                {department.description || "No description provided."}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <DepartmentWorkModelsCard
                    departmentId={department.id}
                    departmentWorkModels={department.departmentWorkModels || []}
                    onRefresh={fetchDepartment}
                />
            </div>

            {/* Row 2: Employees (left) + Positions (right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 mt-0">
                            <Briefcase className="h-5 w-5 text-accent" />
                            Employees ({department.employees?.length || 0})
                        </CardTitle>
                        <div className="flex gap-2">
                            <Dialog open={isAssignEmployeeWorkModelOpen} onOpenChange={setIsAssignEmployeeWorkModelOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-8">
                                        <Clock className="h-4 w-4 mr-1.5" /> Assign Shift
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Assign Work Model to Employee(s)</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Select Work Model</Label>
                                            <Select
                                                value={selectedWorkModelForEmployee}
                                                onValueChange={setSelectedWorkModelForEmployee}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select work model..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {department.departmentWorkModels?.map((dwm: any) => (
                                                        <SelectItem key={dwm.workTimeModelId} value={dwm.workTimeModelId}>
                                                            {dwm.workTimeModel.name} ({dwm.workTimeModel.type})
                                                        </SelectItem>
                                                    ))}
                                                    {!department.departmentWorkModels?.length && (
                                                        <SelectItem value="none" disabled>No models assigned to this department</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Apply To</Label>
                                            <Select
                                                value={selectedEmployeeForWorkModel}
                                                onValueChange={setSelectedEmployeeForWorkModel}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select employees..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Apply to All Employees</SelectItem>
                                                    {department.employees?.map((emp: any) => (
                                                        <SelectItem key={emp.id} value={emp.id}>
                                                            {emp.fullName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAssignEmployeeWorkModelOpen(false)} disabled={isAssigningEmployeeWorkModel}>Cancel</Button>
                                        <Button onClick={handleAssignEmployeeWorkModel} disabled={isAssigningEmployeeWorkModel || !selectedWorkModelForEmployee}>
                                            {isAssigningEmployeeWorkModel && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                            Apply
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-8">
                                        <Plus className="h-4 w-4 mr-1.5" /> Add
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Assign Employee to Department</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search employees by name..."
                                                    className="pl-9"
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearchEmployees(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {searchResults.length > 0 && (
                                            <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                                                {searchResults.map(emp => (
                                                    <div
                                                        key={emp.id}
                                                        className={`p-3 cursor-pointer hover:bg-muted transition-colors ${selectedEmployeeId === emp.id ? 'bg-primary/10' : ''}`}
                                                        onClick={() => setSelectedEmployeeId(emp.id)}
                                                    >
                                                        <p className="font-medium text-sm">{emp.fullName}</p>
                                                        <p className="text-xs text-muted-foreground">{emp.employeeNumber} - {emp.position?.title || 'No Title'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {searchQuery.length >= 2 && searchResults.length === 0 && (
                                            <p className="text-sm text-center text-muted-foreground py-4">No available employees found.</p>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAssignOpen(false)} disabled={isAssigning}>Cancel</Button>
                                        <Button onClick={handleAssignEmployee} disabled={isAssigning || !selectedEmployeeId}>
                                            {isAssigning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                            Assign Employee
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {department.employees && department.employees.length > 0 ? (
                            <div className="space-y-3">
                                {department.employees.map((emp: any) => (
                                    <div key={emp.id} className="flex justify-between items-center p-3 rounded-lg border bg-card/50 hover:bg-muted/30 transition-colors">
                                        <div>
                                            <p className="font-medium text-sm flex items-center gap-2">
                                                {emp.fullName}
                                                {emp.workTimeModel && (
                                                    <Badge variant="outline" className="text-[10px] font-normal leading-tight px-1.5 py-0 bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {emp.workTimeModel.name}
                                                    </Badge>
                                                )}
                                                {!emp.workTimeModel && (
                                                    <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 text-muted-foreground">Unassigned</Badge>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{emp.position?.title || "No Title"}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => router.push(`/employees/${emp.id}`)}>
                                            View
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic p-4 text-center">No employees found in this department.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 mt-0">
                            <Briefcase className="h-5 w-5 text-secondary" />
                            Positions ({department.positions?.length || 0})
                        </CardTitle>
                        <Dialog open={isCreatePositionOpen} onOpenChange={setIsCreatePositionOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8">
                                    <Plus className="h-4 w-4 mr-1.5" /> Create
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Position</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Position Title</p>
                                        <Input
                                            placeholder="e.g. Finance Manager"
                                            value={newPositionTitle}
                                            onChange={(e) => setNewPositionTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Position Code</p>
                                        <Input
                                            placeholder="e.g. FIN-MGR"
                                            value={newPositionCode}
                                            onChange={(e) => setNewPositionCode(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreatePositionOpen(false)} disabled={isCreatingPosition}>Cancel</Button>
                                    <Button onClick={handleCreatePosition} disabled={isCreatingPosition || !newPositionTitle || !newPositionCode}>
                                        {isCreatingPosition && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                        Create Position
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {department.positions && department.positions.length > 0 ? (
                            <div className="space-y-3">
                                {department.positions.map((pos: any) => (
                                    <div key={pos.id} className="flex justify-between items-center p-3 rounded-lg border bg-card/50">
                                        <div>
                                            <p className="font-medium text-sm">{pos.title}</p>
                                            <p className="text-xs text-muted-foreground">{pos.code}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic p-4 text-center">No positions currently defined.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Approval Workflows — full width */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 mt-0">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        Approval Workflows
                    </CardTitle>
                    <Dialog open={isManageWorkflowsOpen} onOpenChange={setIsManageWorkflowsOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8">
                                <Settings2 className="h-4 w-4 mr-1.5" /> Manage
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Configure Approval Workflows</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold text-primary">Bulk Configuration</p>
                                        <p className="text-xs text-muted-foreground">Quickly assign the Department Head to all approval types.</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={handleApplyHeadToAll}
                                        disabled={isSavingWorkflow || !department?.headId}
                                    >
                                        {isSavingWorkflow ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                                        Apply Head to All (L1)
                                    </Button>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {["LEAVE", "OVERTIME", "CLAIM", "BUDGETING", "RECRUITMENT"].map((type) => {
                                        const wf = workflowData.find(w => w.approvalType === type);
                                        return (
                                            <div key={type} className="p-4 rounded-xl border bg-card/50 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className="font-bold">{type}</Badge>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">Active</span>
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] uppercase text-muted-foreground tracking-wider">Level 1 Approver</Label>
                                                        <Select
                                                            defaultValue={wf?.level1ApproverId}
                                                            onValueChange={(val) => handleSaveWorkflow(type, val, wf?.level2ApproverId)}
                                                        >
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select L1" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {department.employees?.map((emp: any) => (
                                                                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] uppercase text-muted-foreground tracking-wider">Level 2 Approver (Optional)</Label>
                                                        <Select
                                                            defaultValue={wf?.level2ApproverId || "none"}
                                                            onValueChange={(val) => handleSaveWorkflow(type, wf?.level1ApproverId, val)}
                                                        >
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="No Level 2" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">None</SelectItem>
                                                                {allEmployees.map((emp: any) => (
                                                                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsManageWorkflowsOpen(false)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {workflowData.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {workflowData.map((wf) => (
                                <div key={wf.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <GitMerge className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{wf.approvalType}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {wf.level1Approver?.fullName} {wf.level2Approver ? `→ ${wf.level2Approver.fullName}` : "(1 Level)"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center border-2 border-dashed rounded-xl space-y-2">
                            <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto opacity-20" />
                            <p className="text-sm text-muted-foreground italic">No approval workflows configured.</p>
                            <Button variant="link" size="sm" onClick={() => setIsManageWorkflowsOpen(true)}>Configure Now</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Row 4: Work Schedule — full width */}
            <DepartmentScheduleCard departmentId={department.id} />

            {/* Row 5: Timesheets — full width */}
            <DepartmentTimesheetCard departmentId={department.id} />
        </div>
    );
}
