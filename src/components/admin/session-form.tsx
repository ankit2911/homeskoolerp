'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createSession, updateSession } from '@/lib/actions/session';
import { DialogFooter } from '@/components/ui/dialog';
import { User, Clock, BookOpen, FileText, Calendar } from 'lucide-react';
import type { Session, ClassType, TeacherType, AllocationType } from './sessions/types';

type BoardType = {
    id: string;
    name: string;
};

type ResourceType = {
    id: string;
    title: string;
    type: string;
    classId: string;
    subjectId: string;
    topicId: string | null;
};

type SessionFormProps = {
    classes: ClassType[];
    boards: BoardType[];
    teachers?: TeacherType[];
    allocations?: AllocationType[];
    resources?: ResourceType[];
    session?: Session;
    onClose?: () => void;
    operatingSchedule?: any;
};

// Duration options
const DURATION_OPTIONS = [
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '1 hr', minutes: 60 },
    { label: '1.5 hr', minutes: 90 },
    { label: '2 hr', minutes: 120 },
];

// Get academic year in format Y1Y2 (e.g., 2526 for 2025-2026)
function getAcademicYear(): string {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();
    // Academic year starts in April (month 3)
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;
    return `${startYear.toString().slice(-2)}${endYear.toString().slice(-2)}`;
}

// Generate auto-title: YYMMDDHHSS-Board-ClassSection-Subject (AcademicYear)
function generateAutoTitle(
    startTime: string,
    boardName: string,
    className: string,
    section: string | null,
    subjectName: string
): string {
    if (!startTime || !boardName || !className || !subjectName) return '';

    const date = new Date(startTime);
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const hh = date.getHours().toString().padStart(2, '0');
    const ss = date.getMinutes().toString().padStart(2, '0');

    const classSection = section ? `${className}${section}` : className;
    const academicYear = getAcademicYear();

    return `${yy}${mm}${dd}${hh}${ss}-${boardName}-${classSection}-${subjectName} (${academicYear})`;
}

export function SessionForm({
    classes,
    boards = [],
    teachers = [],
    allocations = [],
    resources = [],
    session,
    onClose,
    operatingSchedule
}: SessionFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Default duration from schedule or 60
    const defaultDuration = operatingSchedule?.defaultPeriodDuration || 60;

    // Form state
    const [boardId, setBoardId] = useState<string>(session?.class.board?.name ?
        boards.find(b => b.name === session.class.board.name)?.id || '' : '');
    const [classId, setClassId] = useState<string>(session?.classId || '');
    const [subjectId, setSubjectId] = useState<string>(session?.subjectId || '');
    const [chapterId, setChapterId] = useState<string>(session?.chapterId || '');
    const [topicId, setTopicId] = useState<string>(session?.topicId || '');
    const [teacherId, setTeacherId] = useState<string>(session?.teacherId || 'none');
    const [startTime, setStartTime] = useState<string>(formatDateTimeLocal(session?.startTime));
    const [duration, setDuration] = useState<number>(session ? 60 : defaultDuration); // If editing, keep 60 as placeholder or calc real duration. Ideally we should calc real duration from session.
    // Logic for session duration when editing:
    // If session exists, we should probably calculate duration from start and end time.
    // For now keeping simple default logic or existing.
    // Wait, session objects usually have endTime.
    // Let's refine duration initialization.

    // Calculate initial duration if session exists
    const initialDuration = useMemo(() => {
        if (session) {
            const start = new Date(session.startTime);
            const end = new Date(session.endTime);
            const diffMins = Math.round((end.getTime() - start.getTime()) / 60000);
            return diffMins;
        }
        return defaultDuration;
    }, [session, defaultDuration]);

    useEffect(() => {
        setDuration(initialDuration);
    }, [initialDuration]);

    const [customDuration, setCustomDuration] = useState<string>('');
    const [isCustomDuration, setIsCustomDuration] = useState(false);

    // Check if current duration matches default
    const isDefaultDuration = duration === defaultDuration;

    const [title, setTitle] = useState<string>(session?.title || '');
    const [description, setDescription] = useState<string>(session?.description || '');

    // Derived states
    const filteredClasses = useMemo(() =>
        boardId ? classes.filter(c => c.board.name === boards.find(b => b.id === boardId)?.name) : [],
        [classes, boards, boardId]
    );
    const selectedClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);
    const selectedBoard = useMemo(() => boards.find(b => b.id === boardId), [boards, boardId]);
    const subjects = selectedClass?.subjects || [];
    const selectedSubject = useMemo(() => subjects.find(s => s.id === subjectId), [subjects, subjectId]);
    const chapters = selectedSubject?.chapters || [];
    const selectedChapter = useMemo(() => chapters.find(c => c.id === chapterId), [chapters, chapterId]);
    const topics = selectedChapter?.topics || [];

    // Filter resources by class and subject
    const filteredResources = useMemo(() => {
        if (!classId) return [];
        return resources.filter(r => {
            if (r.classId !== classId) return false;
            if (subjectId && r.subjectId !== subjectId) return false;
            if (topicId && r.topicId && r.topicId !== topicId) return false;
            return true;
        });
    }, [resources, classId, subjectId, topicId]);

    function formatDateTimeLocal(date: Date | string | undefined): string {
        if (!date) {
            // Default to next hour
            const now = new Date();
            now.setHours(now.getHours() + 1, 0, 0, 0);
            return now.toISOString().slice(0, 16);
        }
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
    }

    // Calculate end time from start + duration
    const endTime = useMemo(() => {
        if (!startTime) return '';
        const effectiveDuration = isCustomDuration ? parseInt(customDuration) || 60 : duration;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + effectiveDuration * 60000);
        return end.toISOString().slice(0, 16);
    }, [startTime, duration, isCustomDuration, customDuration]);

    // Auto-generate title when board/class/subject/time changes
    useEffect(() => {
        if (!session && selectedBoard && selectedClass && selectedSubject && startTime) {
            const autoTitle = generateAutoTitle(
                startTime,
                selectedBoard.name,
                selectedClass.name,
                selectedClass.section,
                selectedSubject.name
            );
            setTitle(autoTitle);
        }
    }, [session, selectedBoard, selectedClass, selectedSubject, startTime]);

    // Auto-select teacher based on allocation
    useEffect(() => {
        if (!session && classId && subjectId && allocations.length > 0) {
            const allocation = allocations.find(
                a => a.classId === classId && a.subjectId === subjectId
            );
            if (allocation) {
                setTeacherId(allocation.teacherId);
            }
        }
    }, [classId, subjectId, allocations, session]);

    // Reset cascading fields when board changes
    const handleBoardChange = (val: string) => {
        setBoardId(val);
        setClassId('');
        setSubjectId('');
        setChapterId('');
        setTopicId('');
    };

    const handleClassChange = (val: string) => {
        setClassId(val);
        setSubjectId('');
        setChapterId('');
        setTopicId('');
    };

    const handleSubjectChange = (val: string) => {
        setSubjectId(val);
        setChapterId('');
        setTopicId('');
    };

    const handleChapterChange = (val: string) => {
        setChapterId(val);
        setTopicId('');
    };

    const handleDurationSelect = (minutes: number) => {
        setDuration(minutes);
        setIsCustomDuration(false);
    };

    const handleSubmit = async (formData: FormData) => {
        setError(null);

        // Add computed fields
        formData.set('title', title);
        formData.set('classId', classId);
        formData.set('subjectId', subjectId);
        formData.set('chapterId', chapterId);
        formData.set('topicId', topicId);
        formData.set('teacherId', teacherId === 'none' ? '' : teacherId);
        formData.set('startTime', startTime);
        formData.set('endTime', endTime);
        formData.set('description', description);

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

            <div className="space-y-5 py-4">
                {error && <div className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded border border-red-200">{error}</div>}

                {/* Section: Schedule */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <Calendar className="h-4 w-4" />
                        Schedule
                    </div>
                    <Separator />

                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <Label className="text-xs">Date & Time <span className="text-red-500">*</span></Label>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="h-9"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs">Duration</Label>
                            <div className="flex flex-wrap gap-2">
                                {DURATION_OPTIONS.map(opt => (
                                    <Button
                                        key={opt.minutes}
                                        type="button"
                                        variant={!isCustomDuration && duration === opt.minutes ? "default" : "outline"}
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleDurationSelect(opt.minutes)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                                <Button
                                    type="button"
                                    variant={isCustomDuration ? "default" : "outline"}
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setIsCustomDuration(true)}
                                >
                                    Custom
                                </Button>
                            </div>
                            {isCustomDuration && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={customDuration}
                                        onChange={(e) => setCustomDuration(e.target.value)}
                                        placeholder="Minutes"
                                        className="h-8 w-24"
                                        min={15}
                                        max={480}
                                    />
                                    <span className="text-xs text-muted-foreground">minutes</span>
                                </div>
                            )}

                            {!isDefaultDuration && (
                                <div className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                                    ⚠️ Differs from school default ({defaultDuration} min)
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section: Class & Subject */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <BookOpen className="h-4 w-4" />
                        Class & Subject
                    </div>
                    <Separator />

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Board <span className="text-red-500">*</span></Label>
                            <Select value={boardId} onValueChange={handleBoardChange}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select Board" />
                                </SelectTrigger>
                                <SelectContent>
                                    {boards.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground/70">Choose the curriculum board</p>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs">Class <span className="text-red-500">*</span></Label>
                            <Select value={classId} onValueChange={handleClassChange} disabled={!boardId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder={boardId ? "Select Class" : "Select Board first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredClasses.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}{c.section ? ` (${c.section})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Subject <span className="text-red-500">*</span></Label>
                            <Select value={subjectId} onValueChange={handleSubjectChange} disabled={!classId}>
                                <SelectTrigger className={`h-9 ${!classId ? 'opacity-50' : ''}`}>
                                    <SelectValue placeholder={classId ? "Select Subject" : "Select Class first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {subjectId && <p className="text-[10px] text-muted-foreground/70">Teacher will be auto-assigned if allocated</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs text-muted-foreground">Chapter</Label>
                            <Select value={chapterId} onValueChange={handleChapterChange} disabled={!subjectId || chapters.length === 0}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder={chapters.length === 0 ? "No chapters" : "Optional"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {chapters.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Topic</Label>
                        <Select value={topicId} onValueChange={setTopicId} disabled={!chapterId || topics.length === 0}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={topics.length === 0 ? "No topics" : "Optional"} />
                            </SelectTrigger>
                            <SelectContent>
                                {topics.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Section: Session Details */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <FileText className="h-4 w-4" />
                        Session Details
                    </div>
                    <Separator />

                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <Label className="text-xs">
                                Title <span className="text-red-500">*</span>
                                {!session && title && <span className="text-[10px] text-muted-foreground ml-2">(auto-generated)</span>}
                            </Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Session title will be auto-generated"
                                className="h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of what will be covered..."
                                className="h-16 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Teacher */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <User className="h-4 w-4" />
                        Teacher
                    </div>
                    <Separator />

                    <div className="grid gap-2">
                        <Label className="text-xs">Assign Teacher</Label>
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
                </div>

                {/* Section: Resources (if any) */}
                {filteredResources.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-primary">
                            <FileText className="h-4 w-4" />
                            Linked Resources
                        </div>
                        <Separator />

                        <div className="flex flex-wrap gap-2">
                            {filteredResources.map(r => (
                                <Badge key={r.id} variant="secondary" className="text-xs">
                                    {r.title}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status (edit only) */}
                {session && (
                    <div className="space-y-3">
                        <Separator />
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
