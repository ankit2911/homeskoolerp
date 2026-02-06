import { curriculumService } from '@/lib/services/curriculum.service';
import { ResourcesClient } from '@/components/admin/resources-client';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
    const resources = await curriculumService.getResourcesWithRelations();

    // Fetch boards with full hierarchy for topic selection
    const boards = await curriculumService.getBoardsWithHierarchy();

    // Serialize to plain objects
    const resourcesData = JSON.parse(JSON.stringify(resources));
    const boardsData = JSON.parse(JSON.stringify(boards));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Resources</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage study materials linked to curriculum topics</p>
                </div>
            </div>
            <ResourcesClient resources={resourcesData} boards={boardsData} />
        </div>
    );
}
