import { curriculumService } from '@/lib/services/curriculum.service';
import { CurriculumList } from '@/components/admin/curriculum-list';

export const dynamic = 'force-dynamic';

export default async function CurriculumPage() {
    // Fetch aggregated curriculum hierarchy via service
    const aggregatedBoards = await curriculumService.getCurriculumHierarchy();

    // Serialize to plain objects
    const boards = JSON.parse(JSON.stringify(aggregatedBoards));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Curriculum</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your curriculum structure: Boards, Classes, Subjects, Chapters, and Topics</p>
                </div>
            </div>
            <CurriculumList boards={boards} />
        </div>
    );
}
