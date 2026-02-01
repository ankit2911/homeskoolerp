'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Clock, Calendar, List, Grid3X3, Edit2, User,
    ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Session, ClassType, TeacherType } from './types';

// Types


// Status config
const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
    SCHEDULED: { bg: 'bg-blue-100', color: 'text-blue-700', label: 'Scheduled' },
    IN_PROGRESS: { bg: 'bg-orange-100', color: 'text-orange-700', label: 'In Progress' },
    PENDING_LOG: { bg: 'bg-yellow-100', color: 'text-yellow-700', label: 'Pending Log' },
    COMPLETED: { bg: 'bg-green-100', color: 'text-green-700', label: 'Completed' },
    CANCELLED: { bg: 'bg-red-100', color: 'text-red-700', label: 'Cancelled' }
};

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED;
    return <Badge className={`${config.bg} ${config.color} font-medium text-[10px]`}>{config.label}</Badge>;
}

function formatTime(date: string | Date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Compact Grid View
function SessionGrid({ sessions, onEdit }: { sessions: Session[]; onEdit: (s: Session) => void }) {
    if (sessions.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">No sessions found.</div>;
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sessions.map(session => (
                <Card
                    key={session.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => onEdit(session)}
                >
                    <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm line-clamp-1 flex-1">{session.title}</h3>
                            <StatusBadge status={session.status} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {session.class.name}{session.class.section ? ` (${session.class.section})` : ''} • {session.subject.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(session.startTime)}</span>
                            <Clock className="h-3 w-3 ml-1" />
                            <span>{formatTime(session.startTime)}</span>
                        </div>
                        {session.teacher && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{session.teacher.firstName} {session.teacher.lastName}</span>
                            </div>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1 border-t flex justify-end">
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                                <Edit2 className="h-3 w-3 mr-1" /> Edit
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// List View
function SessionList({ sessions, onEdit }: { sessions: Session[]; onEdit: (s: Session) => void }) {
    if (sessions.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">No sessions found.</div>;
    }

    return (
        <div className="rounded-lg border bg-card divide-y">
            {sessions.map(session => (
                <div
                    key={session.id}
                    className="p-3 flex items-center justify-between hover:bg-muted/30 cursor-pointer"
                    onClick={() => onEdit(session)}
                >
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{session.title}</div>
                        <div className="text-xs text-muted-foreground">
                            {session.class.name}{session.class.section ? ` (${session.class.section})` : ''} • {session.subject.name} • {formatDate(session.startTime)} {formatTime(session.startTime)}
                            {session.teacher && ` • ${session.teacher.firstName}`}
                        </div>
                    </div>
                    <StatusBadge status={session.status} />
                </div>
            ))}
        </div>
    );
}

// Calendar View
function SessionCalendar({ sessions, onEdit }: { sessions: Session[]; onEdit: (s: Session) => void }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const sessionsByDate = useMemo(() => {
        const map: Record<string, Session[]> = {};
        sessions.forEach(s => {
            const key = new Date(s.startTime).toDateString();
            if (!map[key]) map[key] = [];
            map[key].push(s);
        });
        return map;
    }, [sessions]);

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(<div key={`e-${i}`} className="h-16 bg-muted/20 rounded" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = date.toDateString();
        const daySessions = sessionsByDate[key] || [];
        const isToday = new Date().toDateString() === key;

        days.push(
            <div key={day} className={`h-16 p-1 rounded border text-xs ${isToday ? 'border-primary bg-primary/5' : 'border-muted/50'} overflow-hidden`}>
                <div className={`font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day}</div>
                <div className="space-y-0.5">
                    {daySessions.slice(0, 2).map(s => (
                        <div
                            key={s.id}
                            className="text-[9px] px-1 bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20"
                            onClick={() => onEdit(s)}
                        >
                            {formatTime(s.startTime)}
                        </div>
                    ))}
                    {daySessions.length > 2 && <div className="text-[9px] text-muted-foreground">+{daySessions.length - 2}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-[10px] font-bold text-muted-foreground py-1">{d}</div>
                ))}
                {days}
            </div>
        </div>
    );
}

// Filter Bar
function SessionFilters({
    classes,
    teachers,
    filters,
    onChange
}: {
    classes: ClassType[];
    teachers: TeacherType[];
    filters: { status: string; classId: string; subjectId: string; teacherId: string; date: string };
    onChange: (f: typeof filters) => void;
}) {
    const selectedClass = classes.find(c => c.id === filters.classId);
    const subjects = selectedClass?.subjects || [];

    return (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border">
            <Filter className="h-4 w-4 text-muted-foreground" />

            <Input
                type="date"
                className="w-[140px] h-8 text-xs"
                value={filters.date}
                onChange={(e) => onChange({ ...filters, date: e.target.value })}
            />

            <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v })}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
            </Select>

            <Select value={filters.classId} onValueChange={(v) => onChange({ ...filters, classId: v, subjectId: 'all' })}>
                <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                            {c.name}{c.section ? ` (${c.section})` : ''}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {filters.classId !== 'all' && subjects.length > 0 && (
                <Select value={filters.subjectId} onValueChange={(v) => onChange({ ...filters, subjectId: v })}>
                    <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}

            <Select value={filters.teacherId} onValueChange={(v) => onChange({ ...filters, teacherId: v })}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Teacher" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {(filters.status !== 'all' || filters.classId !== 'all' || filters.teacherId !== 'all' || filters.date) && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onChange({ status: 'all', classId: 'all', subjectId: 'all', teacherId: 'all', date: '' })}
                >
                    Clear
                </Button>
            )}
        </div>
    );
}

// Main Component
export function SessionsView({
    sessions,
    classes,
    teachers = [],
    onEdit
}: {
    sessions: Session[];
    classes: ClassType[];
    teachers?: TeacherType[];
    onEdit: (session: Session) => void;
}) {
    const [view, setView] = useState<'grid' | 'list' | 'calendar'>('grid');
    const [filters, setFilters] = useState({ status: 'all', classId: 'all', subjectId: 'all', teacherId: 'all', date: '' });

    const filtered = useMemo(() => {
        return sessions.filter(s => {
            if (filters.status !== 'all' && s.status !== filters.status) return false;
            if (filters.classId !== 'all' && s.class.id !== filters.classId) return false;
            if (filters.subjectId !== 'all' && s.subject.id !== filters.subjectId) return false;
            if (filters.teacherId !== 'all' && s.teacher?.id !== filters.teacherId) return false;
            if (filters.date) {
                const sessionDate = new Date(s.startTime).toISOString().split('T')[0];
                if (sessionDate !== filters.date) return false;
            }
            return true;
        });
    }, [sessions, filters]);

    const stats = useMemo(() => ({
        total: sessions.length,
        scheduled: sessions.filter(s => s.status === 'SCHEDULED').length,
        inProgress: sessions.filter(s => s.status === 'IN_PROGRESS').length,
        completed: sessions.filter(s => s.status === 'COMPLETED').length
    }), [sessions]);

    return (
        <div className="space-y-4">
            {/* Compact Stats */}
            <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg p-2 text-center bg-gray-100"><div className="text-lg font-bold">{stats.total}</div><div className="text-[10px]">Total</div></div>
                <div className="rounded-lg p-2 text-center bg-blue-100 text-blue-700"><div className="text-lg font-bold">{stats.scheduled}</div><div className="text-[10px]">Scheduled</div></div>
                <div className="rounded-lg p-2 text-center bg-orange-100 text-orange-700"><div className="text-lg font-bold">{stats.inProgress}</div><div className="text-[10px]">In Progress</div></div>
                <div className="rounded-lg p-2 text-center bg-green-100 text-green-700"><div className="text-lg font-bold">{stats.completed}</div><div className="text-[10px]">Completed</div></div>
            </div>

            {/* Filters */}
            <SessionFilters classes={classes} teachers={teachers} filters={filters} onChange={setFilters} />

            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'list' | 'calendar')}>
                    <TabsList className="h-8">
                        <TabsTrigger value="grid" className="text-xs h-7"><Grid3X3 className="h-3 w-3 mr-1" /> Grid</TabsTrigger>
                        <TabsTrigger value="list" className="text-xs h-7"><List className="h-3 w-3 mr-1" /> List</TabsTrigger>
                        <TabsTrigger value="calendar" className="text-xs h-7"><Calendar className="h-3 w-3 mr-1" /> Calendar</TabsTrigger>
                    </TabsList>
                </Tabs>
                <span className="text-xs text-muted-foreground">{filtered.length} sessions</span>
            </div>

            {/* Views */}
            {view === 'grid' && <SessionGrid sessions={filtered} onEdit={onEdit} />}
            {view === 'list' && <SessionList sessions={filtered} onEdit={onEdit} />}
            {view === 'calendar' && <SessionCalendar sessions={filtered} onEdit={onEdit} />}
        </div>
    );
}
