'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createSession, updateSession } from '@/lib/actions/session';
import { DialogFooter } from '@/components/ui/dialog';
import { User, Clock } from 'lucide-react';
import type { Session, ClassType, TeacherType } from './sessions/types';



type SessionFormProps = {
    classes: ClassType[];
    teachers?: TeacherType[];
    session?: Session;
    onClose?: () => void;
};

// Quick duration options
const DURATION_OPTIONS = [
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '60 min', minutes: 60 },
    { label: '90 min', minutes: 90 },
    { label: '2 hrs', minutes: 120 },
];

export function SessionForm({ classes, teachers = [], session, onClose }: SessionFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [classId, setClassId] = useState<string>(session?.classId || '');
    const [subjectId, setSubjectId] = useState<string>(session?.subjectId || '');
    const [chapterId, setChapterId] = useState<string>(session?.chapterId || '');
    const [topicId, setTopicId] = useState<string>(session?.topicId || '');
    const [teacherId, setTeacherId] = useState<string>(session?.teacherId || 'none');
    const [startTime, setStartTime] = useState<string>(formatDateTimeLocal(session?.startTime));
    const [endTime, setEndTime] = useState<string>(formatDateTimeLocal(session?.endTime));
    const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

    // Derived states
    const selectedClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);
    const subjects = selectedClass?.subjects || [];
    const selectedSubject = useMemo(() => subjects.find(s => s.id === subjectId), [subjects, subjectId]);
    const chapters = selectedSubject?.chapters || [];
    const selectedChapter = useMemo(() => chapters.find(c => c.id === chapterId), [chapters, chapterId]);
    const topics = selectedChapter?.topics || [];

    function formatDateTimeLocal(date: Date | string | undefined): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
    }

    // Auto-calculate end time when duration is selected
    const handleDurationClick = (minutes: number) => {
        setSelectedDuration(minutes);
        if (startTime) {
            const start = new Date(startTime);
            const end = new Date(start.getTime() + minutes * 60000);
            setEndTime(end.toISOString().slice(0, 16));
        }
    };

    // Update end time when start time changes and duration is selected
    useEffect(() => {
        if (selectedDuration && startTime) {
            const start = new Date(startTime);
            const end = new Date(start.getTime() + selectedDuration * 60000);
            setEndTime(end.toISOString().slice(0, 16));
        }
    }, [startTime, selectedDuration]);

    const handleSubmit = async (formData: FormData) => {
        setError(null);

        // Handle teacherId - convert 'none' to empty string
        if (formData.get('teacherId') === 'none') {
            formData.set('teacherId', '');
        }

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
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="subjectId" value={subjectId} />
            <input type="hidden" name="chapterId" value={chapterId} />
            <input type="hidden" name="topicId" value={topicId} />
            <input type="hidden" name="teacherId" value={teacherId === 'none' ? '' : teacherId} />
            <input type="hidden" name="startTime" value={startTime} />
            <input type="hidden" name="endTime" value={endTime} />

            <div className="grid gap-4 py-4">
                {error && <div className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded border border-red-200">{error}</div>}

                {/* Title */}
                <div className="grid gap-2">
                    <Label className="text-xs font-bold">Session Title <span className="text-red-500">*</span></Label>
                    <Input
                        name="title"
                        defaultValue={session?.title}
                        placeholder="e.g. Algebra Chapter 1 - Introduction"
                        className="h-9"
                        required
                    />
                </div>

                {/* Description */}
                <div className="grid gap-2">
                    <Label className="text-xs font-bold text-muted-foreground">Description</Label>
                    <Textarea
                        name="description"
                        defaultValue={session?.description || ''}
                        placeholder="Brief description of what will be covered..."
                        className="h-16 text-sm"
                    />
                </div>

                {/* Class & Subject */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold">Class <span className="text-red-500">*</span></Label>
                        <Select
                            value={classId}
                            onValueChange={(val) => {
                                setClassId(val);
                                setSubjectId('');
                                setChapterId('');
                                setTopicId('');
                            }}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}{c.section ? ` (${c.section})` : ''} - {c.board.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-xs font-bold">Subject <span className="text-red-500">*</span></Label>
                        <Select
                            value={subjectId}
                            onValueChange={(val) => {
                                setSubjectId(val);
                                setChapterId('');
                                setTopicId('');
                            }}
                            disabled={!classId}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Chapter & Topic */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold text-muted-foreground">Chapter</Label>
                        <Select
                            value={chapterId}
                            onValueChange={(val) => {
                                setChapterId(val);
                                setTopicId('');
                            }}
                            disabled={!subjectId || chapters.length === 0}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={chapters.length === 0 ? "No chapters" : "Select"} />
                            </SelectTrigger>
                            <SelectContent>
                                {chapters.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold text-muted-foreground">Topic</Label>
                        <Select
                            value={topicId}
                            onValueChange={setTopicId}
                            disabled={!chapterId || topics.length === 0}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={topics.length === 0 ? "No topics" : "Select"} />
                            </SelectTrigger>
                            <SelectContent>
                                {topics.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Teacher */}
                <div className="grid gap-2">
                    <Label className="text-xs font-bold flex items-center gap-1">
                        <User className="h-3 w-3" /> Assign Teacher
                    </Label>
                    <Select value={teacherId} onValueChange={setTeacherId}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select Teacher" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {teachers.map(t => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.firstName} {t.lastName}
                                    {t.specialization && ` (${t.specialization})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date & Time */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Schedule
                    </Label>

                    {/* Quick Duration Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {DURATION_OPTIONS.map(opt => (
                            <Button
                                key={opt.minutes}
                                type="button"
                                variant={selectedDuration === opt.minutes ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleDurationClick(opt.minutes)}
                            >
                                {opt.label}
                            </Button>
                        ))}
                        <Button
                            type="button"
                            variant={selectedDuration === null ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setSelectedDuration(null)}
                        >
                            Custom
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label className="text-[10px] text-muted-foreground">Start Time <span className="text-red-500">*</span></Label>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="h-9"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-[10px] text-muted-foreground">End Time <span className="text-red-500">*</span></Label>
                            <Input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => {
                                    setEndTime(e.target.value);
                                    setSelectedDuration(null);
                                }}
                                className="h-9"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Status (edit only) */}
                {session && (
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold">Status</Label>
                        <Select name="status" defaultValue={session.status}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="PENDING_LOG">Pending Log</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isPending} className="w-full font-bold">
                    {isPending ? 'Saving...' : session ? 'Update Session' : 'Schedule Session'}
                </Button>
            </DialogFooter>
        </form>
    );
}
