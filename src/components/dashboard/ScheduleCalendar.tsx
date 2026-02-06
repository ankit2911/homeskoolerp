'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Users, BookOpen, AlertTriangle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { ScheduleSession } from '@/lib/actions/dashboard';

type Teacher = { id: string; name: string };
type ClassOption = { id: string; name: string };
type Board = { id: string; name: string; classes: ClassOption[] };

type ScheduleCalendarProps = {
    sessions: ScheduleSession[];
    teachers: Teacher[];
    boards: Board[];
    currentDate: Date;
};

function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getWeekDays(startDate: Date) {
    const days = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
    }
    return days;
}

function isSameDay(d1: Date, d2: Date) {
    return d1.toDateString() === d2.toDateString();
}

const CONFLICT_STYLES = {
    NO_TEACHER: {
        border: 'border-red-200',
        bg: 'bg-red-50',
        bar: 'bg-red-500',
        icon: XCircle,
        color: 'text-red-700'
    },
    HOLIDAY: {
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        bar: 'bg-amber-500',
        icon: AlertTriangle,
        color: 'text-amber-700'
    },
    EXAM_DAY: {
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        bar: 'bg-amber-500',
        icon: AlertTriangle,
        color: 'text-amber-700'
    },
    OVERLAP: {
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        bar: 'bg-purple-500',
        icon: AlertTriangle,
        color: 'text-purple-700'
    },
    NONE: {
        border: 'border-gray-100',
        bg: 'bg-white',
        bar: 'bg-emerald-500',
        icon: CheckCircle2,
        color: 'text-emerald-700'
    }
};

export function ScheduleCalendar({ sessions, teachers, boards, currentDate }: ScheduleCalendarProps) {
    const [viewType, setViewType] = useState<'teacher' | 'class'>('teacher');
    const [selectedTeacher, setSelectedTeacher] = useState<string>(teachers[0]?.id || '');
    const [selectedBoard, setSelectedBoard] = useState<string>(boards[0]?.id || '');
    const [selectedClass, setSelectedClass] = useState<string>(boards[0]?.classes[0]?.id || '');
    const [weekOffset, setWeekOffset] = useState(0);

    const weekStart = useMemo(() => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + (weekOffset * 7));
        return date;
    }, [currentDate, weekOffset]);

    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

    const currentBoard = useMemo(() =>
        boards.find(b => b.id === selectedBoard),
        [boards, selectedBoard]
    );

    // Filter sessions based on view type
    const filteredSessions = useMemo(() => {
        if (viewType === 'teacher') {
            return sessions.filter(s => s.teacherId === selectedTeacher);
        } else {
            // For class view, we need to match by class name/section
            const cls = currentBoard?.classes.find(c => c.id === selectedClass);
            if (!cls) return [];
            return sessions.filter(s => {
                const sessionClassName = s.classSection
                    ? `${s.className} ${s.classSection}`
                    : s.className;
                return sessionClassName === cls.name || s.className === cls.name.split(' ')[0];
            });
        }
    }, [sessions, viewType, selectedTeacher, selectedClass, currentBoard]);

    // Group sessions by day
    const sessionsByDay = useMemo(() => {
        const grouped: Record<string, ScheduleSession[]> = {};
        weekDays.forEach(day => {
            grouped[day.toDateString()] = filteredSessions.filter(s =>
                isSameDay(new Date(s.startTime), day)
            ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        });
        return grouped;
    }, [filteredSessions, weekDays]);

    const handleBoardChange = (boardId: string) => {
        setSelectedBoard(boardId);
        const board = boards.find(b => b.id === boardId);
        if (board?.classes[0]) {
            setSelectedClass(board.classes[0].id);
        }
    };

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Schedule Overview
                    </CardTitle>

                    {/* View Toggle & Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* View Type Toggle */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 text-xs font-bold ${viewType === 'teacher' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                                onClick={() => setViewType('teacher')}
                            >
                                <Users className="w-3.5 h-3.5 mr-1" />
                                Teacher
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 text-xs font-bold ${viewType === 'class' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                                onClick={() => setViewType('class')}
                            >
                                <BookOpen className="w-3.5 h-3.5 mr-1" />
                                Class
                            </Button>
                        </div>

                        {/* Teacher/Class Selector */}
                        {viewType === 'teacher' ? (
                            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                    <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={t.id} className="text-xs">
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="flex gap-2">
                                <Select value={selectedBoard} onValueChange={handleBoardChange}>
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                        <SelectValue placeholder="Board" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {boards.map(b => (
                                            <SelectItem key={b.id} value={b.id} className="text-xs">
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue placeholder="Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentBoard?.classes.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="text-xs">
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setWeekOffset(prev => prev - 1)}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                    </Button>
                    <span className="text-sm font-bold text-gray-600">
                        {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setWeekOffset(0)}
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setWeekOffset(prev => prev + 1)}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[350px]">
                    <div className="grid grid-cols-7 gap-px text-xs bg-gray-200 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 min-w-[700px]">
                        {/* Day Headers */}
                        {weekDays.map((day, idx) => {
                            const isToday = isSameDay(day, new Date());
                            const isWeekend = idx >= 5;
                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`p-2 text-center bg-white dark:bg-black/20 ${isToday ? '' : ''} ${isWeekend ? 'bg-gray-50/80 dark:bg-gray-900/40' : ''}`}
                                >
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isToday ? 'text-primary' : 'text-gray-400'}`}>
                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <div className={`text-lg font-black leading-none ${isToday ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Session Cells */}
                        {weekDays.map((day, idx) => {
                            const daySessions = sessionsByDay[day.toDateString()] || [];
                            const isToday = isSameDay(day, new Date());
                            const isWeekend = idx >= 5;

                            return (
                                <div
                                    key={`cell-${day.toISOString()}`}
                                    className={`min-h-[140px] p-2 bg-white dark:bg-gray-950
                                        ${isToday ? 'bg-primary/[0.02]' : ''}
                                        ${isWeekend ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}
                                    `}
                                >
                                    {isToday && (
                                        <div className="h-0.5 w-full bg-primary/20 mb-2 rounded-full" />
                                    )}

                                    {daySessions.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <span className="text-[10px] text-gray-300 font-medium">No sessions</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {daySessions.map(session => {
                                                const conflictStyle = session.hasConflict && session.conflictType
                                                    ? CONFLICT_STYLES[session.conflictType]
                                                    : CONFLICT_STYLES.NONE;
                                                const Icon = conflictStyle.icon;

                                                return (
                                                    <div
                                                        key={session.id}
                                                        className={`relative group flex flex-col gap-0.5 p-2 pl-2.5 rounded shadow-sm border ${conflictStyle.border} bg-white dark:bg-gray-900 transition-all hover:shadow-md cursor-pointer overflow-hidden`}
                                                    >
                                                        {/* Accent Strip */}
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${conflictStyle.bar}`} />

                                                        <div className="flex items-start justify-between gap-1">
                                                            <p className="font-bold text-gray-700 dark:text-gray-300 truncate text-[11px] leading-tight">
                                                                {session.subjectName}
                                                            </p>
                                                            {session.hasConflict && (
                                                                <Icon className={`w-3 h-3 ${conflictStyle.color} shrink-0`} />
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                <span>{formatTime(session.startTime)}</span>
                                                            </div>
                                                        </div>

                                                        {viewType === 'teacher' && (
                                                            <p className="text-[10px] text-gray-400 mt-1 truncate pl-0.5">
                                                                {session.className}{session.classSection ? ` ${session.classSection}` : ''}
                                                            </p>
                                                        )}
                                                        {viewType === 'class' && session.teacherName && (
                                                            <p className="text-[10px] text-gray-400 mt-1 truncate pl-0.5">
                                                                <span className="text-gray-300 mr-1">by</span>{session.teacherName}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 p-3 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-500 bg-gray-50/30 dark:bg-gray-900/20">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span>Assigned</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>No Teacher</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span>Holiday / Exam</span>
                    </div>
                    {/* <div className="ml-auto text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Work week view</span>
                    </div> */}
                </div>
            </CardContent>
        </Card>
    );
}
