'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Users, BookOpen, GraduationCap, CheckCircle2, AlertCircle,
    Plus, X, ChevronDown, Search, Filter, Layers, BarChart3
} from 'lucide-react';
import { createAllocation, deleteAllocation } from '@/lib/actions/allocation';

type Teacher = {
    id: string;
    userId: string;
    user: { id: string; name: string | null; email: string };
    specialization?: string | null;
    classes?: string | null;
    experience?: number | null;
    qualification?: string | null;
};

type Subject = {
    id: string;
    name: string;
    classId: string;
};

type Class = {
    id: string;
    name: string;
    section: string | null;
    boardId: string;
    subjects: Subject[];
};

type Board = {
    id: string;
    name: string;
    classes: Class[];
};

type Allocation = {
    id: string;
    teacherId: string;
    classId: string;
    subjectId: string;
    teacher: Teacher;
};

type AllocationsClientProps = {
    boards: Board[];
    teachers: Teacher[];
    allocations: Allocation[];
};

export function AllocationsClient({ boards, teachers, allocations }: AllocationsClientProps) {
    const [selectedBoard, setSelectedBoard] = useState(boards[0]?.id || '');

    // Get current board data
    const currentBoard = useMemo(() => {
        return boards.find(b => b.id === selectedBoard);
    }, [boards, selectedBoard]);

    // List classes individually (with sections)
    const aggregatedClasses = useMemo(() => {
        if (!currentBoard) return [];

        return currentBoard.classes.map(cls => ({
            name: cls.section ? `${cls.name} ${cls.section}` : cls.name,
            classes: [cls], // Wrap in array to maintain TeacherCell compatibility
            subjects: cls.subjects.sort((a, b) => a.name.localeCompare(b.name))
        })).sort((a, b) => {
            // Sort by class name number then section
            const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
            if (numA !== numB) return numA - numB;
            return a.name.localeCompare(b.name);
        });
    }, [currentBoard]);

    // Get unique subjects for columns
    const allSubjects = useMemo(() => {
        const subjectMap = new Map<string, Subject>();
        aggregatedClasses.forEach(cls => {
            cls.subjects.forEach(s => {
                if (!subjectMap.has(s.name)) {
                    subjectMap.set(s.name, s);
                }
            });
        });
        return Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [aggregatedClasses]);

    // Get allocations for a specific class-subject combination
    const getAllocationsForCell = (className: string, subjectName: string) => {
        const relevantClasses = aggregatedClasses.find(c => c.name === className)?.classes || [];
        const classIds = relevantClasses.map(c => c.id);

        return allocations.filter(a => {
            if (!classIds.includes(a.classId)) return false;
            // Find the subject in this class
            const cls = relevantClasses.find(c => c.id === a.classId);
            const subject = cls?.subjects.find(s => s.id === a.subjectId);
            return subject?.name === subjectName;
        });
    };

    // Check if a subject exists for a class
    const hasSubject = (className: string, subjectName: string) => {
        const cls = aggregatedClasses.find(c => c.name === className);
        return cls?.subjects.some(s => s.name === subjectName) || false;
    };

    // Stats
    const stats = useMemo(() => {
        const totalCells = aggregatedClasses.reduce((sum, cls) => sum + cls.subjects.length, 0);
        const allocatedCells = new Set<string>();

        allocations.forEach(a => {
            const cls = aggregatedClasses.find(c => c.classes.some(cc => cc.id === a.classId));
            if (cls) {
                const subject = cls.classes.flatMap(cc => cc.subjects).find(s => s.id === a.subjectId);
                if (subject) {
                    allocatedCells.add(`${cls.name}-${subject.name}`);
                }
            }
        });

        return {
            totalTeachers: teachers.length,
            totalAllocations: allocations.filter(a =>
                boards.find(b => b.id === selectedBoard)?.classes.some(c => c.id === a.classId)
            ).length,
            coverage: totalCells > 0 ? Math.round((allocatedCells.size / totalCells) * 100) : 0,
            unallocated: totalCells - allocatedCells.size
        };
    }, [allocations, aggregatedClasses, teachers, boards, selectedBoard]);

    return (
        <div className="space-y-6">
            {/* Header Stats & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 w-full md:w-auto">
                    <Card className="border shadow-none bg-blue-50/50 dark:bg-blue-900/10">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                                <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{stats.totalTeachers}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70">Teachers</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-none bg-emerald-50/50 dark:bg-emerald-900/10">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-lg shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{stats.totalAllocations}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">Allocations</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-none bg-purple-50/50 dark:bg-purple-900/10">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
                                <GraduationCap className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{stats.coverage}%</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600/70">Coverage</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-none bg-amber-50/50 dark:bg-amber-900/10">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                                <AlertCircle className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.unallocated}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70">Pending</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex items-center gap-2">
                    {/* Bulk Assign moved to tabs row */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Main Matrix Area */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Board Tabs */}
                    {/* Board Tabs & Actions */}
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
                        <div className="flex flex-wrap gap-2">
                            {boards.map(board => (
                                <button
                                    key={board.id}
                                    onClick={() => setSelectedBoard(board.id)}
                                    className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-all ${selectedBoard === board.id
                                        ? 'bg-white text-primary shadow-sm border border-b-0'
                                        : 'bg-gray-100/50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-transparent'
                                        }`}
                                >
                                    {board.name}
                                </button>
                            ))}
                        </div>
                        <BulkAllocationDialog boards={boards} teachers={teachers} />
                    </div>

                    {/* Matrix */}
                    {aggregatedClasses.length === 0 ? (
                        <Card className="border-dashed shadow-sm">
                            <CardContent className="p-10 text-center">
                                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No active subjects configured.</p>
                                <p className="text-sm text-gray-400 mt-1">Configure subjects and classes to start allocation.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="bg-white dark:bg-gray-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
                                            <th className="py-3 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 min-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                Class
                                            </th>
                                            {allSubjects.map(subject => (
                                                <th key={subject.id} className="py-3 px-3 text-center font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider min-w-[140px] border-l border-dashed border-gray-200">
                                                    {subject.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {aggregatedClasses.map((cls, idx) => (
                                            <tr key={cls.name} className={`group hover:bg-gray-50/50 transition-colors`}>
                                                <td className="py-3 px-4 font-bold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50">
                                                    {cls.name}
                                                </td>
                                                {allSubjects.map(subject => {
                                                    const subjectExists = hasSubject(cls.name, subject.name);
                                                    const cellAllocations = subjectExists ? getAllocationsForCell(cls.name, subject.name) : [];

                                                    if (!subjectExists) {
                                                        return (
                                                            <td key={subject.id} className="py-2 px-3 text-center border-l border-dashed border-gray-100 bg-gray-50/30">
                                                                <div className="flex justify-center">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-gray-200/50" />
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    return (
                                                        <td key={subject.id} className="py-2 px-3 border-l border-dashed border-gray-100">
                                                            <TeacherCell
                                                                className={cls.name}
                                                                subjectName={subject.name}
                                                                classes={cls.classes}
                                                                teachers={teachers}
                                                                currentAllocations={cellAllocations}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2 pl-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></div>
                            <span>Assigned</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-amber-50 border border-amber-200"></div>
                            <span>Needs Assignment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                            <span>Not Applicable</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Analytics */}
                <div className="lg:col-span-1 sticky top-6 mt-[60px]">
                    <TeacherWorkload teachers={teachers} allocations={allocations} />
                </div>
            </div>
        </div>
    );
}

function TeacherCell({
    className,
    subjectName,
    classes,
    teachers,
    currentAllocations
}: {
    className: string;
    subjectName: string;
    classes: Class[];
    teachers: Teacher[];
    currentAllocations: Allocation[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>(
        currentAllocations.map(a => a.teacherId)
    );
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter and sort teachers
    const filteredTeachers = useMemo(() => {
        let result = teachers;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.user.name?.toLowerCase().includes(query) ||
                t.user.email.toLowerCase().includes(query) ||
                t.specialization?.toLowerCase().includes(query)
            );
        }

        // Sort: Recommended first (matching subject), then alphabetical
        return result.sort((a, b) => {
            const aMatch = a.specialization?.toLowerCase().includes(subjectName.toLowerCase());
            const bMatch = b.specialization?.toLowerCase().includes(subjectName.toLowerCase());
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return (a.user.name || '').localeCompare(b.user.name || '');
        });
    }, [teachers, searchQuery, subjectName]);

    // Find the first class-subject pair for new allocations
    const getSubjectInfo = () => {
        for (const cls of classes) {
            const subject = cls.subjects.find(s => s.name === subjectName);
            if (subject) {
                return { classId: cls.id, subjectId: subject.id };
            }
        }
        return null;
    };

    const handleTeacherToggle = (teacherId: string) => {
        setSelectedTeachers(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // Apply changes to ALL sections (classes) in this group
            for (const cls of classes) {
                const subject = cls.subjects.find(s => s.name === subjectName);
                if (!subject) continue;

                // specific allocations for this section
                const sectionAllocations = currentAllocations.filter(a => a.classId === cls.id);
                const sectionTeacherIds = sectionAllocations.map(a => a.teacherId);

                // Determine adds and removes for this section
                const toAdd = selectedTeachers.filter(id => !sectionTeacherIds.includes(id));
                const toRemove = sectionAllocations.filter(a => !selectedTeachers.includes(a.teacherId));

                // Remove allocations
                for (const alloc of toRemove) {
                    await deleteAllocation(alloc.id);
                }

                // Add new allocations
                for (const teacherId of toAdd) {
                    const formData = new FormData();
                    formData.set('teacherId', teacherId);
                    formData.set('classId', cls.id);
                    formData.set('subjectId', subject.id);
                    await createAllocation(formData);
                }
            }
        } finally {
            setIsSaving(false);
            setIsOpen(false);
        }
    };

    const hasTeachers = currentAllocations.length > 0;

    // Deduplicate teachers for display (in case of multiple sections)
    const uniqueAllocations = currentAllocations.reduce((acc, current) => {
        const x = acc.find(item => item.teacherId === current.teacherId);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, [] as Allocation[]);

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setSearchQuery('');
        }}>
            <PopoverTrigger asChild>
                <button
                    className={`w-full min-h-[42px] px-2 py-1.5 rounded-lg border text-left transition-all hover:shadow-md ${hasTeachers
                        ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                        : 'bg-amber-50 border-amber-200 hover:border-amber-400'
                        }`}
                >
                    {hasTeachers ? (
                        <div className="flex flex-wrap gap-1">
                            {uniqueAllocations.slice(0, 2).map(a => (
                                <Badge key={a.id} variant="outline" className="bg-emerald-100/50 text-emerald-700 border-emerald-200 text-[10px] font-medium h-5 px-1.5">
                                    {a.teacher.user.name?.split(' ')[0]}
                                </Badge>
                            ))}
                            {uniqueAllocations.length > 2 && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-[10px] h-5 px-1.5">
                                    +{uniqueAllocations.length - 2}
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1.5 text-amber-600/70">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">Assign</span>
                        </div>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 shadow-xl" align="start">
                <div className="p-3 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-primary" />
                            {subjectName}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">{className}</Badge>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search teachers..."
                            className="h-8 pl-8 text-xs bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto p-1">
                    {filteredTeachers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                            <Users className="h-8 w-8 text-gray-200 mb-2" />
                            <p className="text-xs">No teachers found</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredTeachers.map(teacher => {
                                const isRecommended = teacher.specialization?.toLowerCase().includes(subjectName.toLowerCase());
                                return (
                                    <label
                                        key={teacher.id}
                                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedTeachers.includes(teacher.id)
                                            ? 'bg-primary/5 border border-primary/10'
                                            : 'hover:bg-gray-100 border border-transparent'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={selectedTeachers.includes(teacher.id)}
                                            onCheckedChange={() => handleTeacherToggle(teacher.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-gray-700 truncate">{teacher.user.name}</p>
                                                {isRecommended && (
                                                    <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-green-50 text-green-700 border-green-100">Recommended</Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {teacher.specialization || 'General'}
                                                </span>
                                                {teacher.classes && (
                                                    <span className="text-[10px] text-gray-400 border px-1.5 py-0.5 rounded">
                                                        {teacher.classes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="p-2 border-t bg-gray-50 flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 h-8" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" className="flex-1 h-8 font-bold" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function TeacherWorkload({ teachers, allocations }: { teachers: Teacher[], allocations: Allocation[] }) {
    const workload = useMemo(() => {
        return teachers.map(t => {
            const teacherAllocations = allocations.filter(a => a.teacherId === t.id);
            // Count unique classes (not just subjects)
            const uniqueClasses = new Set(teacherAllocations.map(a => a.classId)).size;
            return {
                ...t,
                allocationCount: teacherAllocations.length,
                classCount: uniqueClasses
            };
        }).sort((a, b) => b.allocationCount - a.allocationCount);
    }, [teachers, allocations]);

    return (
        <Card className="h-full border shadow-sm flex flex-col">
            <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-gray-500" />
                        Teacher Workload
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {allocations.length} Assignments
                    </Badge>
                </div>
                <CardDescription>Allocations per teacher</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
                <div className="space-y-4">
                    {workload.map(teacher => (
                        <div key={teacher.id} className="flex items-center justify-between text-sm group px-2 py-1 rounded hover:bg-gray-50">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                    {teacher.user.name?.charAt(0) || 'T'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-medium truncate">{teacher.user.name}</span>
                                    <span className="text-[10px] text-muted-foreground truncate">{teacher.specialization || 'General'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 text-right">
                                <div>
                                    <div className="font-bold text-gray-900">{teacher.allocationCount}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Subj</div>
                                </div>
                                <div className="w-px h-6 bg-gray-100"></div>
                                <div>
                                    <div className="font-bold text-gray-900">{teacher.classCount}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Class</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function BulkAllocationDialog({
    boards,
    teachers
}: {
    boards: Board[];
    teachers: Teacher[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [selectedBoard, setSelectedBoard] = useState<string>('');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [teacherSearch, setTeacherSearch] = useState('');

    // Reset state on open
    React.useEffect(() => {
        if (isOpen) {
            setSelectedSubject('');
            setSelectedTeacher('');
            setSelectedBoard('');
            setSelectedClasses([]);
            setTeacherSearch('');
        }
    }, [isOpen]);

    // Derived data
    const allSubjects = useMemo(() => {
        const subjects = new Set<string>();
        boards.forEach(b => b.classes.forEach(c => c.subjects.forEach(s => subjects.add(s.name))));
        return Array.from(subjects).sort();
    }, [boards]);

    // Get boards that have classes with the selected subject
    const availableBoards = useMemo(() => {
        if (!selectedSubject) return [];
        return boards.filter(b =>
            b.classes.some(c => c.subjects.some(s => s.name === selectedSubject))
        );
    }, [boards, selectedSubject]);

    // Filter classes by selected board AND subject
    const filteredClasses = useMemo(() => {
        if (!selectedSubject || !selectedBoard) return [];
        const board = boards.find(b => b.id === selectedBoard);
        if (!board) return [];

        return board.classes
            .filter(c => c.subjects.some(s => s.name === selectedSubject))
            .map(c => ({
                id: c.id,
                name: c.section ? `${c.name} ${c.section}` : c.name,
                boardName: board.name,
                subjectId: c.subjects.find(s => s.name === selectedSubject)?.id
            }));
    }, [boards, selectedSubject, selectedBoard]);

    const handleSave = async () => {
        if (!selectedTeacher || !selectedSubject || selectedClasses.length === 0) return;
        setIsSaving(true);
        try {
            for (const classId of selectedClasses) {
                const cls = filteredClasses.find(c => c.id === classId);
                if (cls && cls.subjectId) {
                    const formData = new FormData();
                    formData.set('teacherId', selectedTeacher);
                    formData.set('classId', classId);
                    formData.set('subjectId', cls.subjectId);
                    await createAllocation(formData);
                }
            }
            setIsOpen(false);
        } catch (error) {
            console.error('Bulk assign failed', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredTeachers = useMemo(() => {
        return teachers.filter(t =>
            t.user.name?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
            t.specialization?.toLowerCase().includes(teacherSearch.toLowerCase())
        );
    }, [teachers, teacherSearch]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="vibrant shadow-sm">
                    <Layers className="mr-2 h-4 w-4" /> Bulk Assign
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk Allocation</DialogTitle>
                    <DialogDescription>Assign a teacher to multiple classes at once.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 py-4 overflow-y-auto px-1">
                    <div className="space-y-6">
                        {/* Step 1: Select Subject */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">1. Select Subject</label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a subject..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allSubjects.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Step 2: Select Teacher */}
                        {selectedSubject && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">2. Select Teacher</label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search teacher..."
                                        className="pl-8 mb-2"
                                        value={teacherSearch}
                                        onChange={e => setTeacherSearch(e.target.value)}
                                    />
                                </div>
                                <div className="border rounded-md h-[120px] overflow-y-auto p-1 bg-gray-50">
                                    {filteredTeachers.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => setSelectedTeacher(t.id)}
                                            className={`p-2 rounded cursor-pointer flex items-center justify-between text-sm ${selectedTeacher === t.id ? 'bg-primary text-white' : 'hover:bg-white'}`}
                                        >
                                            <span className="font-medium">{t.user.name}</span>
                                            <span className={`${selectedTeacher === t.id ? 'text-white/80' : 'text-gray-400'} text-xs`}>{t.specialization}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Select Board */}
                        {selectedSubject && selectedTeacher && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">3. Select Board</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableBoards.map(board => (
                                        <div
                                            key={board.id}
                                            onClick={() => {
                                                setSelectedBoard(board.id);
                                                setSelectedClasses([]); // Reset classes when board changes
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border cursor-pointer transition-all ${selectedBoard === board.id
                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                                                }`}
                                        >
                                            {board.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Select Classes */}
                        {selectedSubject && selectedTeacher && selectedBoard && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">4. Select Classes</label>
                                <div className="border rounded-md max-h-[150px] overflow-y-auto p-2 bg-gray-50 flex flex-wrap gap-2">
                                    {filteredClasses.length === 0 ? (
                                        <p className="text-sm text-gray-400 p-2">No classes found with {selectedSubject}</p>
                                    ) : (
                                        filteredClasses.map(cls => (
                                            <div
                                                key={cls.id}
                                                onClick={() => {
                                                    setSelectedClasses(prev =>
                                                        prev.includes(cls.id)
                                                            ? prev.filter(id => id !== cls.id)
                                                            : [...prev, cls.id]
                                                    )
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${selectedClasses.includes(cls.id)
                                                    ? 'bg-primary text-white border-primary shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                                                    }`}
                                            >
                                                {cls.name}
                                                {selectedClasses.includes(cls.id) && <CheckCircle2 className="inline ml-1.5 h-3 w-3" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedClasses(filteredClasses.map(c => c.id))}
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={!selectedSubject || !selectedTeacher || selectedClasses.length === 0 || isSaving}
                        className="font-bold"
                    >
                        {isSaving ? 'Assigning...' : `Assign to ${selectedClasses.length} Classes`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
