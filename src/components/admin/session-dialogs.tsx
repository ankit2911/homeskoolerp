'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from 'lucide-react';
import { SessionForm } from './session-form';
import type { Session, ClassType, TeacherType, AllocationType } from './sessions/types';

type BoardType = { id: string; name: string };
type ResourceType = { id: string; title: string; type: string; classId: string; subjectId: string; topicId: string | null };

type DialogProps = {
    classes: ClassType[];
    boards: BoardType[];
    teachers: TeacherType[];
    allocations: AllocationType[];
    resources: ResourceType[];
    operatingSchedule: any;
};

export function CreateSessionDialog({ classes, boards, teachers, allocations, resources, operatingSchedule }: DialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 font-bold">
                    <Plus className="h-4 w-4" /> Schedule Session
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-heading text-xl">Schedule New Session</DialogTitle>
                    <DialogDescription>
                        Create a new classroom session. Students will be notified.
                    </DialogDescription>
                </DialogHeader>
                <SessionForm
                    classes={classes}
                    boards={boards}
                    teachers={teachers}
                    allocations={allocations}
                    resources={resources}
                    onClose={() => setOpen(false)}
                    operatingSchedule={operatingSchedule}
                />
            </DialogContent>
        </Dialog>
    );
}

export function EditSessionDialog({
    classes,
    boards,
    teachers,
    allocations,
    resources,
    session,
    open,
    onOpenChange,
    operatingSchedule
}: DialogProps & {
    session: Session;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-heading text-xl">Edit Session</DialogTitle>
                    <DialogDescription>
                        Update session details.
                    </DialogDescription>
                </DialogHeader>
                <SessionForm
                    classes={classes}
                    boards={boards}
                    teachers={teachers}
                    allocations={allocations}
                    resources={resources}
                    session={session as any}
                    onClose={() => onOpenChange(false)}
                    operatingSchedule={operatingSchedule}
                />
            </DialogContent>
        </Dialog>
    );
}
