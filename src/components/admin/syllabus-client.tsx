'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit2, FileText, Book } from 'lucide-react';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import {
    createChapter, updateChapter, deleteChapter,
    createTopic, updateTopic, deleteTopic
} from '@/lib/actions/curriculum';

type Topic = { id: string; name: string; chapterId: string };
type Chapter = { id: string; name: string; subjectId: string; topics: Topic[] };
type Subject = {
    id: string;
    name: string;
    class: { name: string; section: string | null; board: { name: string } };
    chapters: Chapter[];
};

export function SyllabusClient({ subjects }: { subjects: Subject[] }) {
    // We can use state to manage dialog open states if needed for better UX, 
    // but distinct dialogs for each item work fine for now.

    const handleStopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="space-y-4">
            {subjects.length === 0 && <div className="text-muted-foreground">No subjects found. Please add subjects first.</div>}
            {subjects.map((subject) => (
                <div key={subject.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center">
                                <Book className="mr-2 h-5 w-5 text-blue-500" />
                                {subject.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {subject.class.name} {subject.class.section ? `(${subject.class.section})` : ''} • {subject.class.board.name}
                            </p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Chapter</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add Chapter to {subject.name}</DialogTitle>
                                </DialogHeader>
                                <form action={async (formData) => {
                                    await createChapter(formData);
                                }}>
                                    <input type="hidden" name="subjectId" value={subject.id} />
                                    <div className="grid gap-4 py-4">
                                        <Input name="name" placeholder="Chapter Name (e.g. Algebra)" required />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Add Chapter</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        {subject.chapters.map((chapter) => (
                            <AccordionItem key={chapter.id} value={chapter.id}>
                                <div className="flex items-center justify-between w-full px-2 py-2 hover:bg-muted/50 rounded-md">
                                    <AccordionTrigger className="hover:no-underline py-2 px-2 flex-1">
                                        <span className="font-medium text-left">{chapter.name} ({chapter.topics.length} topics)</span>
                                    </AccordionTrigger>
                                    <div className="flex gap-2 items-center pr-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8"><Edit2 className="h-4 w-4" /></Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Edit Chapter</DialogTitle>
                                                </DialogHeader>
                                                <form action={async (formData) => {
                                                    await updateChapter(formData);
                                                }}>
                                                    <input type="hidden" name="id" value={chapter.id} />
                                                    <div className="grid gap-4 py-4">
                                                        <Input name="name" defaultValue={chapter.name} required />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit">Update</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                        <DeleteConfirm onDelete={async () => {
                                            return await deleteChapter(chapter.id);
                                        }} />
                                    </div>
                                </div>
                                <AccordionContent className="pl-4 border-l-2 ml-2">
                                    <div className="space-y-2 pt-2">
                                        {chapter.topics.map((topic) => (
                                            <div key={topic.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group">
                                                <div className="flex items-center">
                                                    <FileText className="mr-2 h-4 w-4 text-gray-500" />
                                                    <span>{topic.name}</span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7"><Edit2 className="h-3 w-3" /></Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[425px]">
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Topic</DialogTitle>
                                                            </DialogHeader>
                                                            <form action={async (formData) => {
                                                                await updateTopic(formData);
                                                            }}>
                                                                <input type="hidden" name="id" value={topic.id} />
                                                                <div className="grid gap-4 py-4">
                                                                    <Input name="name" defaultValue={topic.name} required />
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button type="submit">Update</Button>
                                                                </DialogFooter>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>
                                                    <DeleteConfirm onDelete={async () => {
                                                        return await deleteTopic(topic.id);
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary">
                                                        <Plus className="mr-2 h-4 w-4" /> Add Topic
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px]">
                                                    <DialogHeader>
                                                        <DialogTitle>Add Topic to {chapter.name}</DialogTitle>
                                                    </DialogHeader>
                                                    <form action={async (formData) => {
                                                        await createTopic(formData);
                                                    }}>
                                                        <input type="hidden" name="chapterId" value={chapter.id} />
                                                        <div className="grid gap-4 py-4">
                                                            <Input name="name" placeholder="Topic Name (e.g. Linear Equations)" required />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button type="submit">Add Topic</Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                        {subject.chapters.length === 0 && (
                            <div className="text-sm text-muted-foreground p-4">No chapters yet.</div>
                        )}
                    </Accordion>
                </div>
            ))}
        </div>
    );
}
