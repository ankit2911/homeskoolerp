import { db } from '@/lib/db';
import { SessionsPageClient } from '@/components/admin/sessions/sessions-page-client';

export default async function SessionsPage() {
    // Fetch sessions with related data
    const sessionsData = await db.session.findMany({
        include: {
            class: { include: { board: true } },
            subject: true,
            chapter: true,
            teacher: true,
        },
        orderBy: { startTime: 'desc' },
        take: 100
    });

    // Fetch classes with hierarchy for forms
    const classesData = await db.class.findMany({
        include: {
            board: true,
            subjects: {
                include: {
                    chapters: {
                        include: { topics: true },
                        orderBy: { name: 'asc' }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    // Fetch teachers
    const teachersData = await db.teacherProfile.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true
        },
        orderBy: { firstName: 'asc' }
    });

    // Serialize for client
    const sessions = JSON.parse(JSON.stringify(sessionsData));
    const classes = JSON.parse(JSON.stringify(classesData));
    const teachers = JSON.parse(JSON.stringify(teachersData));

    return (
        <SessionsPageClient
            sessions={sessions}
            classes={classes}
            teachers={teachers}
        />
    );
}
