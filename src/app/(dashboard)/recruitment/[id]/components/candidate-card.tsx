"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationType } from "./pipeline-board";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CandidateDetailDialog } from "./candidate-detail-dialog";

interface CandidateCardProps {
    app: ApplicationType;
    onUpdate?: () => void;
}

export function CandidateCard({ app, onUpdate = () => {} }: CandidateCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: app.id,
        data: {
            type: "Card",
            app,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 ring-2 ring-primary rounded-lg"
            >
                <Card className="h-[90px] bg-secondary/50 border-dashed" />
            </div>
        );
    }

    return (
        <>
            <Card
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={() => setIsDialogOpen(true)}
                className="cursor-pointer hover:border-primary/50 transition-colors bg-background/80 backdrop-blur-sm"
            >
                <CardContent className="p-3">
                    <p className="font-medium text-sm">{app.candidate.firstName} {app.candidate.lastName}</p>
                    
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground gap-1.5 line-clamp-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{app.candidate.email}</span>
                        </div>
                        {app.candidate.phone && (
                            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                <Phone className="h-3 w-3" />
                                {app.candidate.phone}
                            </div>
                        )}
                    </div>

                    {app.candidate.resumeUrl && (
                        <div className="mt-3 flex justify-end">
                            <a 
                                href={app.candidate.resumeUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                Resume <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CandidateDetailDialog 
                app={app} 
                isOpen={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)} 
                onUpdate={onUpdate}
            />
        </>
    );
}
