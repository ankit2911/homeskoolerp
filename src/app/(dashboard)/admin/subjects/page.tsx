import { db } from '@/lib/db';
import { createSubject, updateSubject, deleteSubject } from '@/lib/actions/subject';
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
import { Plus, Edit2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DeleteConfirm } from '@/components/admin/delete-confirm';

export default async function SubjectsPage() {
    const subjects = await db.subject.findMany({
        include: {
            class: {
                include: { board: true }
            }
        }
    });

    const classes = await db.class.findMany({
        include: { board: true }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Subject</DialogTitle>
                            <DialogDescription>
                                Create a subject and map it to a class.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server';
                            await createSubject(formData);
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Class</Label>
                                    <Select name="classId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name} {c.section ? `(${c.section})` : ''} - {c.board.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Subject Name</Label>
                                    <Input id="name" name="name" placeholder="e.g. Mathematics" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Subject</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-white dark:bg-black/40">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Class (Section)</TableHead>
                            <TableHead>Board</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subjects.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No subjects found.
                                </TableCell>
                            </TableRow>
                        )}
                        {subjects.map((sub) => (
                            <TableRow key={sub.id}>
                                <TableCell className="font-medium">{sub.name}</TableCell>
                                <TableCell>{sub.class.name} {sub.class.section ? `(${sub.class.section})` : ''}</TableCell>
                                <TableCell>{sub.class.board.name}</TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4 text-blue-500" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Edit Subject</DialogTitle>
                                            </DialogHeader>
                                            <form action={async (formData) => {
                                                'use server';
                                                await updateSubject(formData);
                                            }}>
                                                <input type="hidden" name="id" value={sub.id} />
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Class</Label>
                                                        <Select name="classId" defaultValue={sub.classId} required>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Class" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {classes.map(c => (
                                                                    <SelectItem key={c.id} value={c.id}>
                                                                        {c.name} {c.section ? `(${c.section})` : ''} - {c.board.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Subject Name</Label>
                                                        <Input name="name" defaultValue={sub.name} required />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit">Update</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <DeleteConfirm onDelete={async () => {
                                        'use server';
                                        return await deleteSubject(sub.id);
                                    }} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
