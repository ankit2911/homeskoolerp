import { db } from '@/lib/db';

export const curriculumService = {
    /**
     * Get all boards
     */
    async getAllBoards() {
        return await db.board.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
    },

    /**
     * Get all boards with their classes
     */
    async getBoardsWithClasses() {
        return await db.board.findMany({
            include: {
                classes: {
                    select: { id: true, name: true, section: true },
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });
    },

    /**
     * Get all classes with hierarchy (board, subjects)
     */
    async getAllClassesWithRelations() {
        return await db.class.findMany({
            include: {
                board: true,
                subjects: {
                    include: {
                        chapters: {
                            include: { topics: true },
                            orderBy: { name: 'asc' }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    },

    /**
     * Get all classes (basic info)
     */
    async getAllClasses() {
        return await db.class.findMany({
            select: { id: true, name: true, section: true, boardId: true },
            orderBy: { name: 'asc' }
        });
    },

    /**
     * Get all subject masters
     */
    async getAllSubjectMasters() {
        return await db.subjectMaster.findMany({
            orderBy: { name: 'asc' }
        });
    },

    /**
     * Get all resources
     */
    async getAllResources() {
        return await db.resource.findMany({
            select: {
                id: true,
                title: true,
                type: true,
                classId: true,
                subjectId: true,
                topicId: true
            }
        });
    },

    /**
     * Get resources with full relations for resources page
     */
    async getResourcesWithRelations() {
        return await db.resource.findMany({
            include: {
                class: { include: { board: true } },
                subject: true,
                topic: { include: { chapter: true } },
                files: true
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    /**
     * Get boards with full deep hierarchy for configuration and resource selection
     */
    async getBoardsWithHierarchy() {
        return await db.board.findMany({
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
                                            orderBy: { name: 'asc' }
                                        }
                                    }
                                }
                            }
                        },
                        _count: { select: { students: true } }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    },

    /**
     * Get aggregated curriculum hierarchy for Curriculum page
     */
    async getCurriculumHierarchy() {
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
        return boardsData.map(board => {
            // Group classes by name
            const classGroups = new Map<string, typeof boardsData[0]['classes']>();

            for (const cls of board.classes) {
                const existing = classGroups.get(cls.name) || [];
                existing.push(cls);
                classGroups.set(cls.name, existing);
            }

            // Merge subjects for each class group
            const aggregatedClasses: any[] = [];

            for (const [className, classGroup] of classGroups) {
                // Use the first class's id as the representative
                const representativeClass = classGroup[0];

                // Collect all unique subjects by subjectMaster name (or subject name if no master)
                const subjectMap = new Map<string, any>();

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
    }
};
