import { db } from '@/lib/db';
import { createBoard, updateBoard, deleteBoard } from '@/lib/actions/board';
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
import { DeleteConfirm } from '@/components/admin/delete-confirm';

export default async function BoardsPage() {
    const boards = await db.board.findMany({
        include: { _count: { select: { classes: true } } }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Board</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Board</DialogTitle>
                            <DialogDescription>
                                Create a new educational board (e.g., CBSE, ICSE).
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server';
                            await createBoard(formData);
                        }}>
                            <div className="grid gap-4 py-4">
                                <Input id="name" name="name" placeholder="Board Name" required />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Board</Button>
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
                            <TableHead>Classes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {boards.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    No boards found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                        {boards.map((board) => (
                            <TableRow key={board.id}>
                                <TableCell className="font-medium">{board.name}</TableCell>
                                <TableCell>{board._count.classes} Classes</TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4 text-blue-500" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Edit Board</DialogTitle>
                                            </DialogHeader>
                                            <form action={async (formData) => {
                                                'use server';
                                                await updateBoard(formData);
                                            }}>
                                                <input type="hidden" name="id" value={board.id} />
                                                <div className="grid gap-4 py-4">
                                                    <Input name="name" defaultValue={board.name} required />
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit">Update</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <DeleteConfirm onDelete={async () => {
                                        'use server';
                                        return await deleteBoard(board.id);
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
