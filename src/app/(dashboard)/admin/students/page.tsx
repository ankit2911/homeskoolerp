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
import {
    Plus, Search, Edit2,
    Filter,
    MoreVertical,
    UserCircle,
    RotateCcw,
    Users,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default async function StudentsPage() {
    const students = await db.user.findMany({
        where: { role: 'STUDENT' },
        include: {
            studentProfile: {
                include: { class: { include: { board: true } } }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const classes = await db.class.findMany({
        include: { board: true }
    });

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Student Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage student enrollment, class assignments, and academic records</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="h-8 px-4 font-bold shadow-sm shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95">
                            <Plus className="mr-2 h-4 w-4" /> Add Student
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Add New Student</DialogTitle>
                            <DialogDescription className="text-base">
                                Create a student and assign them to a class.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server';
                            await createStudent(formData);
                        }} className="space-y-6 pt-4">
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="font-bold">Full Name</Label>
                                        <Input id="name" name="name" placeholder="Alice Smith" required className="h-11" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="font-bold">Roll Number</Label>
                                        <Input id="rollNumber" name="rollNumber" placeholder="2025001" className="h-11" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-bold">Email Address</Label>
                                    <Input id="email" name="email" type="email" placeholder="alice@school.com" required className="h-11" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-bold">Password</Label>
                                    <Input id="password" name="password" type="password" required className="h-11" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="font-bold">Class</Label>
                                        <Select name="classId" required>
                                            <SelectTrigger className="h-11">
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
                                        <Label className="font-bold">Academic Year</Label>
                                        <Select name="year" defaultValue="2025-26">
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="2025-26">2025-26</SelectItem>
                                                <SelectItem value="2024-25">2024-25</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-bold">Parent Phone</Label>
                                    <Input id="parentPhone" name="parentPhone" placeholder="+91 98765 43210" className="h-11" />
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full h-11 font-bold">Enroll Student</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters Section */}
            <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-800/30">
                <CardContent className="p-2 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input placeholder="Search students..." className="pl-9 h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" />
                    </div>
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[120px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
                            <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[110px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select defaultValue="2025">
                        <SelectTrigger className="w-[110px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2025">2025-26</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" className="h-8 text-gray-400 font-bold gap-2 text-xs">
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </Button>
                </CardContent>
            </Card>

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                            <TableHead className="w-12 text-center">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            </TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Student Name</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Roll Number</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Class</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Guardian</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Status</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Last Activity</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-40 text-gray-400 font-medium">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="w-10 h-10 text-gray-200" />
                                        No students found in the database.
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {students.map((student) => (
                            <TableRow key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-b border-gray-50 dark:border-gray-800 transition-colors">
                                <TableCell className="text-center">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-8 h-8 border shadow-sm">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{student.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 dark:text-white leading-tight">{student.name}</span>
                                            <span className="text-xs text-gray-400 font-medium">{student.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-gray-600 dark:text-gray-400">
                                    {/* Mock Roll Number - Static for lint compliance */}
                                    2025{Math.abs(student.name?.charCodeAt(0) || 0).toString().padStart(3, '0')}
                                </TableCell>
                                <TableCell>
                                    <span className="font-bold text-gray-700 dark:text-gray-300">
                                        {student.studentProfile?.class?.name} {student.studentProfile?.class?.section ? `(${student.studentProfile?.class?.section})` : ''}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-700 dark:text-gray-300 text-sm leading-tight">Guardian Name</span>
                                        <span className="text-xs text-gray-400 font-medium">{student.studentProfile?.parentPhone || 'No Phone'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-0 font-bold text-[10px] uppercase tracking-wide">
                                        Active
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm font-medium text-gray-500">
                                    09/01/2026
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-blue-500 hover:bg-blue-50 hover:text-blue-600">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Edit Student</DialogTitle>
                                                </DialogHeader>
                                                <form action={async (formData) => {
                                                    'use server';
                                                    await updateStudent(formData);
                                                }} className="space-y-4">
                                                    <input type="hidden" name="id" value={student.id} />
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
                                                    <DialogFooter>
                                                        <Button type="submit" className="w-full">Update Details</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                        <DeleteConfirm onDelete={async () => {
                                            'use server';
                                            return await deleteStudent(student.id);
                                        }} />
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-400">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
