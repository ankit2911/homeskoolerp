'use client';

import { useState, useMemo, useTransition } from 'react';
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
    ChevronLeft, ChevronRight, Filter, Play, FileText, CheckCircle, XCircle
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startSession, endSession, cancelSession } from '@/lib/actions/session';
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
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Compact Grid View
function SessionGrid({ sessions, onEdit, onAddLog }: { sessions: Session[]; onEdit: (s: Session) => void; onAddLog?: (s: Session) => void }) {
    const [isPending, startTransition] = useTransition();

    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-muted/20 rounded-lg border border-dashed">
                <Calendar className="h-12 w-12 text-muted-foreground/40" />
                <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">No sessions planned yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        Create your first session using the button above.
                    </p>
                </div>
            </div>
        );
    }

    const handleStart = (e: React.MouseEvent, session: Session) => {
        e.stopPropagation();
        startTransition(async () => {
            await startSession(session.id);
        });
    };

    const handleAddLog = (e: React.MouseEvent, session: Session) => {
        e.stopPropagation();
        onAddLog?.(session);
    };

    const handleComplete = (e: React.MouseEvent, session: Session) => {
        e.stopPropagation();
        startTransition(async () => {
            await endSession(session.id);
        });
    };

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
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1 border-t flex justify-end gap-1">
                            {session.status === 'SCHEDULED' && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-green-600" onClick={(e) => handleStart(e, session)} disabled={isPending}>
                                    <Play className="h-3 w-3 mr-1" /> Start
                                </Button>
                            )}
                            {session.status === 'IN_PROGRESS' && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-yellow-600" onClick={(e) => handleComplete(e, session)} disabled={isPending}>
                                    <CheckCircle className="h-3 w-3 mr-1" /> End
                                </Button>
                            )}
                            {session.status === 'PENDING_LOG' && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-orange-600" onClick={(e) => handleAddLog(e, session)}>
                                    <FileText className="h-3 w-3 mr-1" /> Add Log
                                </Button>
                            )}
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
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-muted/20 rounded-lg border border-dashed">
                <List className="h-12 w-12 text-muted-foreground/40" />
                <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">No sessions to display</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        Sessions will appear here once scheduled.
                    </p>
                </div>
            </div>
        );
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
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

    // Get unique times for a day
    const getTimeSlots = (daySessions: Session[]) => {
        const times: Record<string, number> = {};
        daySessions.forEach(s => {
            const time = formatTime(s.startTime);
            times[time] = (times[time] || 0) + 1;
        });
        return Object.entries(times).sort((a, b) => a[0].localeCompare(b[0]));
    };

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(<div key={`e-${i}`} className="h-20 bg-muted/20 rounded" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = date.toDateString();
        const daySessions = sessionsByDate[key] || [];
        const isToday = new Date().toDateString() === key;
        const isSelected = selectedDate === key;
        const timeSlots = getTimeSlots(daySessions);

        days.push(
            <div
                key={day}
                className={`min-h-[100px] p-2 rounded-lg border text-xs cursor-pointer transition-all relative group
                    ${isToday ? 'bg-primary/[0.03] ring-1 ring-primary/30 border-primary/20' : 'bg-card border-border/40 hover:bg-muted/30 hover:border-border/80'}
                    ${isSelected ? 'ring-2 ring-primary shadow-sm z-10' : ''}
                    overflow-hidden`}
                onClick={() => daySessions.length > 0 && setSelectedDate(isSelected ? null : key)}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <span className={`font-bold text-sm ${isToday ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {day}
                    </span>
                    {daySessions.length > 0 && (
                        <Badge variant="secondary" className={`text-[9px] h-4 px-1 ${isToday ? 'bg-primary/10 text-primary' : ''}`}>
                            {daySessions.length}
                        </Badge>
                    )}
                </div>

                {/* Session Chips */}
                <div className="space-y-1">
                    {timeSlots.slice(0, 3).map(([time, count]) => (
                        <div key={time} className={`flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded-md w-full truncate border
                            ${isToday ? 'bg-primary/10 text-primary border-primary/10' : 'bg-muted/30 text-muted-foreground border-transparent group-hover:bg-muted/50'}
                        `}>
                            <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-primary' : 'bg-muted-foreground/50'}`}></div>
                            <span className="font-medium">{time}</span>
                            {count > 1 && <span className="text-[9px] opacity-70 ml-auto pl-1">x{count}</span>}
                        </div>
                    ))}
                    {timeSlots.length > 3 && (
                        <div className="text-[9px] text-muted-foreground pl-1.5 font-medium">+{timeSlots.length - 3} more</div>
                    )}
                </div>
            </div>
        );
    }

    // Get sessions for selected date
    const selectedSessions = selectedDate ? sessionsByDate[selectedDate] || [] : [];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-bold">{currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2>
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

            {/* Selected day sessions list */}
            {selectedDate && selectedSessions.length > 0 && (
                <div className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm">
                            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </h3>
                        <Badge variant="outline" className="text-xs">{selectedSessions.length} session{selectedSessions.length > 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="space-y-2">
                        {selectedSessions.map(s => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:bg-muted/50"
                                onClick={() => onEdit(s)}
                            >
                                <div>
                                    <div className="font-medium text-xs">{s.title}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {formatTime(s.startTime)} • {s.class.name}{s.class.section} • {s.subject.name}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={s.status} />
                                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
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

    // Quick date presets
    const today = new Date().toISOString().split('T')[0];
    const getWeekStart = () => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString().split('T')[0];
    };

    return (
        <div className="space-y-2">
            {/* Quick presets */}
            <div className="flex flex-wrap items-center gap-1">
                <Button
                    variant={filters.date === today ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onChange({ ...filters, date: filters.date === today ? '' : today })}
                >
                    Today
                </Button>
                <Button
                    variant={filters.status === 'PENDING_LOG' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs text-yellow-600"
                    onClick={() => onChange({ ...filters, status: filters.status === 'PENDING_LOG' ? 'all' : 'PENDING_LOG' })}
                >
                    Needs Log
                </Button>
                <Button
                    variant={filters.status === 'SCHEDULED' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs text-blue-600"
                    onClick={() => onChange({ ...filters, status: filters.status === 'SCHEDULED' ? 'all' : 'SCHEDULED' })}
                >
                    Upcoming
                </Button>
                <Button
                    variant={filters.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs text-orange-600"
                    onClick={() => onChange({ ...filters, status: filters.status === 'IN_PROGRESS' ? 'all' : 'IN_PROGRESS' })}
                >
                    Live Now
                </Button>
            </div>

            {/* Detailed filters */}
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
                        <SelectItem value="PENDING_LOG">Pending Log</SelectItem>
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
                        Clear All
                    </Button>
                )}
            </div>
        </div>
    );
}

// Main Component
export function SessionsView({
    sessions,
    classes,
    teachers = [],
    onEdit,
    onAddLog
}: {
    sessions: Session[];
    classes: ClassType[];
    teachers?: TeacherType[];
    onEdit: (session: Session) => void;
    onAddLog?: (session: Session) => void;
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
            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-3">
                <div className="rounded-xl p-3 text-center bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 shadow-sm">
                    <div className="text-2xl font-bold text-slate-700">{stats.total}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">Total</div>
                </div>
                <div className="rounded-xl p-3 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-sm">
                    <div className="text-2xl font-bold text-blue-700">{stats.scheduled}</div>
                    <div className="text-[10px] text-blue-600/70 uppercase tracking-wide">Scheduled</div>
                </div>
                <div className="rounded-xl p-3 text-center bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 shadow-sm">
                    <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                    <div className="text-[10px] text-orange-500/70 uppercase tracking-wide">In Progress</div>
                </div>
                <div className="rounded-xl p-3 text-center bg-gradient-to-br from-emerald-50 to-green-50 border border-green-200/50 shadow-sm">
                    <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                    <div className="text-[10px] text-green-600/70 uppercase tracking-wide">Completed</div>
                </div>
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
            {view === 'grid' && <SessionGrid sessions={filtered} onEdit={onEdit} onAddLog={onAddLog} />}
            {view === 'list' && <SessionList sessions={filtered} onEdit={onEdit} />}
            {view === 'calendar' && <SessionCalendar sessions={filtered} onEdit={onEdit} />}
        </div>
    );
}
