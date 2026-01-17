import { db } from '@/lib/db';
import { createTeacher, updateTeacher, deleteTeacher } from '@/lib/actions/teacher';
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
import { Plus, Edit2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DeleteConfirm } from '@/components/admin/delete-confirm';

export default async function TeachersPage() {
    const teachers = await db.user.findMany({
        where: { role: 'TEACHER' },
        include: { teacherProfile: true }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Teacher</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Teacher</DialogTitle>
                            <DialogDescription>
                                Create a new teacher account.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server';
                            await createTeacher(formData);
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Name</Label>
                                    <Input id="name" name="name" placeholder="John Doe" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input id="email" name="email" type="email" placeholder="john@school.com" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Password</Label>
                                    <Input id="password" name="password" type="password" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Teacher</Button>
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
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    No teachers found.
                                </TableCell>
                            </TableRow>
                        )}
                        {teachers.map((teacher) => (
                            <TableRow key={teacher.id}>
                                <TableCell className="font-medium">{teacher.name}</TableCell>
                                <TableCell>{teacher.email}</TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4 text-blue-500" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Edit Teacher</DialogTitle>
                                            </DialogHeader>
                                            <form action={async (formData) => {
                                                'use server';
                                                await updateTeacher(formData);
                                            }}>
                                                <input type="hidden" name="id" value={teacher.id} />
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Name</Label>
                                                        <Input name="name" defaultValue={teacher.name || ''} required />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Email</Label>
                                                        <Input name="email" type="email" defaultValue={teacher.email} required />
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
                                        return await deleteTeacher(teacher.id);
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
