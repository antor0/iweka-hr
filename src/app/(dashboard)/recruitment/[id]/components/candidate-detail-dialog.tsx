"use client";

import { useState, useEffect } from "react";
import { ApplicationType } from "./pipeline-board";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, ExternalLink, Globe, Banknote, Calendar, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CandidateDetailDialogProps {
    app: ApplicationType | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function CandidateDetailDialog({ app, isOpen, onClose, onUpdate }: CandidateDetailDialogProps) {
    const { toast } = useToast();
    const [notes, setNotes] = useState(app?.notes || "");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && app) {
            setNotes(app.notes || "");
        }
    }, [isOpen, app?.id]);

    const handleSaveNotes = async () => {
        if (!app) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/v1/recruitment/applications/${app.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes }),
            });

            if (!res.ok) throw new Error("Failed to save notes");
            
            toast({ title: "Saved", description: "Candidate notes updated successfully." });
            onUpdate();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (!app) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mt-2">
                        <DialogTitle className="text-2xl font-bold">
                            {app.candidate.firstName} {app.candidate.lastName}
                        </DialogTitle>
                        <Badge variant="outline" className="uppercase bg-primary/10 text-primary border-primary/20">
                            {app.status}
                        </Badge>
                    </div>
                    <DialogDescription className="text-muted-foreground pt-1">
                        Applied via {app.candidate.source || "Direct"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm uppercase text-muted-foreground">Contact Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="p-2 bg-secondary/30 rounded-lg"><Mail className="h-4 w-4 text-primary" /></span>
                                <span className="truncate">{app.candidate.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="p-2 bg-secondary/30 rounded-lg"><Phone className="h-4 w-4 text-primary" /></span>
                                <span>{app.candidate.phone || "Not provided"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Application Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm uppercase text-muted-foreground">Details</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="p-2 bg-secondary/30 rounded-lg"><Calendar className="h-4 w-4 text-accent" /></span>
                                <span>{new Date(app.appliedDate).toLocaleDateString("id-ID")}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="p-2 bg-secondary/30 rounded-lg"><Banknote className="h-4 w-4 text-success" /></span>
                                <span>
                                    {app.expectedSalary 
                                        ? `Rp ${Number(app.expectedSalary).toLocaleString("id-ID")}` 
                                        : "Not specified"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* External Links */}
                {(app.candidate.resumeUrl || app.candidate.portfolioUrl) && (
                    <div className="mt-6 flex flex-wrap gap-3 p-4 bg-secondary/20 rounded-xl border border-border/40">
                        {app.candidate.resumeUrl && (
                            <Button variant="outline" size="sm" asChild className="glass-hover">
                                <a href={app.candidate.resumeUrl} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" /> View Resume
                                </a>
                            </Button>
                        )}
                        {app.candidate.portfolioUrl && (
                            <Button variant="outline" size="sm" asChild className="glass-hover">
                                <a href={app.candidate.portfolioUrl} target="_blank" rel="noreferrer">
                                    <Globe className="h-4 w-4 mr-2" /> View Portfolio
                                </a>
                            </Button>
                        )}
                    </div>
                )}

                {/* Interviewer Notes */}
                <div className="mt-6 space-y-3">
                    <h3 className="font-semibold text-sm uppercase text-muted-foreground flex items-center justify-between">
                        <span>Interviewer Notes</span>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs text-primary"
                            onClick={handleSaveNotes}
                            disabled={isSaving}
                        >
                            <Save className="h-3 w-3 mr-1.5" /> Save Notes
                        </Button>
                    </h3>
                    <Textarea 
                        placeholder="Add notes for other interviewers..."
                        className="min-h-[120px] bg-background/50 focus:bg-background transition-colors resize-y"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
