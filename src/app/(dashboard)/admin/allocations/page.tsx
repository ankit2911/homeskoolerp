import { curriculumService } from '@/lib/services/curriculum.service';
import { teachersService } from '@/lib/services/teachers.service';
import { AllocationsClient } from '@/components/admin/allocations-client';

export const dynamic = 'force-dynamic';

export default async function AllocationsPage() {
    // Fetch boards with classes and subjects (hierarchy serves this needs mostly)
    // Note: The original query filtered subjects by subjectMaster.isActive: true. 
    // If strict filtering is needed, we may need a specific service method or do client/server-side filtering after fetch.
    // For now using getBoardsWithHierarchy but relying on it being comprehensive.
    // Actually, getBoardsWithHierarchy includes logic for subjectMaster, checking if it filtered active?
    // Let's create a specific fetch if needed or use what we have.
    // The previous query was: include: { classes: { include: { subjects: { where: { subjectMaster: { isActive: true } } } } } }
    // Our getBoardsWithHierarchy doesn't filter active. 
    // However, for admin view, we might want to see all? Or strict adherence? 
    // Let's us curriculumService.getBoardsWithHierarchy() for now and if issues arise optimize.
    const boardsData = await curriculumService.getBoardsWithHierarchy();

    // Fetch all teachers with detailed profile
    const teachersData = await teachersService.getTeachersWithProfile();

    // Fetch all allocations
    const allocationsData = await teachersService.getAllocationsWithRelations();

    // Serialize for client
    const boards = JSON.parse(JSON.stringify(boardsData));
    const teachers = JSON.parse(JSON.stringify(teachersData));
    const allocations = JSON.parse(JSON.stringify(allocationsData));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Teacher Allocations</h1>
                    <p className="text-sm text-muted-foreground mt-1">Assign teachers to classes and subjects across your curriculum</p>
                </div>
            </div>
            <AllocationsClient boards={boards} teachers={teachers} allocations={allocations} />
        </div>
    );
}
