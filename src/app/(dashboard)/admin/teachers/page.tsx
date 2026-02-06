import { teachersService } from '@/lib/services/teachers.service';
import { curriculumService } from '@/lib/services/curriculum.service';
import { TeacherListClient } from '@/components/admin/teachers/teacher-list-client';
import { EditTeacherForm } from '@/components/admin/edit-teacher-form';

export const dynamic = 'force-dynamic';

export default async function TeachersPage() {
    // Fetch teachers via service
    const teachers = await teachersService.getAllTeachers();

    // Fetch curriculum data via service
    const boards = await curriculumService.getAllBoards();
    const subjects = await curriculumService.getAllSubjectMasters();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
                    <p className="text-sm text-muted-foreground">Manage teacher profiles and assignments</p>
                </div>
            </div>

            <TeacherListClient
                initialTeachers={teachers}
                boards={boards}
                subjects={subjects}
            />

            <EditTeacherForm
                boards={boards}
                subjects={subjects}
            />
        </div>
    );
}
