import { db } from '@/lib/db';

export const calendarService = {
    /**
     * Get recent calendar entries (activity feed)
     */
    async getRecentEntries(limit = 5) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        return await db.academicCalendarEntry.findMany({
            where: {
                createdAt: { gte: yesterday }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    },

    /**
     * Get calendar entries for a date range (for conflict checks)
     */
    async getEntriesInRange(start: Date, end: Date) {
        return await db.academicCalendarEntry.findMany({
            where: {
                OR: [
                    { date: { gte: start, lte: end } },
                    {
                        AND: [
                            { date: { lte: start } },
                            { endDate: { gte: start } }
                        ]
                    }
                ]
            }
        });
    },

    /**
     * Get entries for today
     */
    async getTodayEntries() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        return this.getEntriesInRange(todayStart, todayEnd);
    },

    /**
     * Get all calendar entries
     */
    async getAllEntries() {
        return await db.academicCalendarEntry.findMany({
            orderBy: { date: 'asc' }
        });
    }
};
