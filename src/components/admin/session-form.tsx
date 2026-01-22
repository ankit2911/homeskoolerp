'use client';

import { useState, useMemo, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createSession, updateSession } from '@/lib/actions/session';
import { DialogFooter } from '@/components/ui/dialog';
import { type Session } from '@prisma/client';

// Define minimal types needed for the form
type Topic = { id: string; name: string };
type Chapter = { id: string; name: string; topics: Topic[] };
type Subject = { id: string; name: string; chapters: Chapter[] };
type ClassType = {
    id: string;
    name: string;
    board: { name: string };
    subjects: Subject[]
};

type SessionFormProps = {
    classes: ClassType[];
    session?: Session; // If editing
    onClose?: () => void;
};

export function SessionForm({ classes, session, onClose }: SessionFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [classId, setClassId] = useState<string>(session?.classId || '');
    const [subjectId, setSubjectId] = useState<string>(session?.subjectId || '');
    const [chapterId, setChapterId] = useState<string>(session?.chapterId || '');
    const [topicId, setTopicId] = useState<string>(session?.topicId || '');

    // Derived states
    const selectedClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);
    const subjects = selectedClass?.subjects || [];

    const selectedSubject = useMemo(() => subjects.find(s => s.id === subjectId), [subjects, subjectId]);
    const chapters = selectedSubject?.chapters || [];

    const selectedChapter = useMemo(() => chapters.find(c => c.id === chapterId), [chapters, chapterId]);
    const topics = selectedChapter?.topics || [];

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            let result;
            if (session) {
                result = await updateSession(formData);
            } else {
                result = await createSession(formData);
            }

            if (result.error) {
                setError(result.error);
            } else {
                if (onClose) onClose();
            }
        });
    };

    return (
        <form action={handleSubmit}>
            {session && <input type="hidden" name="id" value={session.id} />}
            {/* Hidden inputs for Select values to ensure they are submitted in FormData */}
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="subjectId" value={subjectId} />
            <input type="hidden" name="chapterId" value={chapterId} />
            <input type="hidden" name="topicId" value={topicId} />

            <div className="grid gap-4 py-4">
                {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

                <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input name="title" defaultValue={session?.title} placeholder="e.g. Algebra Chapter 1" required />
                </div>

                <div className="grid gap-2">
                    <Label>Class</Label>
                    <Select
                        value={classId}
                        onValueChange={(val) => {
                            setClassId(val);
                            setSubjectId('');
                            setChapterId('');
                            setTopicId('');
                        }}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name} ({c.board.name})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Select
                        value={subjectId}
                        onValueChange={(val) => {
                            setSubjectId(val);
                            setChapterId('');
                            setTopicId('');
                        }}
                        disabled={!classId}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Chapter (Optional)</Label>
                        <Select
                            value={chapterId}
                            onValueChange={(val) => {
                                setChapterId(val);
                                setTopicId('');
                            }}
                            disabled={!subjectId || chapters.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={chapters.length === 0 && subjectId ? "No chapters found" : "Select Chapter"} />
                            </SelectTrigger>
                            <SelectContent>
                                {chapters.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {subjectId && chapters.length === 0 && (
                            <p className="text-[10px] text-muted-foreground">Tip: Add chapters in Curriculum menu.</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label>Topic (Optional)</Label>
                        <Select
                            value={topicId}
                            onValueChange={setTopicId}
                            disabled={!chapterId || topics.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={topics.length === 0 && chapterId ? "No topics found" : "Select Topic"} />
                            </SelectTrigger>
                            <SelectContent>
                                {topics.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Start Time</Label>
                        <Input
                            name="startTime"
                            type="datetime-local"
                            defaultValue={session?.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : ''}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>End Time</Label>
                        <Input
                            name="endTime"
                            type="datetime-local"
                            defaultValue={session?.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : ''}
                            required
                        />
                    </div>
                </div>

                {session && (
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select name="status" defaultValue={session.status}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isPending}>{session ? 'Update' : 'Schedule'}</Button>
            </DialogFooter>
        </form>
    );
}
