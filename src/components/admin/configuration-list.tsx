'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, BookOpen, School, Layers, Search, RotateCcw, ChevronDown, ChevronRight, Eye, ToggleLeft, ToggleRight, Archive, RefreshCw } from 'lucide-react';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import { createBoard, updateBoard, deleteBoard } from '@/lib/actions/board';
import { createClass, updateClass, deleteClass } from '@/lib/actions/class';
import { createSubjectMaster, updateSubjectMaster, deactivateSubjectMaster, reactivateSubjectMaster } from '@/lib/actions/subject-master';
import { createSubject, updateSubject, deleteSubject } from '@/lib/actions/subject';
import { ConfigurationTiles } from './configuration-tiles';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Subject = {
    id: string;
    name: string;
    classId: string;
    subjectMasterId?: string;
};

type Class = {
    id: string;
    name: string;
    section: string | null;
    boardId: string;
    subjects: Subject[];
    _count: { students: number };
};

type Board = {
    id: string;
    name: string;
    classes: Class[];
};

type TableRowData = {
    board: Board;
    class: Class | null;
    isEmptyBoard: boolean;
};

type SubjectMaster = {
    id: string;
    name: string;
    code: string;
    category: string | null;
    isActive: boolean;
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    secondary: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    elective: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    language: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    cocurricular: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const ALL_CATEGORIES = ['primary', 'secondary', 'elective', 'language', 'cocurricular'];

const getCategoryColor = (category: string | null) => {
    return CATEGORY_COLORS[category || 'primary'] || CATEGORY_COLORS.primary;
};

export function ConfigurationList({
    boards,
    subjectMasters,
    initialAction
}: {
    boards: Board[],
    subjectMasters: SubjectMaster[],
    initialAction?: string
}) {
    const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (boards.length > 0) {
            setExpandedBoards(prev => {
                const newState = { ...prev };
                boards.forEach(b => {
                    if (newState[b.id] === undefined) newState[b.id] = true;
                });
                return newState;
            });
        }
    }, [boards]);

    const toggleBoard = (boardId: string) => {
        setExpandedBoards(prev => ({
            ...prev,
            [boardId]: !prev[boardId]
        }));
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [openDialog, setOpenDialog] = useState<string | null>(initialAction || null);

    useEffect(() => {
        if (initialAction) {
            queueMicrotask(() => setOpenDialog(initialAction));
        }
    }, [initialAction]);

    const filteredBoards = useMemo(() => {
        if (!searchQuery) return boards;

        const query = searchQuery.toLowerCase();
        return boards.map(board => {
            const boardMatches = board.name.toLowerCase().includes(query);
            const filteredClasses = board.classes.filter(cls => {
                const classMatches = cls.name.toLowerCase().includes(query) || (cls.section?.toLowerCase()?.includes(query) ?? false);
                const hasMatchingSubject = cls.subjects.some(sub => sub.name.toLowerCase().includes(query));
                return classMatches || hasMatchingSubject || boardMatches;
            });

            if (boardMatches || filteredClasses.length > 0) {
                return { ...board, classes: filteredClasses };
            }
            return null;
        }).filter(Boolean) as Board[];
    }, [boards, searchQuery]);

    return (
        <div className="space-y-4">
            <ConfigurationTiles onAction={(action) => setOpenDialog(action)} />

            {/* Global Dialogs */}
            <Dialog open={openDialog === 'create-board'} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white dark:bg-gray-900">
                    <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-heading flex items-center gap-2">
                                <School className="h-5 w-5 text-primary" />
                                Add New Board
                            </DialogTitle>
                            <DialogDescription className="text-gray-500 dark:text-gray-400">
                                Create a new educational board to organize classes and curriculum.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6">
                        <form action={async (formData) => {
                            await createBoard(formData);
                            setOpenDialog(null);
                        }} className="space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Board Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        name="name"
                                        placeholder="e.g. CBSE, ICSE, State Board"
                                        className="h-10 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/20 transition-all font-medium"
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">The official name of the education board.</p>
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpenDialog(null)} className="h-10 font-medium">Cancel</Button>
                                <Button type="submit" className="h-10 font-bold px-6 shadow-md shadow-primary/20">Create Board</Button>
                            </DialogFooter>
                        </form>

                        {boards.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Layers className="h-3 w-3" /> Existing Boards ({boards.length})
                                </h4>
                                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {boards.map(board => (
                                        <div key={board.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60 rounded-lg group hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                                                    {board.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{board.name}</span>
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 shadow-sm">
                                                {board.classes.length} classes
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openDialog === 'create-class'} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">Add New Class</DialogTitle>
                        <DialogDescription>Select a board, define class details, and assign subjects.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4 max-h-[80vh] overflow-y-auto pr-2">
                        <form action={async (formData) => {
                            await createClass(formData);
                            setOpenDialog(null);
                        }} className="space-y-6">
                            {/* Class Information Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-1">
                                    <Layers className="h-4 w-4 text-primary" />
                                    <h3 className="font-heading font-bold text-sm">Class Information</h3>
                                </div>
                                <p className="text-[10px] text-muted-foreground -mt-3">Basic details about the class.</p>

                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Select Board <span className="text-red-500">*</span></Label>
                                        <Select name="boardId" required>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose a board" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {boards.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-bold">Class Name <span className="text-red-500">*</span></Label>
                                            <Input name="name" placeholder="e.g. Class 10" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-bold">Section</Label>
                                            <Input name="section" placeholder="e.g. A" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assign Subjects Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-1">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <h3 className="font-heading font-bold text-sm">Assign Subjects</h3>
                                </div>
                                <p className="text-[10px] text-muted-foreground -mt-3">Select subjects from the global subject list to assign to this class.</p>

                                {subjectMasters.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground italic border rounded-xl bg-gray-50/50">
                                        No global subjects defined. Create them in Subject Configuration first.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {ALL_CATEGORIES.map(category => {
                                            const categorySubjects = subjectMasters.filter(sm => (sm.category || 'primary') === category && sm.isActive !== false);
                                            if (categorySubjects.length === 0) return null;
                                            const colors = getCategoryColor(category);

                                            return (
                                                <div key={category} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-[10px] uppercase font-bold`}>
                                                                {category}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">({categorySubjects.length})</span>
                                                        </div>
                                                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                className="h-3 w-3 accent-primary"
                                                                onChange={(e) => {
                                                                    const checkboxes = document.querySelectorAll<HTMLInputElement>(`input[data-category="${category}"]`);
                                                                    checkboxes.forEach(cb => cb.checked = e.target.checked);
                                                                }}
                                                            />
                                                            <span className="font-medium">Select All</span>
                                                        </label>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {categorySubjects.map(sm => (
                                                            <label key={sm.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border ${colors.border} ${colors.bg} hover:opacity-80 transition-opacity`}>
                                                                <input
                                                                    type="checkbox"
                                                                    name="subjectIds"
                                                                    value={sm.id}
                                                                    data-category={category}
                                                                    className="h-3.5 w-3.5 accent-primary"
                                                                />
                                                                <div className="flex flex-col leading-none">
                                                                    <span className="text-xs font-medium">{sm.name}</span>
                                                                    <span className="text-[9px] font-mono text-muted-foreground">{sm.code}</span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="submit" className="w-full font-bold py-5 text-base">Create Class</Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openDialog === 'bulk-map'} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">Subject Configuration</DialogTitle>
                        <DialogDescription>Manage the global list of subjects with categories.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4 max-h-[80vh] overflow-y-auto pr-2">
                        {/* Add New Subject Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <Plus className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Add New Subject</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground -mt-3">Create a new global subject with a unique code and category.</p>

                            <form action={async (formData) => {
                                await createSubjectMaster(formData);
                            }} className="space-y-3 p-4 border rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-bold">Name <span className="text-red-500">*</span></Label>
                                        <Input name="name" placeholder="e.g. Mathematics" required className="h-9" />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-bold">Code <span className="text-red-500">*</span></Label>
                                        <Input name="code" placeholder="e.g. MATH" required className="h-9" />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-bold">Category</Label>
                                        <Select name="category" defaultValue="primary">
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="primary">Primary</SelectItem>
                                                <SelectItem value="secondary">Secondary</SelectItem>
                                                <SelectItem value="elective">Elective</SelectItem>
                                                <SelectItem value="language">Language</SelectItem>
                                                <SelectItem value="cocurricular">Co-curricular</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full font-bold">Add to Global List</Button>
                            </form>
                        </div>

                        {/* Active Subjects by Category */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-1">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <h3 className="font-heading font-bold text-sm">Active Subjects ({subjectMasters.filter(sm => sm.isActive !== false).length})</h3>
                                </div>
                            </div>

                            {ALL_CATEGORIES.map(category => {
                                const categorySubjects = subjectMasters.filter(sm => (sm.category || 'primary') === category && sm.isActive !== false);
                                if (categorySubjects.length === 0) return null;
                                const colors = getCategoryColor(category);

                                return (
                                    <div key={category} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-[10px] uppercase font-bold`}>
                                                {category}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">({categorySubjects.length})</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {categorySubjects.map(sm => (
                                                <div key={sm.id} className={`p-2 flex items-center justify-between rounded-lg border ${colors.border} ${colors.bg} hover:opacity-90 transition-opacity`}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-bold truncate" title={sm.name}>{sm.name}</span>
                                                            <span className="text-[9px] font-mono text-muted-foreground truncate">{sm.code}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center shrink-0">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6"><Edit2 className="h-3 w-3" /></Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[400px]">
                                                                <DialogHeader><DialogTitle>Edit Subject</DialogTitle></DialogHeader>
                                                                <form action={async (formData) => {
                                                                    await updateSubjectMaster(formData);
                                                                }} className="space-y-4 pt-4">
                                                                    <input type="hidden" name="id" value={sm.id} />
                                                                    <div className="grid gap-2">
                                                                        <Label className="font-bold">Subject Name</Label>
                                                                        <Input name="name" defaultValue={sm.name} required />
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        <Label className="font-bold">Subject Code</Label>
                                                                        <Input name="code" defaultValue={sm.code} required />
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        <Label className="font-bold">Category</Label>
                                                                        <Select name="category" defaultValue={sm.category || 'primary'}>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="primary">Primary</SelectItem>
                                                                                <SelectItem value="secondary">Secondary</SelectItem>
                                                                                <SelectItem value="elective">Elective</SelectItem>
                                                                                <SelectItem value="language">Language</SelectItem>
                                                                                <SelectItem value="cocurricular">Co-curricular</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <DialogFooter><Button type="submit" className="w-full">Update Subject</Button></DialogFooter>
                                                                </form>
                                                            </DialogContent>
                                                        </Dialog>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                            title="Deactivate subject"
                                                            onClick={async () => {
                                                                await deactivateSubjectMaster(sm.id);
                                                            }}
                                                        >
                                                            <Archive className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {subjectMasters.filter(sm => sm.isActive !== false).length === 0 && (
                                <div className="p-8 text-center text-sm text-muted-foreground italic border rounded-xl bg-gray-50/50">
                                    No active subjects defined yet. Add one above!
                                </div>
                            )}
                        </div>

                        {/* Inactive Subjects Section */}
                        {subjectMasters.filter(sm => sm.isActive === false).length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-dashed">
                                <div className="flex items-center gap-2">
                                    <Archive className="h-4 w-4 text-gray-400" />
                                    <h3 className="font-heading font-bold text-sm text-gray-500">Inactive Subjects ({subjectMasters.filter(sm => sm.isActive === false).length})</h3>
                                </div>
                                <p className="text-[10px] text-muted-foreground -mt-2">These subjects are deactivated and won&apos;t appear in selections. You can reactivate them anytime.</p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[150px] overflow-y-auto pr-2">
                                    {subjectMasters.filter(sm => sm.isActive === false).map(sm => {
                                        const colors = getCategoryColor(sm.category);
                                        return (
                                            <div key={sm.id} className="p-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 opacity-70 hover:opacity-100 transition-opacity">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-medium text-gray-600 truncate" title={sm.name}>{sm.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-mono text-muted-foreground truncate">{sm.code}</span>
                                                            <Badge variant="outline" className="text-[8px] h-4 px-1">{sm.category || 'primary'}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 text-[10px] font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 shrink-0"
                                                    onClick={async () => {
                                                        await reactivateSubjectMaster(sm.id);
                                                    }}
                                                >
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Reactivate
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Search Bar */}
            <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-800/30">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search boards, classes, or subjects..."
                            className="pl-10 h-9 bg-white dark:bg-gray-900 border-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {searchQuery && (
                        <Button variant="ghost" className="h-9 px-3 text-gray-400 font-bold gap-2" onClick={() => setSearchQuery('')}>
                            <RotateCcw className="h-4 w-4" /> Reset
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Configuration Table */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Board</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Class</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Section</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Subjects</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Students</TableHead>
                            <TableHead className="text-right py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBoards.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground bg-muted/5">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="h-8 w-8 opacity-20" />
                                        <p className="font-medium">{searchQuery ? 'No matches found for your search.' : 'No boards configured yet.'}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBoards.map(board => {
                                const isExpanded = expandedBoards[board.id];
                                return (
                                    <React.Fragment key={board.id}>
                                        {/* Board Header Row */}
                                        <TableRow className="bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                                            <TableCell className="font-bold text-gray-900 dark:text-white py-3">
                                                <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => toggleBoard(board.id)}>
                                                    <div className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                    </div>
                                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                                                        <School className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <span>{board.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell colSpan={4}>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                                    <Badge variant="outline" className="bg-white dark:bg-gray-900">
                                                        {board.classes.length} Classes
                                                    </Badge>
                                                    {board.classes.length === 0 && <span className="italic text-orange-500">No classes configured</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-600">
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[400px]">
                                                            <DialogHeader><DialogTitle>Edit Board</DialogTitle></DialogHeader>
                                                            <form action={async (formData) => {
                                                                await updateBoard(formData);
                                                            }} className="space-y-4 pt-4">
                                                                <input type="hidden" name="id" value={board.id} />
                                                                <div className="grid gap-2">
                                                                    <Label className="font-bold">Board Name</Label>
                                                                    <Input name="name" defaultValue={board.name} required />
                                                                </div>
                                                                <DialogFooter><Button type="submit" className="w-full">Update Board</Button></DialogFooter>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>
                                                    <DeleteConfirm onDelete={async () => {
                                                        return await deleteBoard(board.id);
                                                    }} />
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="h-8 text-xs font-bold">
                                                                <Plus className="mr-1 h-3 w-3" /> Class
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[550px]">
                                                            <DialogHeader>
                                                                <DialogTitle className="font-heading text-lg">Add Class to {board.name}</DialogTitle>
                                                                <DialogDescription>Create a class and optionally assign subjects.</DialogDescription>
                                                            </DialogHeader>
                                                            <form action={async (formData) => {
                                                                formData.set('boardId', board.id);
                                                                await createClass(formData);
                                                            }} className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="grid gap-2">
                                                                        <Label className="text-xs font-bold">Class Name <span className="text-red-500">*</span></Label>
                                                                        <Input name="name" placeholder="e.g. Class 10" required />
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        <Label className="text-xs font-bold">Section</Label>
                                                                        <Input name="section" placeholder="e.g. A" />
                                                                    </div>
                                                                </div>

                                                                {subjectMasters.length > 0 && (
                                                                    <div className="space-y-3">
                                                                        <Label className="text-xs font-bold">Assign Subjects</Label>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {subjectMasters.filter(sm => sm.isActive !== false).map(sm => {
                                                                                const colors = getCategoryColor(sm.category);
                                                                                return (
                                                                                    <label key={sm.id} className={`flex items-center gap-2 px-2.5 py-1 rounded-lg cursor-pointer border ${colors.border} ${colors.bg} hover:opacity-80 transition-opacity`}>
                                                                                        <input type="checkbox" name="subjectIds" value={sm.id} className="h-3 w-3 accent-primary" />
                                                                                        <span className="text-xs font-medium">{sm.name}</span>
                                                                                    </label>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <DialogFooter>
                                                                    <Button type="submit" className="w-full font-bold">Create Class</Button>
                                                                </DialogFooter>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Class Rows */}
                                        {isExpanded && board.classes.map(cls => (
                                            <TableRow key={cls.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-b border-gray-50 dark:border-gray-800 transition-colors">
                                                <TableCell className="pl-12">
                                                    {/* Empty for indentation */}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Layers className="h-4 w-4 text-emerald-600" />
                                                        <span className="font-bold text-gray-900 dark:text-white">{cls.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs font-medium">
                                                        {cls.section || 'No Section'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 group">
                                                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 font-bold" title={cls.subjects.map(s => s.name).join(', ')}>
                                                            {cls.subjects.length} Subjects Linked
                                                        </Badge>

                                                        {cls.subjects.length > 0 && (
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Eye className="h-3 w-3" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[400px]">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                                                                            <BookOpen className="h-4 w-4 text-primary" />
                                                                            Subjects in {cls.name}
                                                                        </DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="py-4">
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {cls.subjects.map(sub => (
                                                                                <Badge key={sub.id} variant="outline" className="px-3 py-1 bg-gray-50 text-sm font-medium">
                                                                                    {sub.name}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-0 font-bold text-xs">
                                                        {cls._count.students} Students
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-600">
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader><DialogTitle>Edit Class</DialogTitle></DialogHeader>
                                                                <form action={async (formData) => {
                                                                    await updateClass(formData);
                                                                }} className="space-y-4 pt-4">
                                                                    <input type="hidden" name="id" value={cls.id} />
                                                                    <input type="hidden" name="boardId" value={board.id} />
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="grid gap-2">
                                                                            <Label className="font-bold">Class Name</Label>
                                                                            <Input name="name" defaultValue={cls.name} required />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label className="font-bold">Section</Label>
                                                                            <Input name="section" defaultValue={cls.section || ''} />
                                                                        </div>
                                                                    </div>

                                                                    {subjectMasters.length > 0 && (
                                                                        <div className="space-y-3 border-t pt-3">
                                                                            <Label className="text-xs font-bold">Manage Subjects</Label>
                                                                            <div className="space-y-3">
                                                                                {ALL_CATEGORIES.map(category => {
                                                                                    const categorySubjects = subjectMasters.filter(sm => (sm.category || 'primary') === category && sm.isActive !== false);
                                                                                    if (categorySubjects.length === 0) return null;
                                                                                    const colors = getCategoryColor(category);

                                                                                    return (
                                                                                        <div key={category} className="space-y-2">
                                                                                            <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-[10px] uppercase font-bold`}>
                                                                                                {category}
                                                                                            </Badge>
                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                {categorySubjects.map(sm => {
                                                                                                    const isChecked = cls.subjects.some(s => s.subjectMasterId === sm.id);
                                                                                                    return (
                                                                                                        <label key={sm.id} className={`flex items-center gap-2 px-2.5 py-1 rounded-lg cursor-pointer border ${colors.border} ${colors.bg} hover:opacity-80 transition-opacity`}>
                                                                                                            <input
                                                                                                                type="checkbox"
                                                                                                                name="subjectIds"
                                                                                                                value={sm.id}
                                                                                                                defaultChecked={isChecked}
                                                                                                                className="h-3 w-3 accent-primary"
                                                                                                            />
                                                                                                            <span className="text-xs font-medium">{sm.name}</span>
                                                                                                        </label>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <DialogFooter><Button type="submit" className="w-full">Update Class</Button></DialogFooter>
                                                                </form>
                                                            </DialogContent>
                                                        </Dialog>
                                                        <DeleteConfirm onDelete={async () => {
                                                            return await deleteClass(cls.id);
                                                        }} />
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" variant="outline" className="h-8 text-xs font-bold">
                                                                    <Plus className="mr-1 h-3 w-3" /> Subject
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[500px]">
                                                                <DialogHeader>
                                                                    <DialogTitle className="font-heading text-lg">Add Subjects to {cls.name}</DialogTitle>
                                                                    <DialogDescription>Select subjects to add to this class.</DialogDescription>
                                                                </DialogHeader>
                                                                <form action={async (formData) => {
                                                                    formData.set('classId', cls.id);
                                                                    await createSubject(formData);
                                                                }} className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                                                                    {subjectMasters.length === 0 ? (
                                                                        <div className="p-4 text-center text-sm text-muted-foreground italic border rounded-xl bg-gray-50/50">
                                                                            No global subjects defined. Create them in Subject Configuration first.
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-3">
                                                                            {ALL_CATEGORIES.map(category => {
                                                                                const categorySubjects = subjectMasters.filter(sm => (sm.category || 'primary') === category && sm.isActive !== false);
                                                                                if (categorySubjects.length === 0) return null;
                                                                                const colors = getCategoryColor(category);

                                                                                return (
                                                                                    <div key={category} className="space-y-2">
                                                                                        <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-[10px] uppercase font-bold`}>
                                                                                            {category}
                                                                                        </Badge>
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {categorySubjects.map(sm => {
                                                                                                const isAlreadyAdded = cls.subjects.some(s => s.subjectMasterId === sm.id);
                                                                                                return (
                                                                                                    <label key={sm.id} className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${colors.border} ${colors.bg} ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'} transition-opacity`}>
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            name="subjectMasterIds"
                                                                                                            value={sm.id}
                                                                                                            disabled={isAlreadyAdded}
                                                                                                            className={`h-3 w-3 accent-primary ${isAlreadyAdded ? 'cursor-not-allowed' : ''}`}
                                                                                                        />
                                                                                                        <span className="text-xs font-medium">{sm.name}</span>
                                                                                                        {isAlreadyAdded && <span className="text-[10px] text-green-600 font-bold ml-1">(Added)</span>}
                                                                                                    </label>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                    <DialogFooter>
                                                                        <Button type="submit" className="w-full font-bold">Add Selected Subjects</Button>
                                                                    </DialogFooter>
                                                                </form>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
