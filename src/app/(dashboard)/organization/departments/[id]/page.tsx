"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Users, MapPin, Loader2, Briefcase, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";

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

    const fetchDepartment = async () => {
        try {
            const res = await fetch(`/api/v1/departments/${params.id}`);
            const json = await res.json();
            if (json.data) {
                setDepartment(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch department", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) fetchDepartment();
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
                            <span className="text-sm flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {department.location || "Headquarters"}
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

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 mt-0">
                            <Briefcase className="h-5 w-5 text-accent" />
                            Employees ({department.employees?.length || 0})
                        </CardTitle>
                        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8">
                                    <Plus className="h-4 w-4 mr-1.5" /> Assign
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
                    </CardHeader>
                    <CardContent>
                        {department.employees && department.employees.length > 0 ? (
                            <div className="space-y-3">
                                {department.employees.map((emp: any) => (
                                    <div key={emp.id} className="flex justify-between items-center p-3 rounded-lg border bg-card/50">
                                        <div>
                                            <p className="font-medium text-sm">{emp.fullName}</p>
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
        </div>
    );
}
