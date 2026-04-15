"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INTERVIEW_TYPES = ["Phone Screen", "Technical", "HR Interview", "Cultural Fit", "Final Round"];

interface ScheduleInterviewDialogProps {
    applicationId: string;
    candidateName: string;
    onSuccess?: () => void;
}

export function ScheduleInterviewDialog({ applicationId, candidateName, onSuccess }: ScheduleInterviewDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        interviewerId: "",
        scheduledDate: "",
        durationMinutes: "60",
        type: ""
    });

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/v1/employees?limit=200');
            const { data } = await res.json();
            setEmployees(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/v1/recruitment/interviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId,
                    interviewerId: formData.interviewerId,
                    scheduledDate: new Date(formData.scheduledDate).toISOString(),
                    durationMinutes: Number(formData.durationMinutes),
                    type: formData.type
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to schedule interview");
            }

            toast({ title: "Success", description: "Interview scheduled successfully" });
            setIsOpen(false);
            setFormData({ interviewerId: "", scheduledDate: "", durationMinutes: "60", type: "" });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    <CalendarPlus className="h-4 w-4 mr-1.5" /> Schedule Interview
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Schedule Interview</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Candidate: <span className="font-medium text-foreground">{candidateName}</span></p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Interview Type</Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })} required>
                            <SelectTrigger><SelectValue placeholder="Select interview type" /></SelectTrigger>
                            <SelectContent>
                                {INTERVIEW_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Interviewer</Label>
                        <Select value={formData.interviewerId} onValueChange={(v) => setFormData({ ...formData, interviewerId: v })} required>
                            <SelectTrigger><SelectValue placeholder="Select interviewer" /></SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {employees.map(e => (
                                    <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduledDate">Date & Time</Label>
                            <Input
                                id="scheduledDate"
                                type="datetime-local"
                                required
                                value={formData.scheduledDate}
                                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                            <Select value={formData.durationMinutes} onValueChange={(v) => setFormData({ ...formData, durationMinutes: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["30", "45", "60", "90", "120"].map(d => (
                                        <SelectItem key={d} value={d}>{d} min</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || !formData.interviewerId || !formData.type}>
                            {isLoading ? "Scheduling..." : "Confirm Schedule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
