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
import { Calendar, Plus } from 'lucide-react';
import { SessionForm } from './session-form';

// Type definitions matching SessionForm
type Topic = { id: string; name: string };
type Chapter = { id: string; name: string; topics: Topic[] };
type Subject = { id: string; name: string; chapters: Chapter[] };
type ClassType = {
    id: string;
    name: string;
    section: string | null;
    board: { name: string };
    subjects: Subject[]
};
type TeacherType = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    specialization: string | null;
};

type Session = {
    id: string;
    title: string;
    description: string | null;
    startTime: Date | string;
    endTime: Date | string;
    status: string;
    classId: string;
    subjectId: string;
    chapterId: string | null;
    topicId: string | null;
    teacherId?: string | null;
};

export function CreateSessionDialog({ classes, teachers }: { classes: ClassType[]; teachers: TeacherType[] }) {
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
                    teachers={teachers}
                    onClose={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

export function EditSessionDialog({
    classes,
    teachers,
    session,
    open,
    onOpenChange
}: {
    classes: ClassType[];
    teachers: TeacherType[];
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
                    teachers={teachers}
                    session={session as any}
                    onClose={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
