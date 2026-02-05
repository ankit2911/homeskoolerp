'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { CalendarEntryData, CalendarEntry } from '@/lib/types/calendar';


/**
 * Get all calendar entries, optionally filtered by year
 */
export async function getCalendarEntries(year?: number): Promise<CalendarEntry[]> {
    try {
        const whereClause = year ? {
            date: {
                gte: new Date(year, 0, 1),
                lt: new Date(year + 1, 0, 1),
            }
        } : {};

        const entries = await db.academicCalendarEntry.findMany({
            where: whereClause,
            orderBy: { date: 'asc' },
        });

        return entries;
    } catch (error) {
        console.error('Failed to fetch calendar entries:', error);
        return [];
    }
}

/**
 * Create a new calendar entry
 */
export async function createCalendarEntry(data: CalendarEntryData) {
    const { date, endDate, type, title, description } = data;

    if (!date || !type || !title) {
        return { error: 'Date, type, and title are required' };
    }

    const startDate = new Date(date);
    const end = endDate ? new Date(endDate) : null;

    if (end && end < startDate) {
        return { error: 'End date must be after start date' };
    }

    try {
        await db.academicCalendarEntry.create({
            data: {
                date: startDate,
                endDate: end,
                type,
                title,
                description: description || null,
            },
        });

        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        console.error('Failed to create calendar entry:', error);
        return { error: 'Failed to create calendar entry' };
    }
}

/**
 * Update an existing calendar entry
 */
export async function updateCalendarEntry(id: string, data: CalendarEntryData) {
    const { date, endDate, type, title, description } = data;

    if (!id || !date || !type || !title) {
        return { error: 'ID, date, type, and title are required' };
    }

    const startDate = new Date(date);
    const end = endDate ? new Date(endDate) : null;

    if (end && end < startDate) {
        return { error: 'End date must be after start date' };
    }

    try {
        await db.academicCalendarEntry.update({
            where: { id },
            data: {
                date: startDate,
                endDate: end,
                type,
                title,
                description: description || null,
            },
        });

        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        console.error('Failed to update calendar entry:', error);
        return { error: 'Failed to update calendar entry' };
    }
}

/**
 * Delete a calendar entry
 */
export async function deleteCalendarEntry(id: string) {
    if (!id) {
        return { error: 'ID is required' };
    }

    try {
        await db.academicCalendarEntry.delete({
            where: { id },
        });

        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete calendar entry:', error);
        return { error: 'Failed to delete calendar entry' };
    }
}

/**
 * Check if given dates conflict with any calendar entries
 * Returns entries that overlap with any of the provided dates
 */
export async function checkDateConflicts(dates: string[]): Promise<{
    date: string;
    entry: { type: string; title: string };
}[]> {
    if (!dates.length) return [];

    try {
        // Get all calendar entries
        const entries = await db.academicCalendarEntry.findMany({
            orderBy: { date: 'asc' },
        });

        const conflicts: { date: string; entry: { type: string; title: string } }[] = [];

        for (const dateStr of dates) {
            const checkDate = new Date(dateStr);
            checkDate.setHours(0, 0, 0, 0);

            for (const entry of entries) {
                const entryStart = new Date(entry.date);
                entryStart.setHours(0, 0, 0, 0);

                const entryEnd = entry.endDate
                    ? new Date(entry.endDate)
                    : new Date(entry.date);
                entryEnd.setHours(23, 59, 59, 999);

                if (checkDate >= entryStart && checkDate <= entryEnd) {
                    conflicts.push({
                        date: dateStr,
                        entry: { type: entry.type, title: entry.title },
                    });
                    break; // Only report first conflict per date
                }
            }
        }

        return conflicts;
    } catch (error) {
        console.error('Failed to check date conflicts:', error);
        return [];
    }
}
