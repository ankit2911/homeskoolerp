import { db } from '@/lib/db';
import { StudentListClient } from '@/components/admin/students/student-list-client';

import { AddStudentForm } from '@/components/admin/student-form-client';

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
    const studentsData = await db.user.findMany({
        where: { role: 'STUDENT' },
        include: {
            studentProfile: {
                include: {
                    class: { include: { board: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const classesData = await db.class.findMany({
        include: {
            board: true,
            subjects: {
                include: { subjectMaster: true }
            }
        }
    });

    // Serialize for client component
    const students = JSON.parse(JSON.stringify(studentsData));
    const classes = JSON.parse(JSON.stringify(classesData));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                <AddStudentForm classes={classes} />
            </div>
            <StudentListClient initialStudents={students} classes={classes} />
        </div>
    );
}
