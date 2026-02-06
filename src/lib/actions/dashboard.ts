'use server';

import { sessionsService } from '@/lib/services/sessions.service';
import { calendarService } from '@/lib/services/calendar.service';
import { teachersService } from '@/lib/services/teachers.service';
import { curriculumService } from '@/lib/services/curriculum.service';

// Types for dashboard data
export type TodayStats = {
    total: number;
    completed: number;
    upcoming: number;
    inProgress: number;
    atRisk: number;
};

export type OperationalFlag = {
    id: string;
    type: 'VACANT_SESSION' | 'CALENDAR_CONFLICT' | 'UNLOGGED_SESSION';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    entityType: 'session' | 'class' | 'teacher';
    entityId: string;
    time?: Date;
    className?: string;
    subjectName?: string;
};

export type ActivityItem = {
    id: string;
    type: 'SESSION_CREATED' | 'SESSION_UPDATED' | 'SESSION_CANCELLED' | 'CALENDAR_ADDED';
    title: string;
    description: string;
    timestamp: Date;
    entityId?: string;
};

export type ScheduleSession = {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    status: string;
    className: string;
    classSection: string | null;
    subjectName: string;
    teacherName: string | null;
    teacherId: string | null;
    hasConflict: boolean;
    conflictType?: 'HOLIDAY' | 'EXAM_DAY' | 'NO_TEACHER' | 'OVERLAP';
};

/**
 * Get today's session statistics
 */
export async function getTodaySessionStats(): Promise<TodayStats> {
    const now = new Date();

    // Fetch all today's sessions via service
    const sessions = await sessionsService.getTodaySessions();

    // Check for calendar conflicts via service
    const calendarEntries = await calendarService.getTodayEntries();

    const hasCalendarConflict = calendarEntries.some(e =>
        e.type === 'HOLIDAY' || e.type === 'EXAM_DAY'
    );

    // Calculate stats
    const completed = sessions.filter(s => s.status === 'COMPLETED').length;
    const inProgress = sessions.filter(s => s.status === 'IN_PROGRESS').length;
    const upcoming = sessions.filter(s =>
        s.status === 'SCHEDULED' && new Date(s.startTime) > now
    ).length;

    // At risk: no teacher OR calendar conflict
    const atRisk = sessions.filter(s =>
        (s.teacherId === null && s.status !== 'COMPLETED' && s.status !== 'CANCELLED') ||
        (hasCalendarConflict && s.status === 'SCHEDULED')
    ).length;

    return {
        total: sessions.length,
        completed,
        upcoming,
        inProgress,
        atRisk
    };
}

/**
 * Get operational flags - issues needing attention
 */
export async function getOperationalFlags(): Promise<OperationalFlag[]> {
    const flags: OperationalFlag[] = [];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Vacant sessions (no teacher assigned) - Critical
    const vacantSessions = await sessionsService.getVacantSessions(todayStart, todayEnd);

    vacantSessions.forEach(session => {
        flags.push({
            id: `vacant-${session.id}`,
            type: 'VACANT_SESSION',
            severity: 'critical',
            title: 'No Teacher Assigned',
            description: `${session.class.name}${session.class.section ? ` (${session.class.section})` : ''} - ${session.subject.name}`,
            entityType: 'session',
            entityId: session.id,
            time: session.startTime,
            className: session.class.name,
            subjectName: session.subject.name
        });
    });

    // 2. Calendar conflicts - Warning
    const calendarEntries = await calendarService.getTodayEntries();

    // Filter purely for display logic if needed, though service already returns range
    const conflictEntries = calendarEntries.filter(e => ['HOLIDAY', 'EXAM_DAY'].includes(e.type));

    if (conflictEntries.length > 0) {
        // Check if there are scheduled sessions on this calendar day
        const sessions = await sessionsService.getTodaySessions();
        const scheduledOnConflict = sessions.filter(s => s.status === 'SCHEDULED').length;

        if (scheduledOnConflict > 0) {
            conflictEntries.forEach(entry => {
                flags.push({
                    id: `calendar-${entry.id}`,
                    type: 'CALENDAR_CONFLICT',
                    severity: 'warning',
                    title: `Sessions on ${entry.type.replace('_', ' ')}`,
                    description: `${scheduledOnConflict} session(s) scheduled on "${entry.title}"`,
                    entityType: 'session',
                    entityId: entry.id
                });
            });
        }
    }

    // 3. Unlogged sessions (past sessions pending log) - Info
    const unloggedSessions = await sessionsService.getUnloggedSessions(5);

    unloggedSessions.forEach(session => {
        flags.push({
            id: `unlogged-${session.id}`,
            type: 'UNLOGGED_SESSION',
            severity: 'info',
            title: 'Session Pending Log',
            description: `${session.class.name}${session.class.section ? ` (${session.class.section})` : ''} - ${session.subject.name}`,
            entityType: 'session',
            entityId: session.id,
            time: session.endTime,
            className: session.class.name,
            subjectName: session.subject.name
        });
    });

    // Sort by severity: critical > warning > info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Get recent operational activities
 */
export async function getRecentActivities(limit = 10): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];

    // Recent sessions via service
    const recentSessions = await sessionsService.getRecentSessions(limit);

    recentSessions.forEach(session => {
        const isCancelled = session.status === 'CANCELLED';
        const isUpcoming = new Date(session.startTime) > new Date();

        activities.push({
            id: `session-${session.id}`,
            type: isCancelled ? 'SESSION_CANCELLED' : (isUpcoming ? 'SESSION_CREATED' : 'SESSION_UPDATED'),
            title: isCancelled ? 'Session Cancelled' : (isUpcoming ? 'Session Scheduled' : 'Session Completed'),
            description: `${session.title} - ${session.class.name}${session.class.section ? ` (${session.class.section})` : ''}`,
            timestamp: session.startTime,
            entityId: session.id
        });
    });

    // Recent calendar entries via service
    const recentCalendar = await calendarService.getRecentEntries(5);

    recentCalendar.forEach(entry => {
        activities.push({
            id: `calendar-${entry.id}`,
            type: 'CALENDAR_ADDED',
            title: 'Calendar Entry Added',
            description: `${entry.title} (${entry.type.replace('_', ' ')})`,
            timestamp: entry.createdAt,
            entityId: entry.id
        });
    });

    // Sort by timestamp and limit
    return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
}

/**
 * Get schedule data for calendar view
 */
export async function getScheduleData(filters: {
    viewType: 'teacher' | 'class';
    teacherId?: string;
    classId?: string;
    startDate: Date;
    endDate: Date;
}): Promise<ScheduleSession[]> {
    const { viewType, teacherId, classId, startDate, endDate } = filters;

    // Prepare filter for service
    const where: any = {};
    if (viewType === 'teacher' && teacherId) {
        where.teacherId = teacherId;
    } else if (viewType === 'class' && classId) {
        where.classId = classId;
    }

    const sessions = await sessionsService.getSessionsByDateRange(startDate, endDate, where);
    const calendarEntries = await calendarService.getEntriesInRange(startDate, endDate);

    return sessions.map(session => {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);

        // Check for calendar conflict on this session's date
        const calendarConflict = calendarEntries.find(entry => {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            const entryEndDate = entry.endDate ? new Date(entry.endDate) : entryDate;
            entryEndDate.setHours(23, 59, 59, 999);

            return sessionDate >= entryDate && sessionDate <= entryEndDate &&
                (entry.type === 'HOLIDAY' || entry.type === 'EXAM_DAY');
        });

        let hasConflict = false;
        let conflictType: ScheduleSession['conflictType'];

        if (!session.teacherId) {
            hasConflict = true;
            conflictType = 'NO_TEACHER';
        } else if (calendarConflict) {
            hasConflict = true;
            conflictType = calendarConflict.type as 'HOLIDAY' | 'EXAM_DAY';
        }

        return {
            id: session.id,
            title: session.title,
            startTime: session.startTime,
            endTime: session.endTime,
            status: session.status,
            className: session.class.name,
            classSection: session.class.section,
            subjectName: session.subject.name,
            teacherName: session.teacher?.user?.name || null,
            teacherId: session.teacherId,
            hasConflict,
            conflictType
        };
    });
}

/**
 * Get list of teachers for calendar filter
 */
export async function getTeachersForFilter() {
    const teachers = await teachersService.getTeachersForFilter();

    return teachers.map(t => ({
        id: t.id,
        name: t.user.name || 'Unknown'
    }));
}

/**
 * Get list of classes for calendar filter (grouped by board)
 */
export async function getClassesForFilter() {
    const boards = await curriculumService.getBoardsWithClasses();

    return boards.map(board => ({
        id: board.id,
        name: board.name,
        classes: board.classes.map(c => ({
            id: c.id,
            name: c.section ? `${c.name} ${c.section}` : c.name
        }))
    }));
}

