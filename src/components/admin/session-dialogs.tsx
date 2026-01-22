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
import { Calendar } from 'lucide-react';
import { SessionForm } from './session-form';
import { type Class, type Session } from '@prisma/client';

// Define ClassType to match SessionForm expectation
type Topic = { id: string; name: string };
type Chapter = { id: string; name: string; topics: Topic[] };
type Subject = { id: string; name: string; chapters: Chapter[] };
type ClassType = {
    id: string;
    name: string;
    board: { name: string };
    subjects: Subject[]
};

export function CreateSessionDialog({ classes }: { classes: ClassType[] }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Calendar className="mr-2 h-4 w-4" /> Schedule Session</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule New Session</DialogTitle>
                    <DialogDescription>Create a new classroom session.</DialogDescription>
                </DialogHeader>
                <SessionForm
                    classes={classes}
                    onClose={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

export function EditSessionDialog({ classes, session }: { classes: ClassType[]; session: Session }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">Edit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Session</DialogTitle>
                </DialogHeader>
                <SessionForm
                    classes={classes}
                    session={session}
                    onClose={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
