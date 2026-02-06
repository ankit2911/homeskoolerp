import { studentsService } from '@/lib/services/students.service';
import { curriculumService } from '@/lib/services/curriculum.service';
import { StudentListClient } from '@/components/admin/students/student-list-client';
import { AddStudentForm } from '@/components/admin/student-form-client';

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
    // Fetch students via service
    const students = await studentsService.getStudentsWithProfiles();

    // Fetch classes via service for filtering and forms
    const classes = await curriculumService.getAllClassesWithRelations();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                    <p className="text-sm text-muted-foreground">Manage student enrollments and profiles</p>
                </div>
                <AddStudentForm classes={classes} />
            </div>

            <StudentListClient
                initialStudents={students}
                classes={classes}
            />
        </div>
    );
}
