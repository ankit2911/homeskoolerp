import { db } from '@/lib/db';
import { SyllabusClient } from '@/components/admin/syllabus-client';

export default async function SyllabusPage() {
    const subjectsData = await db.subject.findMany({
        include: {
            class: { include: { board: true } },
            chapters: {
                include: { topics: true },
                orderBy: { name: 'asc' }
            }
        },
        orderBy: { classId: 'asc' }
    });

    // Serialize to plain objects to avoid Server Component serialization warnings/errors
    const subjects = JSON.parse(JSON.stringify(subjectsData));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Curriculum Syllabus</h1>
            </div>
            <SyllabusClient subjects={subjects} />
        </div>
    );
}
