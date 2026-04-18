"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ApplicationStatus } from "@prisma/client";
import { CandidateCard } from "./candidate-card";
import { ApplicationType } from "./pipeline-board";

interface ColumnProps {
    columnId: ApplicationStatus;
    applications: ApplicationType[];
    onUpdate: () => void;
}

export function Column({ columnId, applications, onUpdate }: ColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: columnId,
        data: {
            type: "Column",
            columnId,
        },
    });

    const statusLabels: Record<string, string> = {
        NEW: "New Applied",
        SCREENING: "Screening",
        INTERVIEW: "Interview",
        OFFER: "Offer Sent",
        HIRED: "Hired",
        REJECTED: "Rejected",
    };

    return (
        <div className="flex flex-col flex-shrink-0 w-72 bg-secondary/20 rounded-xl overflow-hidden glass border border-border/40">
            <div className="p-3 bg-secondary/40 border-b border-border/40 font-medium text-sm flex justify-between items-center">
                <span>{statusLabels[columnId] || columnId}</span>
                <span className="bg-background/50 px-2 rounded-md text-xs">{applications.length}</span>
            </div>
            
            <div 
                ref={setNodeRef}
                className={`flex-1 p-3 overflow-y-auto flex flex-col gap-3 transition-colors ${isOver ? "bg-primary/5" : ""}`}
            >
                <SortableContext
                    items={applications.map(a => a.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {applications.map((app) => (
                        <CandidateCard key={app.id} app={app} onUpdate={onUpdate} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
