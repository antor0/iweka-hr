"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Building2,
    Users,
    Plus,
    ChevronRight,
    Briefcase,
    GraduationCap,
    Loader2,
    Pencil,
    Trash2
} from "lucide-react";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationsTab } from "./components/locations-tab";
import { WorkModelsTab } from "./components/work-models-tab";
import { PositionGradesTab } from "./components/position-grades-tab";

export default function OrganizationPage() {
    const [data, setData] = useState<{ stats: any, departments: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Add Department State
    const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);
    const [newDeptForm, setNewDeptForm] = useState({ name: "", code: "", description: "", locationId: "" });

    // Edit Department State
    const [editingDept, setEditingDept] = useState<any | null>(null);
    const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/v1/organization/dashboard");
            const json = await res.json();
            if (json.success) setData(json.data);

            // Fetch locations for dropdowns
            const locRes = await fetch("/api/v1/organization/locations");
            const locData = await locRes.json();
            setLocations(Array.isArray(locData) ? locData : []);
        } catch (error) {
            console.error("Failed to load org data", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDashboard();
    }, []);

    const handleAddDepartment = async () => {
        if (!newDeptForm.name || !newDeptForm.code) {
            alert("Name and Code are required");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/v1/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDeptForm)
            });

            const result = await res.json();

            if (!res.ok) {
                alert(`Error: ${result.error || "Failed to create department"}`);
                return;
            }

            setIsAddDeptOpen(false);
            setNewDeptForm({ name: "", code: "", description: "", locationId: "" });
            fetchDashboard(); // Refresh data
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateDepartment = async () => {
        if (!editingDept.name || !editingDept.code) {
            alert("Name and Code are required");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/v1/departments/${editingDept.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingDept.name,
                    code: editingDept.code,
                    isActive: editingDept.isActive,
                    description: editingDept.description,
                    locationId: editingDept.locationId || null,
                })
            });

            const result = await res.json();

            if (!res.ok) {
                alert(`Error: ${result.error || "Failed to update department"}`);
                return;
            }

            setIsEditDeptOpen(false);
            setEditingDept(null);
            fetchDashboard(); // Refresh data
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDepartment = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the department "${name}"? This action cannot be undone.`)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/v1/departments/${id}`, {
                method: "DELETE",
            });

            const result = await res.json();

            if (!res.ok) {
                alert(`Error: ${result.error || "Failed to delete department"}`);
                return;
            }

            fetchDashboard(); // Refresh data
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const orgStats = [
        { title: "Departments", value: data?.stats?.departments || 0, subtitle: "Total departments", icon: <Building2 className="h-5 w-5" />, accent: "primary" as const },
        { title: "Positions", value: data?.stats?.positions || 0, subtitle: "Defined job titles", icon: <Briefcase className="h-5 w-5" />, accent: "accent" as const },
        { title: "Grade Levels", value: data?.stats?.grades || 0, subtitle: "Salary grades", icon: <GraduationCap className="h-5 w-5" />, accent: "success" as const },
        { title: "Total Employees", value: data?.stats?.employees || 0, subtitle: "Currently active", icon: <Users className="h-5 w-5" />, accent: "warning" as const },
    ];

    if (loading) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        Organization Structure
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage departments, positions, and job levels
                    </p>
                </div>

                <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-1.5" /> Add Department
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Department</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Department Name</Label>
                                <Input
                                    id="name"
                                    value={newDeptForm.name}
                                    onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                                    placeholder="e.g. Engineering"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Department Code</Label>
                                <Input
                                    id="code"
                                    value={newDeptForm.code}
                                    onChange={(e) => setNewDeptForm({ ...newDeptForm, code: e.target.value })}
                                    placeholder="e.g. ENG-01"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Description</Label>
                                <Textarea
                                    id="desc"
                                    value={newDeptForm.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDeptForm({ ...newDeptForm, description: e.target.value })}
                                    placeholder="Brief description (optional)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <select
                                    id="location"
                                    value={newDeptForm.locationId || ""}
                                    onChange={(e) => setNewDeptForm({ ...newDeptForm, locationId: e.target.value })}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="">Select Location</option>
                                    {locations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDeptOpen(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button onClick={handleAddDepartment} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Department
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {orgStats.map((stat) => (
                    <GlassStatCard key={stat.title} title={stat.title} value={stat.value} subtitle={stat.subtitle} icon={stat.icon} accentColor={stat.accent} />
                ))}
            </div>

            <Tabs defaultValue="overview" className="w-full mt-6">
                <TabsList className="grid grid-cols-4 w-full max-w-4xl bg-black/20 border border-white/5 mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="locations">Locations</TabsTrigger>
                    <TabsTrigger value="work-models">Work Models</TabsTrigger>
                    <TabsTrigger value="grades">Grade Mapping</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">

                    <Card>
                        <CardHeader>
                            <CardTitle>Departments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data?.departments?.map((dept) => (
                                    <div
                                        key={dept.id}
                                        onClick={() => router.push(`/organization/departments/${dept.id}`)}
                                        className="glass glass-hover rounded-xl p-4 cursor-pointer group transition-all relative overflow-hidden"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${dept.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                                                    {dept.name}
                                                </h3>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingDept(dept);
                                                            setIsEditDeptOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteDepartment(dept.id, dept.name);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Head: <span className="text-foreground font-medium">{dept.head}</span>
                                            </p>
                                            <div className="flex gap-3 text-xs">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span>{dept.employees} people</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Briefcase className="h-3.5 w-3.5" />
                                                    <span>{dept.positions} positions</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!data?.departments || data.departments.length === 0) && (
                                    <p className="text-sm text-muted-foreground p-4">No departments found.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="locations">
                    <LocationsTab />
                </TabsContent>

                <TabsContent value="work-models">
                    <WorkModelsTab />
                </TabsContent>



                <TabsContent value="grades">
                    <PositionGradesTab />
                </TabsContent>
            </Tabs>

            {/* Edit Department Dialog */}
            <Dialog open={isEditDeptOpen} onOpenChange={(open) => {
                setIsEditDeptOpen(open);
                if (!open) setEditingDept(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Department</DialogTitle>
                    </DialogHeader>
                    {editingDept && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Department Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editingDept.name}
                                    onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-code">Department Code</Label>
                                <Input
                                    id="edit-code"
                                    value={editingDept.code}
                                    onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="edit-active"
                                    checked={editingDept.isActive ?? true}
                                    onChange={(e) => setEditingDept({ ...editingDept, isActive: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="edit-active">Is Active</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-desc">Description</Label>
                                <Textarea
                                    id="edit-desc"
                                    value={editingDept.description || ""}
                                    onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                                    placeholder="Brief description (optional)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-location">Location</Label>
                                <select
                                    id="edit-location"
                                    value={editingDept.locationId || ""}
                                    onChange={(e) => setEditingDept({ ...editingDept, locationId: e.target.value })}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="">Select Location</option>
                                    {locations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDeptOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleUpdateDepartment} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
