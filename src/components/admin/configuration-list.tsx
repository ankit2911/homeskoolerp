'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Plus, Edit2, BookOpen, School, Layers, Search, RotateCcw } from 'lucide-react';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import { createBoard, updateBoard, deleteBoard } from '@/lib/actions/board';
import { createClass, updateClass, deleteClass } from '@/lib/actions/class';
import { createSubject, updateSubject, deleteSubject } from '@/lib/actions/subject';
import { createSubjectMaster, updateSubjectMaster, deleteSubjectMaster } from '@/lib/actions/subject-master';
import { ConfigurationTiles } from './configuration-tiles';

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
    _count: { students: number };
};

type Board = {
    id: string;
    name: string;
    classes: Class[];
};

type SubjectMaster = {
    id: string;
    name: string;
    code: string;
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
                const classMatches = cls.name.toLowerCase().includes(query) || (cls.section?.toLowerCase().includes(query) ?? false);
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
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Add New Board</DialogTitle>
                        <DialogDescription>Create a new educational board (e.g., CBSE, ICSE).</DialogDescription>
                    </DialogHeader>
                    <form action={async (formData) => {
                        await createBoard(formData);
                        setOpenDialog(null);
                    }} className="space-y-4 pt-4">
                        <div className="grid gap-2">
                            <Label className="font-bold">Board Name</Label>
                            <Input name="name" placeholder="e.g. CBSE" required />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full font-bold">Create Board</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={openDialog === 'create-class'} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Add New Class</DialogTitle>
                        <DialogDescription>Select a board and define class details.</DialogDescription>
                    </DialogHeader>
                    <form action={async (formData) => {
                        await createClass(formData);
                        setOpenDialog(null);
                    }} className="space-y-4 pt-4">
                        <div className="grid gap-2">
                            <Label className="font-bold">Select Board</Label>
                            <Select name="boardId" required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chose a board" />
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
                                <Label className="font-bold">Class Name</Label>
                                <Input name="name" placeholder="e.g. Class 10" required />
                            </div>
                            <div className="grid gap-2">
                                <Label className="font-bold">Section</Label>
                                <Input name="section" placeholder="e.g. A" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="font-bold">Quick Subjects (Comma separated)</Label>
                            <Input name="subjects" placeholder="Mathematics, Physics, Chemistry" />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full font-bold">Create Class & Subjects</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={openDialog === 'bulk-map'} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Subject Configuration</DialogTitle>
                        <DialogDescription>Manage the global list of subjects and their unique codes.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                        {/* Add New Subject */}
                        <form action={async (formData) => {
                            await createSubjectMaster(formData);
                        }} className="space-y-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground">Add New Global Subject</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px] font-bold">Name</Label>
                                    <Input name="name" placeholder="e.g. Mathematics" required className="h-8 text-xs" />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px] font-bold">Code</Label>
                                    <Input name="code" placeholder="e.g. MATH101" required className="h-8 text-xs" />
                                </div>
                            </div>
                            <Button type="submit" size="sm" className="w-full h-8 font-bold">Add to Global List</Button>
                        </form>

                        {/* Subject List */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground">Defined Subjects ({subjectMasters.length})</h4>
                            <div className="max-h-[300px] overflow-y-auto border rounded-md divide-y dark:divide-gray-800">
                                {subjectMasters.length === 0 && (
                                    <div className="p-8 text-center text-xs text-muted-foreground italic">No global subjects defined yet.</div>
                                )}
                                {subjectMasters.map(sm => (
                                    <div key={sm.id} className="p-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{sm.name}</span>
                                            <span className="text-[10px] font-mono text-muted-foreground">{sm.code}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm" className="h-7 w-7"><Edit2 className="h-3.5 w-3.5" /></Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[400px]">
                                                    <DialogHeader><DialogTitle>Edit Global Subject</DialogTitle></DialogHeader>
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
                                                        <DialogFooter><Button type="submit" className="w-full">Update Subject</Button></DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                            <DeleteConfirm onDelete={async () => {
                                                return await deleteSubjectMaster(sm.id);
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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

            {filteredBoards.length === 0 && (
                <Card className="border-dashed border-2 py-10">
                    <CardContent className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Search className="h-10 w-10 opacity-20" />
                        <p>{searchQuery ? 'No matches found for your search.' : 'No boards configured yet.'}</p>
                    </CardContent>
                </Card>
            )}

            <Accordion type="multiple" className="space-y-4">
                {filteredBoards.map((board) => (
                    <AccordionItem key={board.id} value={board.id} className="border bg-white dark:bg-gray-950 rounded-lg px-4 shadow-sm">
                        <div className="flex items-center justify-between py-2">
                            <AccordionTrigger className="hover:no-underline py-2 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                        <School className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm">{board.name}</span>
                                        <span className="text-[10px] text-gray-500">{board.classes.length} Classes Defined</span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <div className="flex items-center gap-2 pr-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-blue-500"><Edit2 className="h-3.5 w-3.5" /></Button>
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
                                        <Button size="sm" variant="outline" className="h-7 text-xs font-bold">
                                            <Plus className="mr-1 h-3 w-3" /> Add Class
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[450px]">
                                        <DialogHeader>
                                            <DialogTitle>Add Class to {board.name}</DialogTitle>
                                            <DialogDescription>Create a class and optionally assign initial subjects.</DialogDescription>
                                        </DialogHeader>
                                        <form action={async (formData) => {
                                            formData.set('boardId', board.id);
                                            await createClass(formData);
                                        }} className="space-y-4 pt-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="font-bold">Class Name</Label>
                                                    <Input name="name" placeholder="e.g. Class 10" required />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="font-bold">Section</Label>
                                                    <Input name="section" placeholder="e.g. A" />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="font-bold">Quick Subjects (Comma separated)</Label>
                                                <Input name="subjects" placeholder="Mathematics, Physics, Chemistry" />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="w-full font-bold">Create Class & Subjects</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <AccordionContent className="pb-2">
                            <div className="pl-8 pt-1 space-y-2">
                                {board.classes.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No classes found.</p>
                                )}
                                {board.classes.map((cls) => (
                                    <div key={cls.id} className="border rounded-md bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden">
                                        <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-900/80">
                                            <div className="flex items-center gap-3">
                                                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                                                <div className="leading-tight">
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">{cls.name} {cls.section ? `(${cls.section})` : ''}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] h-4 py-0 font-medium">{cls._count.students} Students</Badge>
                                                        <Badge variant="outline" className="text-[10px] h-4 py-0 font-medium">{cls.subjects.length} Subjects</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="icon-sm" variant="ghost" className="h-7 w-7"><Edit2 className="h-3 w-3.5" /></Button>
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
                                                            <DialogFooter><Button type="submit" className="w-full">Update Class</Button></DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                                <DeleteConfirm onDelete={async () => {
                                                    return await deleteClass(cls.id);
                                                }} />
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="ghost" className="h-7 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                            <Plus className="mr-1 h-3 w-3" /> Subject
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[400px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Add Subject to {cls.name}</DialogTitle>
                                                        </DialogHeader>
                                                        <form action={async (formData) => {
                                                            formData.set('classId', cls.id);
                                                            await createSubject(formData);
                                                        }} className="space-y-4 pt-4">
                                                            <div className="grid gap-2">
                                                                <Label className="font-bold">Subject Name</Label>
                                                                <Input name="name" placeholder="e.g. History" required />
                                                            </div>
                                                            <DialogFooter>
                                                                <Button type="submit" className="w-full font-bold">Add Subject</Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-gray-950">
                                            <div className="flex flex-wrap gap-2">
                                                {cls.subjects.length === 0 && (
                                                    <p className="text-xs text-muted-foreground italic">No subjects added.</p>
                                                )}
                                                {cls.subjects.map((sub) => (
                                                    <div key={sub.id} className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded group transition-all">
                                                        <BookOpen className="h-3 w-3 text-blue-500" />
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{sub.name}</span>
                                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <button className="text-blue-500 hover:text-blue-600 p-0.5"><Edit2 className="h-2.5 w-2.5" /></button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[400px]">
                                                                    <DialogHeader><DialogTitle>Edit Subject</DialogTitle></DialogHeader>
                                                                    <form action={async (formData) => {
                                                                        await updateSubject(formData);
                                                                    }} className="space-y-4">
                                                                        <input type="hidden" name="id" value={sub.id} />
                                                                        <input type="hidden" name="classId" value={cls.id} />
                                                                        <div className="grid gap-2">
                                                                            <Label>Subject Name</Label>
                                                                            <Input name="name" defaultValue={sub.name} required />
                                                                        </div>
                                                                        <DialogFooter><Button type="submit" className="w-full">Update</Button></DialogFooter>
                                                                    </form>
                                                                </DialogContent>
                                                            </Dialog>
                                                            <DeleteConfirm onDelete={async () => {
                                                                return await deleteSubject(sub.id);
                                                            }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
