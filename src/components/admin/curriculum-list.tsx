'use client';

import React, { useState, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, BookOpen, School, Layers, Search, RotateCcw, ChevronDown, ChevronRight, FileText, FolderOpen, Link as LinkIcon } from 'lucide-react';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import { createChapter, updateChapter, deleteChapter, createTopic, updateTopic, deleteTopic } from '@/lib/actions/curriculum';

type Topic = {
    id: string;
    name: string;
    description: string | null;
    chapterId: string;
    _count: { resources: number };
};

type Chapter = {
    id: string;
    name: string;
    subjectId: string;
    topics: Topic[];
};

type Subject = {
    id: string;
    name: string;
    classId: string;
    chapters: Chapter[];
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

type CurriculumListProps = {
    boards: Board[];
};

export function CurriculumList({ boards }: CurriculumListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [boardFilter, setBoardFilter] = useState<string>('all');
    const [classFilter, setClassFilter] = useState<string>('all');

    // Expansion states
    const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        boards.forEach(b => { initial[b.id] = true; });
        return initial;
    });
    const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
    const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
    const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

    // Helper to get all child IDs that need to be cleared when a parent is collapsed
    const getClassIdsForBoard = (boardId: string) => {
        const board = boards.find(b => b.id === boardId);
        return board?.classes.map(c => c.id) || [];
    };

    const getSubjectIdsForClass = (classId: string) => {
        for (const board of boards) {
            const cls = board.classes.find(c => c.id === classId);
            if (cls) return cls.subjects.map(s => s.id);
        }
        return [];
    };

    const getChapterIdsForSubject = (subjectId: string) => {
        for (const board of boards) {
            for (const cls of board.classes) {
                const subj = cls.subjects.find(s => s.id === subjectId);
                if (subj) return subj.chapters.map(ch => ch.id);
            }
        }
        return [];
    };

    const toggleBoard = (id: string) => {
        const isCurrentlyExpanded = expandedBoards[id];
        if (isCurrentlyExpanded) {
            // Collapsing: clear all child states
            const classIds = getClassIdsForBoard(id);
            const subjectIds = classIds.flatMap(cid => getSubjectIdsForClass(cid));
            const chapterIds = subjectIds.flatMap(sid => getChapterIdsForSubject(sid));

            setExpandedClasses(prev => {
                const next = { ...prev };
                classIds.forEach(cid => delete next[cid]);
                return next;
            });
            setExpandedSubjects(prev => {
                const next = { ...prev };
                subjectIds.forEach(sid => delete next[sid]);
                return next;
            });
            setExpandedChapters(prev => {
                const next = { ...prev };
                chapterIds.forEach(chid => delete next[chid]);
                return next;
            });
        }
        setExpandedBoards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleClass = (id: string) => {
        const isCurrentlyExpanded = expandedClasses[id];
        if (isCurrentlyExpanded) {
            // Collapsing: clear all child states
            const subjectIds = getSubjectIdsForClass(id);
            const chapterIds = subjectIds.flatMap(sid => getChapterIdsForSubject(sid));

            setExpandedSubjects(prev => {
                const next = { ...prev };
                subjectIds.forEach(sid => delete next[sid]);
                return next;
            });
            setExpandedChapters(prev => {
                const next = { ...prev };
                chapterIds.forEach(chid => delete next[chid]);
                return next;
            });
        }
        setExpandedClasses(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleSubject = (id: string) => {
        const isCurrentlyExpanded = expandedSubjects[id];
        if (isCurrentlyExpanded) {
            // Collapsing: clear all child chapter states
            const chapterIds = getChapterIdsForSubject(id);
            setExpandedChapters(prev => {
                const next = { ...prev };
                chapterIds.forEach(chid => delete next[chid]);
                return next;
            });
        }
        setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleChapter = (id: string) => setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));

    // Filtered data
    const filteredBoards = useMemo(() => {
        let result = boards;

        // Board filter
        if (boardFilter !== 'all') {
            result = result.filter(b => b.id === boardFilter);
        }

        // Class filter
        if (classFilter !== 'all') {
            result = result.map(board => ({
                ...board,
                classes: board.classes.filter(cls => cls.id === classFilter)
            })).filter(b => b.classes.length > 0);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.map(board => {
                const boardMatches = board.name.toLowerCase().includes(query);

                const filteredClasses = board.classes.map(cls => {
                    const classMatches = cls.name.toLowerCase().includes(query);

                    const filteredSubjects = cls.subjects.map(subj => {
                        const subjectMatches = subj.name.toLowerCase().includes(query);

                        const filteredChapters = subj.chapters.map(ch => {
                            const chapterMatches = ch.name.toLowerCase().includes(query);
                            const filteredTopics = ch.topics.filter(t =>
                                t.name.toLowerCase().includes(query) ||
                                (t.description?.toLowerCase().includes(query) ?? false)
                            );

                            if (chapterMatches || filteredTopics.length > 0) {
                                return { ...ch, topics: chapterMatches ? ch.topics : filteredTopics };
                            }
                            return null;
                        }).filter(Boolean) as Chapter[];

                        if (subjectMatches || filteredChapters.length > 0) {
                            return { ...subj, chapters: subjectMatches ? subj.chapters : filteredChapters };
                        }
                        return null;
                    }).filter(Boolean) as Subject[];

                    if (classMatches || filteredSubjects.length > 0) {
                        return { ...cls, subjects: classMatches ? cls.subjects : filteredSubjects };
                    }
                    return null;
                }).filter(Boolean) as Class[];

                if (boardMatches || filteredClasses.length > 0) {
                    return { ...board, classes: boardMatches ? board.classes : filteredClasses };
                }
                return null;
            }).filter(Boolean) as Board[];
        }

        return result;
    }, [boards, boardFilter, classFilter, searchQuery]);

    // Get all classes for filter dropdown
    const allClasses = useMemo(() => {
        return boards.flatMap(b => b.classes.map(c => ({ ...c, boardName: b.name })));
    }, [boards]);

    // Stats
    const totalChapters = boards.reduce((acc, b) =>
        acc + b.classes.reduce((acc2, c) =>
            acc2 + c.subjects.reduce((acc3, s) => acc3 + s.chapters.length, 0), 0), 0);

    const totalTopics = boards.reduce((acc, b) =>
        acc + b.classes.reduce((acc2, c) =>
            acc2 + c.subjects.reduce((acc3, s) =>
                acc3 + s.chapters.reduce((acc4, ch) => acc4 + ch.topics.length, 0), 0), 0), 0);

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                            <School className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{boards.length}</p>
                            <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70">Boards</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                            <Layers className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{allClasses.length}</p>
                            <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">Classes</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20">
                            <FolderOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{totalChapters}</p>
                            <p className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70">Chapters</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{totalTopics}</p>
                            <p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">Topics</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filters */}
            <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-800/30">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search boards, classes, subjects, chapters, topics..."
                            className="pl-10 h-9 bg-white dark:bg-gray-900 border-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={boardFilter} onValueChange={setBoardFilter}>
                        <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-gray-900">
                            <SelectValue placeholder="Filter by Board" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Boards</SelectItem>
                            {boards.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-gray-900">
                            <SelectValue placeholder="Filter by Class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {allClasses.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name} ({c.boardName})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(searchQuery || boardFilter !== 'all' || classFilter !== 'all') && (
                        <Button variant="ghost" className="h-9 px-3 text-gray-400 font-bold gap-2" onClick={() => {
                            setSearchQuery('');
                            setBoardFilter('all');
                            setClassFilter('all');
                        }}>
                            <RotateCcw className="h-4 w-4" /> Reset
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Curriculum Table */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider w-[40%]">Curriculum Structure</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Details</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Stats</TableHead>
                            <TableHead className="text-right py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider w-[150px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBoards.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-32 text-muted-foreground bg-muted/5">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="h-8 w-8 opacity-20" />
                                        <p className="font-medium">{searchQuery ? 'No matches found.' : 'No curriculum data yet.'}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBoards.map(board => (
                                <React.Fragment key={board.id}>
                                    {/* Board Row */}
                                    <TableRow className="bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30">
                                        <TableCell className="font-bold text-gray-900 dark:text-white py-3">
                                            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => toggleBoard(board.id)}>
                                                <div className={`p-1 rounded-md transition-colors ${expandedBoards[board.id] ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                                                    {expandedBoards[board.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                </div>
                                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                                    <School className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <span className="text-base">{board.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-white dark:bg-gray-900 text-blue-600 border-blue-200">
                                                {board.classes.length} Classes
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {board.classes.reduce((acc, c) => acc + c.subjects.length, 0)} subjects
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Board actions if needed */}
                                        </TableCell>
                                    </TableRow>

                                    {/* Classes under Board */}
                                    {expandedBoards[board.id] && board.classes.map(cls => (
                                        <React.Fragment key={cls.id}>
                                            {/* Class Row */}
                                            <TableRow className="bg-emerald-50/30 dark:bg-emerald-900/5 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/10 border-b border-emerald-100/50 dark:border-emerald-900/20">
                                                <TableCell className="py-2.5">
                                                    <div className="flex items-center gap-2 cursor-pointer select-none pl-8" onClick={() => toggleClass(cls.id)}>
                                                        <div className={`p-1 rounded-md transition-colors ${expandedClasses[cls.id] ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                                                            {expandedClasses[cls.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                        </div>
                                                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded">
                                                            <Layers className="h-3.5 w-3.5 text-emerald-600" />
                                                        </div>
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{cls.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-white dark:bg-gray-900 text-emerald-600 border-emerald-200 text-[10px]">
                                                        {cls.subjects.length} Subjects
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground">
                                                        {cls.subjects.reduce((acc, s) => acc + s.chapters.length, 0)} chapters
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {/* Class actions if needed */}
                                                </TableCell>
                                            </TableRow>

                                            {/* Subjects under Class */}
                                            {expandedClasses[cls.id] && cls.subjects.map(subj => (
                                                <React.Fragment key={subj.id}>
                                                    {/* Subject Row */}
                                                    <TableRow className="bg-purple-50/20 dark:bg-purple-900/5 hover:bg-purple-100/30 dark:hover:bg-purple-900/10 border-b border-purple-100/30 dark:border-purple-900/10">
                                                        <TableCell className="py-2">
                                                            <div className="flex items-center gap-2 cursor-pointer select-none pl-16" onClick={() => toggleSubject(subj.id)}>
                                                                <div className={`p-1 rounded-md transition-colors ${expandedSubjects[subj.id] ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-500'}`}>
                                                                    {expandedSubjects[subj.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                                </div>
                                                                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                                                                    <BookOpen className="h-3 w-3 text-purple-600" />
                                                                </div>
                                                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{subj.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="bg-white dark:bg-gray-900 text-purple-600 border-purple-200 text-[10px]">
                                                                {subj.chapters.length} Chapters
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-xs text-muted-foreground">
                                                                {subj.chapters.reduce((acc, c) => acc + c.topics.length, 0)} topics
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">
                                                                        <Plus className="mr-1 h-3 w-3" /> Chapter
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[450px]">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="font-heading">Add Chapter to {subj.name}</DialogTitle>
                                                                        <DialogDescription>Create a new chapter for this subject.</DialogDescription>
                                                                    </DialogHeader>
                                                                    <form action={async (formData) => { await createChapter(formData); }} className="space-y-4 pt-4">
                                                                        <input type="hidden" name="subjectId" value={subj.id} />
                                                                        <div className="grid gap-2">
                                                                            <Label className="text-xs font-bold">Chapter Name <span className="text-red-500">*</span></Label>
                                                                            <Input name="name" placeholder="e.g. Linear Equations" required />
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button type="submit" className="w-full font-bold">Add Chapter</Button>
                                                                        </DialogFooter>
                                                                    </form>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Chapters under Subject */}
                                                    {expandedSubjects[subj.id] && subj.chapters.map(chapter => (
                                                        <React.Fragment key={chapter.id}>
                                                            {/* Chapter Row */}
                                                            <TableRow className="bg-amber-50/20 dark:bg-amber-900/5 hover:bg-amber-100/30 dark:hover:bg-amber-900/10 border-b border-amber-100/20 dark:border-amber-900/10">
                                                                <TableCell className="py-2">
                                                                    <div className="flex items-center gap-2 cursor-pointer select-none pl-24" onClick={() => toggleChapter(chapter.id)}>
                                                                        <div className={`p-1 rounded-md transition-colors ${expandedChapters[chapter.id] ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-500'}`}>
                                                                            {expandedChapters[chapter.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                                        </div>
                                                                        <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded">
                                                                            <FolderOpen className="h-3 w-3 text-amber-600" />
                                                                        </div>
                                                                        <span className="text-sm text-gray-600 dark:text-gray-400">{chapter.name}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="bg-white dark:bg-gray-900 text-amber-600 border-amber-200 text-[10px]">
                                                                        {chapter.topics.length} Topics
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell></TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:bg-blue-50">
                                                                                    <Edit2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="sm:max-w-[400px]">
                                                                                <DialogHeader><DialogTitle>Edit Chapter</DialogTitle></DialogHeader>
                                                                                <form action={async (formData) => { await updateChapter(formData); }} className="space-y-4 pt-4">
                                                                                    <input type="hidden" name="id" value={chapter.id} />
                                                                                    <div className="grid gap-2">
                                                                                        <Label className="font-bold">Chapter Name</Label>
                                                                                        <Input name="name" defaultValue={chapter.name} required />
                                                                                    </div>
                                                                                    <DialogFooter><Button type="submit" className="w-full">Update</Button></DialogFooter>
                                                                                </form>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                        <DeleteConfirm onDelete={() => deleteChapter(chapter.id)} />
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">
                                                                                    <Plus className="mr-1 h-3 w-3" /> Topic
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="sm:max-w-[500px]">
                                                                                <DialogHeader>
                                                                                    <DialogTitle className="font-heading">Add Topic to {chapter.name}</DialogTitle>
                                                                                    <DialogDescription>Create a new topic with an optional description.</DialogDescription>
                                                                                </DialogHeader>
                                                                                <form action={async (formData) => { await createTopic(formData); }} className="space-y-4 pt-4">
                                                                                    <input type="hidden" name="chapterId" value={chapter.id} />
                                                                                    <div className="grid gap-2">
                                                                                        <Label className="text-xs font-bold">Topic Name <span className="text-red-500">*</span></Label>
                                                                                        <Input name="name" placeholder="e.g. Solving Linear Equations" required />
                                                                                    </div>
                                                                                    <div className="grid gap-2">
                                                                                        <Label className="text-xs font-bold">Description</Label>
                                                                                        <Textarea name="description" placeholder="Explain the scope of this topic..." rows={3} />
                                                                                        <p className="text-[10px] text-muted-foreground">Optional. Helps understand the topic scope.</p>
                                                                                    </div>
                                                                                    <DialogFooter>
                                                                                        <Button type="submit" className="w-full font-bold">Add Topic</Button>
                                                                                    </DialogFooter>
                                                                                </form>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>

                                                            {/* Topics under Chapter */}
                                                            {expandedChapters[chapter.id] && chapter.topics.map(topic => (
                                                                <TableRow key={topic.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-b border-gray-50 dark:border-gray-800">
                                                                    <TableCell className="py-2">
                                                                        <div className="pl-32 flex items-start gap-2">
                                                                            <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                                            <div>
                                                                                <span className="text-sm text-gray-700 dark:text-gray-300">{topic.name}</span>
                                                                                {topic.description && (
                                                                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{topic.description}</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {topic._count.resources > 0 && (
                                                                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 text-[10px]">
                                                                                <LinkIcon className="h-2.5 w-2.5 mr-1" />
                                                                                {topic._count.resources} Resources
                                                                            </Badge>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell></TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex items-center justify-end gap-1">
                                                                            <Dialog>
                                                                                <DialogTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:bg-blue-50">
                                                                                        <Edit2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </DialogTrigger>
                                                                                <DialogContent className="sm:max-w-[500px]">
                                                                                    <DialogHeader><DialogTitle>Edit Topic</DialogTitle></DialogHeader>
                                                                                    <form action={async (formData) => { await updateTopic(formData); }} className="space-y-4 pt-4">
                                                                                        <input type="hidden" name="id" value={topic.id} />
                                                                                        <div className="grid gap-2">
                                                                                            <Label className="font-bold">Topic Name</Label>
                                                                                            <Input name="name" defaultValue={topic.name} required />
                                                                                        </div>
                                                                                        <div className="grid gap-2">
                                                                                            <Label className="font-bold">Description</Label>
                                                                                            <Textarea name="description" defaultValue={topic.description || ''} rows={3} />
                                                                                        </div>
                                                                                        <DialogFooter><Button type="submit" className="w-full">Update</Button></DialogFooter>
                                                                                    </form>
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                            <DeleteConfirm onDelete={() => deleteTopic(topic.id)} />
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
