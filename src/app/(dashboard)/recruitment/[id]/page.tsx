"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Clock, MapPin, Users, Briefcase, Edit2, Save, X } from "lucide-react";
import { PipelineBoard } from "./components/pipeline-board";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ApplyCandidateDialog } from "../components/apply-candidate-dialog";
import { ScheduleInterviewDialog } from "../components/schedule-interview-dialog";
import { Calendar, Trash2 } from "lucide-react";

const statusColors: Record<string, "default" | "success" | "warning" | "outline" | "destructive"> = {
    OPEN: "success",
    DRAFT: "outline",
    PENDING_APPROVAL: "warning",
    CLOSED: "destructive"
};

export default function RequisitionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [requisition, setRequisition] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchRequisition = async () => {
        try {
            const res = await fetch(`/api/v1/recruitment/requisitions/${params.id}`, { cache: 'no-store' });
            if (!res.ok) throw new Error("Failed to load");
            const { data } = await res.json();
            setRequisition(data);
            setEditForm({ description: data.description, requirements: data.requirements });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ description: "", requirements: "" });

    const handleSaveEdit = async () => {
        try {
            const res = await fetch(`/api/v1/recruitment/requisitions/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (!res.ok) throw new Error("Failed to save");
            toast({ title: "Saved", description: "Job details updated" });
            setIsEditing(false);
            fetchRequisition();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    useEffect(() => {
        fetchRequisition();
    }, [params.id]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading details...</div>;
    }

    if (!requisition) {
        return <div className="p-8 text-center text-destructive">Requisition not found</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in relative pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/recruitment')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{requisition.title}</h1>
                            <Badge variant={statusColors[requisition.status] || "outline"}>{requisition.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> {requisition.department?.name} • {requisition.position?.title}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                        Close Posting
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Users className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Headcount</p>
                            <p className="font-semibold">{requisition.headcount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg text-accent"><MapPin className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="font-semibold">{requisition.location || 'Remote / Unspecified'}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-warning/10 rounded-lg text-warning"><Clock className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Target Date</p>
                            <p className="font-semibold">{requisition.targetDate ? new Date(requisition.targetDate).toLocaleDateString('id-ID') : 'TBD'}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-secondary/20 rounded-lg text-muted-foreground"><Briefcase className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Applications</p>
                            <p className="font-semibold">{requisition.applications?.length || 0}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="pipeline" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                    <TabsTrigger value="candidates">All Candidates</TabsTrigger>
                    <TabsTrigger value="details">Details & Edit</TabsTrigger>
                </TabsList>

                <TabsContent value="pipeline" className="m-0">
                    <PipelineBoard 
                        applications={requisition.applications || []} 
                        requisitionId={requisition.id} 
                        onUpdate={fetchRequisition} 
                    />
                </TabsContent>

                <TabsContent value="candidates" className="m-0 space-y-4 pt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Candidates</CardTitle>
                            <ApplyCandidateDialog requisitionId={requisition.id} onSuccess={fetchRequisition} />
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Candidate</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Applied Date</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Status</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Expectation</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!requisition.applications?.length ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No applications found. Add a candidate above.</td></tr>
                                    ) : requisition.applications?.map((app: any) => (
                                        <tr key={app.id} className="border-b border-border/50">
                                            <td className="px-4 py-3 text-sm font-medium">
                                                <div className="flex flex-col">
                                                    <span>{app.candidate?.firstName} {app.candidate?.lastName}</span>
                                                    <span className="text-xs text-muted-foreground font-normal">{app.candidate?.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(app.appliedDate).toLocaleDateString("id-ID")}</td>
                                            <td className="px-4 py-3"><Badge variant="outline">{app.status}</Badge></td>
                                            <td className="px-4 py-3 text-sm">{app.expectedSalary ? `Rp ${Number(app.expectedSalary).toLocaleString('id-ID')}` : '-'}</td>
                                            <td className="px-4 py-3">
                                                <ScheduleInterviewDialog
                                                    applicationId={app.id}
                                                    candidateName={`${app.candidate?.firstName} ${app.candidate?.lastName}`}
                                                    onSuccess={fetchRequisition}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Interviews List */}
                    {requisition.applications?.some((a: any) => a.interviews?.length > 0) && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Scheduled Interviews</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Candidate</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Type</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Date & Time</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Duration</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requisition.applications?.flatMap((app: any) =>
                                            (app.interviews || []).map((iv: any) => (
                                                <tr key={iv.id} className="border-b border-border/50">
                                                    <td className="px-4 py-3 text-sm font-medium">{app.candidate?.firstName} {app.candidate?.lastName}</td>
                                                    <td className="px-4 py-3 text-sm">{iv.type}</td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(iv.scheduledDate).toLocaleString('id-ID')}</td>
                                                    <td className="px-4 py-3 text-sm">{iv.durationMinutes} min</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {iv.result ? <Badge variant="outline">{iv.result}</Badge> : <span className="text-muted-foreground text-xs">Pending</span>}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="details" className="m-0 pt-4">
                    <div className="flex justify-end mb-4">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditForm({ description: requisition.description, requirements: requisition.requirements }); }}>
                                    <X className="h-4 w-4 mr-1.5" /> Cancel
                                </Button>
                                <Button size="sm" onClick={handleSaveEdit}>
                                    <Save className="h-4 w-4 mr-1.5" /> Save Changes
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit2 className="h-4 w-4 mr-1.5" /> Edit Details
                            </Button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Job Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <Textarea 
                                        rows={8}
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                                        {requisition.description}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Requirements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <Textarea 
                                        rows={8}
                                        value={editForm.requirements}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, requirements: e.target.value }))}
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                                        {requisition.requirements}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
