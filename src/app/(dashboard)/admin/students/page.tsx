import { db } from '@/lib/db';
import { createStudent, updateStudent, deleteStudent } from '@/lib/actions/student';
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

export default async function StudentsPage() {
    const students = await db.user.findMany({
        where: { role: 'STUDENT' },
        include: {
            studentProfile: {
                include: { class: { include: { board: true } } }
            }
        }
    });

    const classes = await db.class.findMany({
        include: { board: true }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                            <DialogDescription>
                                Create a student and assign them to a class.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server';
                            await createStudent(formData);
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Name</Label>
                                    <Input id="name" name="name" placeholder="Alice Smith" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input id="email" name="email" type="email" placeholder="alice@school.com" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Password</Label>
                                    <Input id="password" name="password" type="password" required />
                                </div>
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
                                    <Label>Parent Phone</Label>
                                    <Input id="parentPhone" name="parentPhone" placeholder="+91..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Student</Button>
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
                            <TableHead>Email</TableHead>
                            <TableHead>Class (Section)</TableHead>
                            <TableHead>Board</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No students found.
                                </TableCell>
                            </TableRow>
                        )}
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>{student.studentProfile?.class?.name} {student.studentProfile?.class?.section ? `(${student.studentProfile?.class?.section})` : ''}</TableCell>
                                <TableCell>{student.studentProfile?.class?.board?.name || '-'}</TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4 text-blue-500" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Edit Student</DialogTitle>
                                            </DialogHeader>
                                            <form action={async (formData) => {
                                                'use server';
                                                await updateStudent(formData);
                                            }}>
                                                <input type="hidden" name="id" value={student.id} />
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Name</Label>
                                                        <Input name="name" defaultValue={student.name || ''} required />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Email</Label>
                                                        <Input name="email" type="email" defaultValue={student.email} required />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Class</Label>
                                                        <Select name="classId" defaultValue={student.studentProfile?.classId || ''} required>
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
                                                        <Label>Parent Phone</Label>
                                                        <Input name="parentPhone" defaultValue={student.studentProfile?.parentPhone || ''} />
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
                                        return await deleteStudent(student.id);
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
