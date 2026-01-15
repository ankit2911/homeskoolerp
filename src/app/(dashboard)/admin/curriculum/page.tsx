import { db } from '@/lib/db';
import { createResource, deleteResource } from '@/lib/actions/curriculum';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Trash, FileText, Video, Link as LinkIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';

function getIcon(type: string) {
    switch (type) {
        case 'PDF': return <FileText className="h-4 w-4" />;
        case 'VIDEO': return <Video className="h-4 w-4" />;
        default: return <LinkIcon className="h-4 w-4" />;
    }
}

export default async function CurriculumPage() {
    const resources = await db.resource.findMany({
        include: { class: { include: { board: true } }, subject: true },
        orderBy: { createdAt: 'desc' }
    });

    const classes = await db.class.findMany({
        include: { board: true, subjects: true }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Curriculum & Resources</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Resource</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Upload Study Material</DialogTitle>
                            <DialogDescription>
                                Share documents, videos, or links with students.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server';
                            const combined = formData.get('subjectCombined') as string;
                            if (combined) {
                                const [subjectId, classId] = combined.split('|');
                                formData.set('subjectId', subjectId);
                                formData.set('classId', classId);
                            }
                            await createResource(formData);
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input name="title" placeholder="e.g. Chapter 1 Notes" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Class - Subject</Label>
                                    <Select name="subjectCombined" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class & Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.flatMap(c => c.subjects.map(s => (
                                                <SelectItem key={`${c.id}-${s.id}`} value={`${s.id}|${c.id}`}>
                                                    {c.name} ({c.board.name}) - {s.name}
                                                </SelectItem>
                                            )))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select name="type" required>
                                        <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PDF">PDF Document</SelectItem>
                                            <SelectItem value="VIDEO">Video URL</SelectItem>
                                            <SelectItem value="LINK">External Link</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>URL / Link</Label>
                                    <Input name="url" placeholder="https://..." required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Upload</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-white dark:bg-black/40">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {resources.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No resources uploaded.
                                </TableCell>
                            </TableRow>
                        )}
                        {resources.map((res) => (
                            <TableRow key={res.id}>
                                <TableCell>{getIcon(res.type)}</TableCell>
                                <TableCell className="font-medium">{res.title}</TableCell>
                                <TableCell>{res.class.name} ({res.class.board.name})</TableCell>
                                <TableCell>{res.subject.name}</TableCell>
                                <TableCell>
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm truncate max-w-[200px] block">
                                        {res.url}
                                    </a>
                                </TableCell>
                                <TableCell className="text-right">
                                    <form action={async () => {
                                        'use server';
                                        await deleteResource(res.id);
                                    }}>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"><Trash className="h-4 w-4" /></Button>
                                    </form>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
