'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export type OperatingScheduleData = {
    workingDays: string[];
    schoolStartTime: string;
    schoolEndTime: string;
    defaultPeriodDuration: number;
};

export async function getOperatingSchedule() {
    try {
        const schedule = await db.schoolOperatingSchedule.findFirst();
        if (!schedule) {
            return null;
        }
        return {
            id: schedule.id,
            workingDays: JSON.parse(schedule.workingDays) as string[],
            schoolStartTime: schedule.schoolStartTime,
            schoolEndTime: schedule.schoolEndTime,
            defaultPeriodDuration: schedule.defaultPeriodDuration,
        };
    } catch (error) {
        console.error('Failed to fetch operating schedule:', error);
        return null;
    }
}

export async function upsertOperatingSchedule(data: OperatingScheduleData) {
    const { workingDays, schoolStartTime, schoolEndTime, defaultPeriodDuration } = data;

    // Validation
    if (!workingDays || workingDays.length === 0) {
        return { error: 'At least one working day is required' };
    }
    if (!schoolStartTime || !schoolEndTime) {
        return { error: 'School start and end times are required' };
    }
    if (schoolStartTime >= schoolEndTime) {
        return { error: 'School end time must be after start time' };
    }
    if (!defaultPeriodDuration || defaultPeriodDuration < 1) {
        return { error: 'Period duration must be at least 1 minute' };
    }

    try {
        // Find existing schedule
        const existing = await db.schoolOperatingSchedule.findFirst();

        if (existing) {
            // Update existing
            await db.schoolOperatingSchedule.update({
                where: { id: existing.id },
                data: {
                    workingDays: JSON.stringify(workingDays),
                    schoolStartTime,
                    schoolEndTime,
                    defaultPeriodDuration,
                },
            });
        } else {
            // Create new
            await db.schoolOperatingSchedule.create({
                data: {
                    workingDays: JSON.stringify(workingDays),
                    schoolStartTime,
                    schoolEndTime,
                    defaultPeriodDuration,
                },
            });
        }

        revalidatePath('/admin/configuration');
        return { success: true };
    } catch (error) {
        console.error('Failed to save operating schedule:', error);
        return { error: 'Failed to save operating schedule' };
    }
}
