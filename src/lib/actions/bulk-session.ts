'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { BulkSessionInput, BulkSessionPreview } from '@/components/admin/sessions/types';

// Get academic year in format Y1Y2 (e.g., 2526 for 2025-2026)
function getAcademicYear(): string {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;
    return `${startYear.toString().slice(-2)}${endYear.toString().slice(-2)}`;
}

// Generate auto-title: YYMMDDHHSS-Board-ClassSection-Subject (AcademicYear)
function generateAutoTitle(
    startTime: Date,
    boardName: string,
    className: string,
    section: string | null,
    subjectName: string
): string {
    const yy = startTime.getFullYear().toString().slice(-2);
    const mm = (startTime.getMonth() + 1).toString().padStart(2, '0');
    const dd = startTime.getDate().toString().padStart(2, '0');
    const hh = startTime.getHours().toString().padStart(2, '0');
    const ss = startTime.getMinutes().toString().padStart(2, '0');

    const classSection = section ? `${className}${section}` : className;
    const academicYear = getAcademicYear();

    return `${yy}${mm}${dd}${hh}${ss}-${boardName}-${classSection}-${subjectName} (${academicYear})`;
}

/**
 * Generates preview data for bulk sessions (client-side can call this for validation)
 */
export async function generateBulkSessionPreview(
    sessions: BulkSessionInput[]
): Promise<{ success: true; previews: BulkSessionPreview[] } | { success: false; error: string }> {
    try {
        // Fetch teachers for name lookup
        const teachers = await db.teacherProfile.findMany({
            select: { id: true, firstName: true, lastName: true }
        });

        const previews: BulkSessionPreview[] = sessions.map((s, idx) => {
            const start = new Date(s.startTime);
            const end = new Date(start.getTime() + s.duration * 60000);

            const title = generateAutoTitle(
                start,
                s.boardName,
                s.className,
                s.classSection,
                s.subjectName
            );

            const teacher = s.teacherId ? teachers.find(t => t.id === s.teacherId) : null;
            const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned';

            return {
                ...s,
                id: `preview-${idx}`,
                title,
                endTime: end.toISOString(),
                teacherName
            };
        });

        return { success: true, previews };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Creates multiple sessions in a single transaction.
 * Rolls back entirely if any session fails.
 */
export async function createBulkSessions(
    sessions: BulkSessionInput[]
): Promise<{ success: true; count: number } | { success: false; error: string }> {
    if (!sessions.length) {
        return { success: false, error: 'No sessions to create' };
    }

    try {
        const createResults = await db.$transaction(
            sessions.map(s => {
                const start = new Date(s.startTime);
                const end = new Date(start.getTime() + s.duration * 60000);

                const title = generateAutoTitle(
                    start,
                    s.boardName,
                    s.className,
                    s.classSection,
                    s.subjectName
                );

                return db.session.create({
                    data: {
                        title,
                        startTime: start,
                        endTime: end,
                        classId: s.classId,
                        subjectId: s.subjectId,
                        chapterId: s.chapterId || null,
                        topicId: s.topicId || null,
                        teacherId: s.teacherId || null,
                        status: 'SCHEDULED'
                    }
                });
            })
        );

        revalidatePath('/admin/sessions');
        return { success: true, count: createResults.length };
    } catch (error: any) {
        console.error('Bulk session creation failed:', error);
        return { success: false, error: error.message || 'Failed to create sessions' };
    }
}

/**
 * Helper to get teacher for a class-subject pair from allocations
 */
export async function getTeacherForAllocation(
    classId: string,
    subjectId: string
): Promise<{ teacherId: string | null; teacherName: string }> {
    const allocation = await db.teacherAllocation.findFirst({
        where: { classId, subjectId },
        include: { teacher: { select: { firstName: true, lastName: true } } }
    });

    if (allocation) {
        return {
            teacherId: allocation.teacherId,
            teacherName: `${allocation.teacher.firstName} ${allocation.teacher.lastName}`
        };
    }

    return { teacherId: null, teacherName: 'Unassigned' };
}
