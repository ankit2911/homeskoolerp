import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const sessionsService = {
    /**
     * Get all sessions with related data
     */
    async getSessions(limit = 100) {
        return await db.session.findMany({
            include: {
                class: { include: { board: true } },
                subject: true,
                chapter: true,
                teacher: true,
            },
            orderBy: { startTime: 'desc' },
            take: limit
        });
    },

    /**
     * Get recent sessions (created or starting recently)
     * Used for dashboard activity feed
     */
    async getRecentSessions(limit = 10) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        return await db.session.findMany({
            where: {
                startTime: { gte: yesterday }
            },
            include: {
                class: true,
                subject: true
            },
            orderBy: { startTime: 'desc' },
            take: limit
        });
    },

    /**
     * Get sessions for today
     */
    async getTodaySessions() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        return await db.session.findMany({
            where: {
                startTime: { gte: todayStart, lte: todayEnd }
            },
            include: {
                teacher: true,
                class: true,
                subject: true
            }
        });
    },

    /**
     * Get vacant sessions (no teacher) for specific range
     */
    async getVacantSessions(start: Date, end: Date) {
        return await db.session.findMany({
            where: {
                teacherId: null,
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                startTime: { gte: start, lte: end }
            },
            include: {
                class: true,
                subject: true
            }
        });
    },

    /**
     * Get unlogged sessions (past due)
     */
    async getUnloggedSessions(limit = 5) {
        return await db.session.findMany({
            where: {
                status: 'PENDING_LOG',
                endTime: { lt: new Date() }
            },
            include: {
                class: true,
                subject: true,
                teacher: true
            },
            take: limit,
            orderBy: { endTime: 'desc' }
        });
    },

    /**
     * Get sessions within a date range with full details
     */
    async getSessionsByDateRange(start: Date, end: Date, filter?: Prisma.SessionWhereInput) {
        return await db.session.findMany({
            where: {
                startTime: { gte: start, lte: end },
                ...filter
            },
            include: {
                class: true,
                subject: true,
                teacher: {
                    include: { user: true }
                }
            },
            orderBy: { startTime: 'asc' }
        });
    }
};
