import { db } from '@/lib/db';
import { SessionsPageClient } from '@/components/admin/sessions/sessions-page-client';

export const dynamic = 'force-dynamic';

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

    // Fetch boards for form
    const boardsData = await db.board.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
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

    // Fetch teacher allocations for auto-population
    const allocationsData = await db.teacherAllocation.findMany({
        select: {
            teacherId: true,
            classId: true,
            subjectId: true
        }
    });

    // Fetch students for session logs (grouped by classId)
    const studentsData = await db.studentProfile.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            classId: true
        },
        where: { status: 'ACTIVE' },
        orderBy: { rollNumber: 'asc' }
    });

    // Fetch resources for mapping
    const resourcesData = await db.resource.findMany({
        select: {
            id: true,
            title: true,
            type: true,
            classId: true,
            subjectId: true,
            topicId: true
        }
    });

    // Serialize for client
    const sessions = JSON.parse(JSON.stringify(sessionsData));
    const boards = JSON.parse(JSON.stringify(boardsData));
    const classes = JSON.parse(JSON.stringify(classesData));
    const teachers = JSON.parse(JSON.stringify(teachersData));
    const allocations = JSON.parse(JSON.stringify(allocationsData));
    const students = JSON.parse(JSON.stringify(studentsData));
    const resources = JSON.parse(JSON.stringify(resourcesData));

    return (
        <SessionsPageClient
            sessions={sessions}
            boards={boards}
            classes={classes}
            teachers={teachers}
            allocations={allocations}
            students={students}
            resources={resources}
        />
    );
}
