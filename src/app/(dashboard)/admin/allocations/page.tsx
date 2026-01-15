import { db } from '@/lib/db';
import { createAllocation, deleteAllocation } from '@/lib/actions/allocation';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default async function AllocationsPage() {
    const allocations = await db.teacherAllocation.findMany({
        include: {
            teacher: { include: { user: true } },
            class: { include: { board: true } },
            subject: true
        }
    });

    const teachers = await db.user.findMany({
        where: { role: 'TEACHER' },
        include: { teacherProfile: true }
    });
    const subjects = await db.subject.findMany({
        include: { class: { include: { board: true } } }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Teacher Allocations</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Assign Teacher</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Assign Teacher to Subject</DialogTitle>
                            <DialogDescription>
                                Map a teacher to a specific subject in a class.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server';
                            // We need to split the combined value from the Subject Select
                            const combined = formData.get('subjectCombined') as string;
                            if (combined) {
                                const [subjectId, classId] = combined.split('|');
                                formData.set('subjectId', subjectId);
                                formData.set('classId', classId);
                            }
                            await createAllocation(formData);
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Teacher</Label>
                                    <Select name="teacherId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teachers.map(t => (
                                                <SelectItem key={t.teacherProfile?.id || t.id} value={t.teacherProfile?.id || ''}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Subject (Class)</Label>
                                    <Select name="subjectCombined" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(s => (
                                                <SelectItem key={s.id} value={`${s.id}|${s.classId}`}>
                                                    {s.name} - {s.class.name} ({s.class.board.name})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Assign</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-white dark:bg-black/40">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Board</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allocations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No allocations found.
                                </TableCell>
                            </TableRow>
                        )}
                        {allocations.map((alloc) => (
                            <TableRow key={alloc.id}>
                                <TableCell className="font-medium">{alloc.teacher.user.name}</TableCell>
                                <TableCell>{alloc.subject.name}</TableCell>
                                <TableCell>{alloc.class.name}</TableCell>
                                <TableCell>{alloc.class.board.name}</TableCell>
                                <TableCell className="text-right">
                                    <form action={async () => {
                                        'use server';
                                        await deleteAllocation(alloc.id);
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
