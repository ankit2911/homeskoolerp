import { db } from '@/lib/db';
import { CurriculumList } from '@/components/admin/curriculum-list';

export const dynamic = 'force-dynamic';

// Type for the aggregated curriculum structure
type AggregatedTopic = {
    id: string;
    name: string;
    description: string | null;
    chapterId: string;
    _count: { resources: number };
};

type AggregatedChapter = {
    id: string;
    name: string;
    subjectId: string;
    topics: AggregatedTopic[];
};

type AggregatedSubject = {
    id: string;
    name: string;
    classId: string;
    chapters: AggregatedChapter[];
};

type AggregatedClass = {
    id: string;
    name: string;
    section: string | null;
    boardId: string;
    subjects: AggregatedSubject[];
};

type AggregatedBoard = {
    id: string;
    name: string;
    classes: AggregatedClass[];
};

export default async function CurriculumPage() {
    // Fetch curriculum data organized by Board → Class → Subject → Chapter → Topic
    const boardsData = await db.board.findMany({
        include: {
            classes: {
                orderBy: { name: 'asc' },
                include: {
                    subjects: {
                        orderBy: { name: 'asc' },
                        include: {
                            subjectMaster: true,
                            chapters: {
                                orderBy: { name: 'asc' },
                                include: {
                                    topics: {
                                        orderBy: { name: 'asc' },
                                        include: {
                                            _count: { select: { resources: true } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    // Aggregate classes by name (ignoring section) and merge subjects
    const aggregatedBoards: AggregatedBoard[] = boardsData.map(board => {
        // Group classes by name
        const classGroups = new Map<string, typeof boardsData[0]['classes']>();

        for (const cls of board.classes) {
            const existing = classGroups.get(cls.name) || [];
            existing.push(cls);
            classGroups.set(cls.name, existing);
        }

        // Merge subjects for each class group
        const aggregatedClasses: AggregatedClass[] = [];

        for (const [className, classGroup] of classGroups) {
            // Use the first class's id as the representative
            const representativeClass = classGroup[0];

            // Collect all unique subjects by subjectMaster name (or subject name if no master)
            const subjectMap = new Map<string, AggregatedSubject>();

            for (const cls of classGroup) {
                for (const subject of cls.subjects) {
                    const subjectKey = subject.subjectMaster?.name || subject.name;

                    if (!subjectMap.has(subjectKey)) {
                        // First occurrence - add the subject
                        subjectMap.set(subjectKey, {
                            id: subject.id,
                            name: subjectKey,
                            classId: cls.id,
                            chapters: subject.chapters.map(ch => ({
                                id: ch.id,
                                name: ch.name,
                                subjectId: subject.id,
                                topics: ch.topics.map(t => ({
                                    id: t.id,
                                    name: t.name,
                                    description: t.description,
                                    chapterId: ch.id,
                                    _count: t._count
                                }))
                            }))
                        });
                    } else {
                        // Subject already exists - merge chapters if needed
                        const existingSubject = subjectMap.get(subjectKey)!;

                        // For curriculum purposes, we take the chapters from the first occurrence
                        // (since curriculum/chapters should be the same for the same subject)
                        // If you want to merge chapters too, that logic can be added here
                    }
                }
            }

            aggregatedClasses.push({
                id: representativeClass.id,
                name: className,
                section: null, // No section for aggregated view
                boardId: board.id,
                subjects: Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name))
            });
        }

        return {
            id: board.id,
            name: board.name,
            classes: aggregatedClasses.sort((a, b) => {
                // Sort classes numerically if possible (Class 1, Class 2, ... Class 10)
                const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                if (numA !== numB) return numA - numB;
                return a.name.localeCompare(b.name);
            })
        };
    });

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
