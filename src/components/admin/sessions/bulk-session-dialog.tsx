'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    Calendar, Clock, BookOpen, Layers, User, Trash2,
    Plus, Loader2, CheckCircle2, AlertCircle, Repeat, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import {
    createBulkSessions,
    generateBulkSessionPreview,
} from '@/lib/actions/bulk-session';
import type {
    ClassType, TeacherType, AllocationType, Chapter, Topic,
    BulkSessionInput, BulkSessionPreview
} from './types';

type BoardType = { id: string; name: string };

type BulkSessionFormProps = {
    classes: ClassType[];
    boards: BoardType[];
    teachers: TeacherType[];
    allocations: AllocationType[];
    operatingSchedule?: any;
};

const DURATION_OPTIONS = [
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '1 hr', minutes: 60 },
    { label: '1.5 hr', minutes: 90 },
    { label: '2 hr', minutes: 120 },
];

const WEEKDAYS = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

export function BulkSessionDialog({ classes, boards, teachers, allocations, operatingSchedule }: BulkSessionFormProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'config' | 'preview' | 'success'>('config');
    const [isPending, startTransition] = useTransition();

    // Default duration
    const defaultDuration = operatingSchedule?.defaultPeriodDuration || 60;

    // Base config
    const [boardId, setBoardId] = useState('');
    const [classId, setClassId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [chapterId, setChapterId] = useState('');
    const [topicId, setTopicId] = useState('');
    const [duration, setDuration] = useState(defaultDuration);
    const [teacherId, setTeacherId] = useState('');

    // Repeat mode
    const [repeatMode, setRepeatMode] = useState<'date' | 'syllabus'>('date');

    // Date-based repeat
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [sessionCount, setSessionCount] = useState(5);
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
    const [customDays, setCustomDays] = useState<string[]>(['mon', 'wed', 'fri']);

    // Syllabus-based repeat
    const [syllabusMode, setSyllabusMode] = useState<'chapter' | 'topic'>('chapter');
    const [syllabusStartDate, setSyllabusStartDate] = useState('');
    const [syllabusStartTime, setSyllabusStartTime] = useState('09:00');

    // Preview
    const [previews, setPreviews] = useState<BulkSessionPreview[]>([]);
    const [createdCount, setCreatedCount] = useState(0);

    // Derived data
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

    // Auto-assign teacher
    useEffect(() => {
        if (classId && subjectId && allocations.length > 0) {
            const allocation = allocations.find(a => a.classId === classId && a.subjectId === subjectId);
            if (allocation) {
                setTeacherId(allocation.teacherId);
            }
        }
    }, [classId, subjectId, allocations]);

    // Reset cascading
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

    const toggleCustomDay = (day: string) => {
        setCustomDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    // Generate sessions based on config
    const generateSessions = (): BulkSessionInput[] => {
        if (!selectedBoard || !selectedClass || !selectedSubject) return [];

        const baseSession = {
            boardId: selectedBoard.id,
            boardName: selectedBoard.name,
            classId: selectedClass.id,
            className: selectedClass.name,
            classSection: selectedClass.section,
            subjectId: selectedSubject.id,
            subjectName: selectedSubject.name,
            chapterId: (chapterId && chapterId !== 'all') ? chapterId : null,
            topicId: topicId || null,
            teacherId: teacherId || null,
            duration
        };

        if (repeatMode === 'date') {
            return generateDateBasedSessions(baseSession);
        } else {
            return generateSyllabusBasedSessions(baseSession);
        }
    };

    const generateDateBasedSessions = (base: Omit<BulkSessionInput, 'startTime'>): BulkSessionInput[] => {
        if (!startDate || !startTime) return [];

        const sessions: BulkSessionInput[] = [];
        let currentDate = new Date(`${startDate}T${startTime}`);
        const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

        for (let i = 0; i < sessionCount; i++) {
            if (frequency === 'daily') {
                sessions.push({ ...base, startTime: currentDate.toISOString() });
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (frequency === 'weekly') {
                sessions.push({ ...base, startTime: currentDate.toISOString() });
                currentDate.setDate(currentDate.getDate() + 7);
            } else {
                // Custom days - find next valid day
                let found = false;
                while (!found) {
                    const dayKey = Object.keys(dayMap).find(k => dayMap[k] === currentDate.getDay());
                    if (dayKey && customDays.includes(dayKey)) {
                        sessions.push({ ...base, startTime: currentDate.toISOString() });
                        currentDate.setDate(currentDate.getDate() + 1);
                        found = true;
                    } else {
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    // Safety: don't loop forever
                    if (currentDate.getFullYear() > new Date().getFullYear() + 2) break;
                }
            }
        }

        return sessions;
    };

    const generateSyllabusBasedSessions = (base: Omit<BulkSessionInput, 'startTime'>): BulkSessionInput[] => {
        if (!syllabusStartDate || !syllabusStartTime) return [];
        if (!selectedSubject) return [];

        const sessions: BulkSessionInput[] = [];
        let currentDate = new Date(`${syllabusStartDate}T${syllabusStartTime}`);

        if (syllabusMode === 'chapter') {
            chapters.forEach(chapter => {
                sessions.push({
                    ...base,
                    chapterId: chapter.id,
                    topicId: null,
                    startTime: currentDate.toISOString()
                });
                currentDate.setDate(currentDate.getDate() + 1);
            });
        } else {
            // By topic - iterate all chapters and their topics
            chapters.forEach(chapter => {
                chapter.topics.forEach(topic => {
                    sessions.push({
                        ...base,
                        chapterId: chapter.id,
                        topicId: topic.id,
                        startTime: currentDate.toISOString()
                    });
                    currentDate.setDate(currentDate.getDate() + 1);
                });
            });
        }

        return sessions;
    };

    const handleGeneratePreview = () => {
        const sessions = generateSessions();
        if (sessions.length === 0) {
            toast.error('No sessions generated. Check your configuration.');
            return;
        }

        startTransition(async () => {
            const result = await generateBulkSessionPreview(sessions);
            if (result.success) {
                setPreviews(result.previews);
                setStep('preview');
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleRemovePreview = (id: string) => {
        setPreviews(prev => prev.filter(p => p.id !== id));
    };

    const handleUpdateTeacher = (previewId: string, newTeacherId: string) => {
        const teacher = teachers.find(t => t.id === newTeacherId);
        setPreviews(prev => prev.map(p =>
            p.id === previewId
                ? {
                    ...p,
                    teacherId: newTeacherId === 'none' ? null : newTeacherId,
                    teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned'
                }
                : p
        ));
    };

    const handleCreate = () => {
        const sessionsToCreate: BulkSessionInput[] = previews.map(p => ({
            boardId: p.boardId,
            boardName: p.boardName,
            classId: p.classId,
            className: p.className,
            classSection: p.classSection,
            subjectId: p.subjectId,
            subjectName: p.subjectName,
            chapterId: p.chapterId,
            topicId: p.topicId,
            teacherId: p.teacherId,
            startTime: p.startTime,
            duration: p.duration
        }));

        startTransition(async () => {
            const result = await createBulkSessions(sessionsToCreate);
            if (result.success) {
                setCreatedCount(result.count);
                setStep('success');
                toast.success(`Created ${result.count} sessions`);
            } else {
                toast.error(result.error);
            }
        });
    };

    const reset = () => {
        setStep('config');
        setBoardId('');
        setClassId('');
        setSubjectId('');
        setChapterId('');
        setTopicId('');
        setTeacherId('');
        setStartDate('');
        setPreviews([]);
    };

    const isConfigValid = boardId && classId && subjectId && duration > 0 && (
        (repeatMode === 'date' && startDate && startTime && sessionCount > 0) ||
        (repeatMode === 'syllabus' && syllabusStartDate && syllabusStartTime)
    );

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5">
                    <Repeat className="h-4 w-4" /> Bulk Create
                </Button>
            </DialogTrigger>
            <DialogContent className={`${step === 'preview' ? 'max-w-4xl' : 'sm:max-w-[600px]'} max-h-[90vh] flex flex-col`}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Bulk Create Sessions
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'config' && "Configure base settings and repeat pattern to generate multiple sessions."}
                        {step === 'preview' && `Review ${previews.length} sessions before creating.`}
                        {step === 'success' && `Successfully created ${createdCount} sessions.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {step === 'config' && (
                        <div className="space-y-6">
                            {/* Base Configuration */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    Base Configuration
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Board <span className="text-red-500">*</span></Label>
                                        <Select value={boardId} onValueChange={handleBoardChange}>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="Select Board" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {boards.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs">Class <span className="text-red-500">*</span></Label>
                                        <Select value={classId} onValueChange={handleClassChange} disabled={!boardId}>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="Select Class" />
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
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Subject <span className="text-red-500">*</span></Label>
                                        <Select value={subjectId} onValueChange={handleSubjectChange} disabled={!classId}>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="Select Subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjects.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs">Duration <span className="text-red-500">*</span></Label>
                                        <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DURATION_OPTIONS.map(d => (
                                                    <SelectItem key={d.minutes} value={d.minutes.toString()}>{d.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {duration !== defaultDuration && (
                                            <div className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                                                ⚠️ Differs from school default ({defaultDuration} min)
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Chapter (Optional)</Label>
                                        <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId || repeatMode === 'syllabus'}>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="All Chapters" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Chapters</SelectItem>
                                                {chapters.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs">Teacher</Label>
                                        <Select value={teacherId || 'none'} onValueChange={setTeacherId}>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="Auto-assigned" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Unassigned</SelectItem>
                                                {teachers.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.firstName} {t.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Repeat Mode */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <Repeat className="h-4 w-4 text-muted-foreground" />
                                    Repeat Pattern
                                </div>

                                <Tabs value={repeatMode} onValueChange={(v) => setRepeatMode(v as 'date' | 'syllabus')}>
                                    <TabsList className="grid grid-cols-2 w-full">
                                        <TabsTrigger value="date" className="text-xs">
                                            <Calendar className="h-3 w-3 mr-1" /> Date-Based
                                        </TabsTrigger>
                                        <TabsTrigger value="syllabus" className="text-xs">
                                            <BookOpen className="h-3 w-3 mr-1" /> Syllabus-Based
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="date" className="space-y-4 mt-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Start Date</Label>
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Number of Sessions</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={50}
                                                    value={sessionCount}
                                                    onChange={(e) => setSessionCount(parseInt(e.target.value) || 1)}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Frequency</Label>
                                                <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="daily">Daily</SelectItem>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="custom">Custom Days</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {frequency === 'custom' && (
                                            <div className="flex flex-wrap gap-2">
                                                {WEEKDAYS.map(day => (
                                                    <Button
                                                        key={day.key}
                                                        type="button"
                                                        variant={customDays.includes(day.key) ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-8 text-xs"
                                                        onClick={() => toggleCustomDay(day.key)}
                                                    >
                                                        {day.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="syllabus" className="space-y-4 mt-4">
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                                            <AlertCircle className="h-3 w-3 inline mr-1" />
                                            Creates one session per {syllabusMode} in the selected subject, starting from the given date.
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Generate By</Label>
                                                <Select value={syllabusMode} onValueChange={(v) => setSyllabusMode(v as 'chapter' | 'topic')}>
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="chapter">Per Chapter ({chapters.length})</SelectItem>
                                                        <SelectItem value="topic">Per Topic ({chapters.reduce((acc, c) => acc + c.topics.length, 0)})</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Sessions Start Date</Label>
                                                <Input
                                                    type="date"
                                                    value={syllabusStartDate}
                                                    onChange={(e) => setSyllabusStartDate(e.target.value)}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-xs">Daily Start Time</Label>
                                            <Input
                                                type="time"
                                                value={syllabusStartTime}
                                                onChange={(e) => setSyllabusStartTime(e.target.value)}
                                                className="h-9 text-xs w-1/2"
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                    {previews.length} sessions to create
                                </Badge>
                                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setStep('config')}>
                                    ← Back to Config
                                </Button>
                            </div>

                            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0">
                                        <TableRow>
                                            <TableHead className="text-[10px] uppercase font-bold w-[40px]">#</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold">Date & Time</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold">Details</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold">Teacher</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold w-[60px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previews.map((p, idx) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="py-2 text-xs text-muted-foreground">{idx + 1}</TableCell>
                                                <TableCell className="py-2">
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex-1">
                                                            <div className="text-xs font-medium">
                                                                {new Date(p.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                {new Date(p.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {p.duration}min
                                                            </div>
                                                        </div>
                                                        {p.calendarWarning && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" title={`${p.calendarWarning.type}: ${p.calendarWarning.title}`}>
                                                                <AlertTriangle className="h-3 w-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {p.calendarWarning && (
                                                        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                                                            ⚠ {p.calendarWarning.title}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <div className="text-xs font-medium">{p.subjectName}</div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {p.className}{p.classSection ? ` (${p.classSection})` : ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Select
                                                        value={p.teacherId || 'none'}
                                                        onValueChange={(v) => handleUpdateTeacher(p.id, v)}
                                                    >
                                                        <SelectTrigger className="h-7 text-xs w-[140px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Unassigned</SelectItem>
                                                            {teachers.map(t => (
                                                                <SelectItem key={t.id} value={t.id}>
                                                                    {t.firstName} {t.lastName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                                                        onClick={() => handleRemovePreview(p.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-12 gap-5 animate-in fade-in-0 zoom-in-95 duration-300">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-green-800">All Done!</h3>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    {createdCount} {createdCount === 1 ? 'session' : 'sessions'} planned successfully.
                                    <br />
                                    <span className="text-xs">You can edit them anytime from the sessions list.</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    {step === 'config' && (
                        <>
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleGeneratePreview}
                                disabled={!isConfigValid || isPending}
                                className="font-bold"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Generate Preview
                            </Button>
                        </>
                    )}
                    {step === 'preview' && (
                        <>
                            <Button variant="ghost" onClick={() => setStep('config')}>Back</Button>
                            <Button
                                onClick={handleCreate}
                                disabled={previews.length === 0 || isPending}
                                className="font-bold"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create {previews.length} Sessions
                            </Button>
                        </>
                    )}
                    {step === 'success' && (
                        <Button className="w-full" onClick={() => setOpen(false)}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
