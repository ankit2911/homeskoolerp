import { sessionsService } from '@/lib/services/sessions.service';
import { curriculumService } from '@/lib/services/curriculum.service';
import { teachersService } from '@/lib/services/teachers.service';
import { studentsService } from '@/lib/services/students.service';
import { SessionsPageClient } from '@/components/admin/sessions/sessions-page-client';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
    // Fetch sessions with related data
    const sessionsData = await sessionsService.getSessions(100);

    // Fetch boards for form
    const boardsData = await curriculumService.getAllBoards();

    // Fetch classes with hierarchy for forms (true = include hierarchy)
    const classesData = await curriculumService.getAllClassesWithRelations();

    // Fetch teachers
    const teachersData = await teachersService.getAllTeachers();

    // Fetch teacher allocations for auto-population
    const allocationsData = await teachersService.getAllAllocations();

    // Fetch students for session logs (grouped by classId)
    const studentsData = await studentsService.getStudentsWithProfiles();

    // Fetch resources for mapping
    const resourcesData = await curriculumService.getAllResources();

    // Fetch operating schedule
    const { getOperatingSchedule } = await import('@/lib/actions/operating-schedule');
    const operatingSchedule = await getOperatingSchedule();

    // Serialize for client
    const sessions = JSON.parse(JSON.stringify(sessionsData));
    const boards = JSON.parse(JSON.stringify(boardsData));
    const classes = JSON.parse(JSON.stringify(classesData));
    const teachers = JSON.parse(JSON.stringify(teachersData));
    const allocations = JSON.parse(JSON.stringify(allocationsData));
    const students = JSON.parse(JSON.stringify(studentsData));
    const resources = JSON.parse(JSON.stringify(resourcesData));
    const schedule = JSON.parse(JSON.stringify(operatingSchedule));

    return (
        <SessionsPageClient
            sessions={sessions}
            boards={boards}
            classes={classes}
            teachers={teachers}
            allocations={allocations}
            students={students}
            resources={resources}
            operatingSchedule={schedule}
        />
    );
}
