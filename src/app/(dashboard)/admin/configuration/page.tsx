import { curriculumService } from '@/lib/services/curriculum.service';
import { ConfigurationList } from '@/components/admin/configuration-list';
import { OperatingScheduleCard } from '@/components/admin/operating-schedule-card';
import { AcademicCalendarSection } from '@/components/admin/academic-calendar-section';
import { getOperatingSchedule } from '@/lib/actions/operating-schedule';
import { getCalendarEntries } from '@/lib/actions/academic-calendar';

export const dynamic = 'force-dynamic';

export default async function ConfigurationPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const initialAction = typeof params.action === 'string' ? params.action : undefined;

    const [boards, subjectMasters, operatingSchedule, calendarEntries] = await Promise.all([
        curriculumService.getBoardsWithHierarchy(),
        curriculumService.getAllSubjectMasters(),
        getOperatingSchedule(),
        getCalendarEntries()
    ]);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">School Configuration</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Manage school operating schedule, calendar, boards, classes, and subjects.</p>
                </div>
            </div>

            <OperatingScheduleCard initialData={operatingSchedule} />

            <AcademicCalendarSection entries={JSON.parse(JSON.stringify(calendarEntries))} />

            <ConfigurationList
                boards={JSON.parse(JSON.stringify(boards))}
                subjectMasters={JSON.parse(JSON.stringify(subjectMasters))}
                initialAction={initialAction}
            />
        </div>
    );
}
