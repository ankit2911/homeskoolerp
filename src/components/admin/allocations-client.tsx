'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Users, BookOpen, GraduationCap, CheckCircle2, AlertCircle,
    Plus, X, ChevronDown
} from 'lucide-react';
import { createAllocation, deleteAllocation } from '@/lib/actions/allocation';

type Teacher = {
    id: string;
    userId: string;
    user: { id: string; name: string | null; email: string };
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

    // Aggregate classes by name (same as curriculum)
    const aggregatedClasses = useMemo(() => {
        if (!currentBoard) return [];

        const classGroups = new Map<string, Class[]>();
        for (const cls of currentBoard.classes) {
            const existing = classGroups.get(cls.name) || [];
            existing.push(cls);
            classGroups.set(cls.name, existing);
        }

        return Array.from(classGroups.entries()).map(([name, classes]) => {
            // Merge subjects from all sections
            const subjectMap = new Map<string, Subject>();
            for (const cls of classes) {
                for (const subject of cls.subjects) {
                    if (!subjectMap.has(subject.name)) {
                        subjectMap.set(subject.name, subject);
                    }
                }
            }
            return {
                name,
                classes,  // Keep all class sections for allocation lookup
                subjects: Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name))
            };
        }).sort((a, b) => {
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
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.totalTeachers}</p>
                            <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70">Teachers</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.totalAllocations}</p>
                            <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">Allocations</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.coverage}%</p>
                            <p className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70">Coverage</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
                            <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.unallocated}</p>
                            <p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">Unallocated</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Board Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
                {boards.map(board => (
                    <button
                        key={board.id}
                        onClick={() => setSelectedBoard(board.id)}
                        className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-all ${selectedBoard === board.id
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                    >
                        {board.name}
                    </button>
                ))}
            </div>

            {/* Allocation Matrix */}
            {aggregatedClasses.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-10 text-center">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No classes or subjects configured for this board.</p>
                        <p className="text-sm text-gray-400 mt-1">Add classes and subjects in Configuration first.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-gray-800/50">
                                    <th className="py-3 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider sticky left-0 bg-gray-50/80 dark:bg-gray-800/50 z-10 min-w-[120px]">
                                        Class
                                    </th>
                                    {allSubjects.map(subject => (
                                        <th key={subject.id} className="py-3 px-3 text-center font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider min-w-[140px]">
                                            {subject.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {aggregatedClasses.map((cls, idx) => (
                                    <tr key={cls.name} className={`border-t border-gray-100 dark:border-gray-800 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900/30' : 'bg-gray-50/30 dark:bg-gray-800/20'}`}>
                                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-white sticky left-0 bg-inherit z-10">
                                            {cls.name}
                                        </td>
                                        {allSubjects.map(subject => {
                                            const subjectExists = hasSubject(cls.name, subject.name);
                                            const cellAllocations = subjectExists ? getAllocationsForCell(cls.name, subject.name) : [];

                                            if (!subjectExists) {
                                                return (
                                                    <td key={subject.id} className="py-2 px-3 text-center">
                                                        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                                            <span className="text-[10px] text-gray-400">N/A</span>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={subject.id} className="py-2 px-3">
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
            <div className="flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
                    <span>Assigned</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-50 border border-amber-200"></div>
                    <span>Needs Assignment</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                    <span>Not Available</span>
                </div>
            </div>
        </div>
    );
}

// Individual cell component with teacher multi-select
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
        const subjectInfo = getSubjectInfo();
        if (!subjectInfo) return;

        setIsSaving(true);

        // Find teachers to add and remove
        const currentTeacherIds = currentAllocations.map(a => a.teacherId);
        const toAdd = selectedTeachers.filter(id => !currentTeacherIds.includes(id));
        const toRemove = currentAllocations.filter(a => !selectedTeachers.includes(a.teacherId));

        try {
            // Remove allocations
            for (const alloc of toRemove) {
                await deleteAllocation(alloc.id);
            }

            // Add new allocations
            for (const teacherId of toAdd) {
                const formData = new FormData();
                formData.set('teacherId', teacherId);
                formData.set('classId', subjectInfo.classId);
                formData.set('subjectId', subjectInfo.subjectId);
                await createAllocation(formData);
            }
        } finally {
            setIsSaving(false);
            setIsOpen(false);
        }
    };

    const hasTeachers = currentAllocations.length > 0;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={`w-full min-h-[40px] px-2 py-1.5 rounded-lg border text-left transition-all hover:shadow-md ${hasTeachers
                        ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                        : 'bg-amber-50 border-amber-200 hover:border-amber-400'
                        }`}
                >
                    {hasTeachers ? (
                        <div className="flex flex-wrap gap-1">
                            {currentAllocations.slice(0, 2).map(a => (
                                <Badge key={a.id} variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] font-medium">
                                    {a.teacher.user.name?.split(' ')[0] || 'Teacher'}
                                </Badge>
                            ))}
                            {currentAllocations.length > 2 && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-[10px]">
                                    +{currentAllocations.length - 2}
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1 text-amber-600">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-medium">Assign</span>
                        </div>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <div className="p-3 border-b bg-gray-50 dark:bg-gray-800">
                    <p className="font-bold text-sm">{className} - {subjectName}</p>
                    <p className="text-xs text-muted-foreground">Select teachers to assign</p>
                </div>
                <div className="p-2 max-h-[200px] overflow-y-auto">
                    {teachers.length === 0 ? (
                        <p className="text-xs text-center text-muted-foreground py-4">No teachers available</p>
                    ) : (
                        <div className="space-y-1">
                            {teachers.map(teacher => (
                                <label
                                    key={teacher.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedTeachers.includes(teacher.id)
                                        ? 'bg-primary/10'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <Checkbox
                                        checked={selectedTeachers.includes(teacher.id)}
                                        onCheckedChange={() => handleTeacherToggle(teacher.id)}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{teacher.user.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{teacher.user.email}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-2 border-t bg-gray-50 dark:bg-gray-800 flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" className="flex-1 font-bold" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
