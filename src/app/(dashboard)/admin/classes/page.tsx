import { db } from '@/lib/db';
import { createClass, updateClass, deleteClass } from '@/lib/actions/class';
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

export default async function ClassesPage() {
    const classes = await db.class.findMany({
        include: {
            board: true,
            _count: { select: { students: true, subjects: true } }
        }
    });

    const boards = await db.board.findMany();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Class</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Class</DialogTitle>
                            <DialogDescription>
                                Create a class and assign it to a board.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server';
                            await createClass(formData);
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Board</Label>
                                    <Select name="boardId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Board" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {boards.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Class Name</Label>
                                    <Input id="name" name="name" placeholder="e.g. Class 10" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Section</Label>
                                    <Input id="section" name="section" placeholder="e.g. A (Optional)" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Class</Button>
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
                            <TableHead>Section</TableHead>
                            <TableHead>Board</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No classes found.
                                </TableCell>
                            </TableRow>
                        )}
                        {classes.map((cls) => (
                            <TableRow key={cls.id}>
                                <TableCell className="font-medium">{cls.name}</TableCell>
                                <TableCell>{cls.section || '-'}</TableCell>
                                <TableCell>{cls.board.name}</TableCell>
                                <TableCell>{cls._count.students}</TableCell>
                                <TableCell>{cls._count.subjects}</TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4 text-blue-500" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Edit Class</DialogTitle>
                                            </DialogHeader>
                                            <form action={async (formData) => {
                                                'use server';
                                                await updateClass(formData);
                                            }}>
                                                <input type="hidden" name="id" value={cls.id} />
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Board</Label>
                                                        <Select name="boardId" defaultValue={cls.boardId} required>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Board" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {boards.map(b => (
                                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Class Name</Label>
                                                        <Input name="name" defaultValue={cls.name} required />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Section</Label>
                                                        <Input name="section" defaultValue={cls.section || ''} />
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
                                        return await deleteClass(cls.id);
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
