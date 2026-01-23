import { db } from '@/lib/db';
import { updateStudent, deleteStudent } from '@/lib/actions/student';
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
    Search, Edit2,
    Filter,
    UserCircle,
    RotateCcw,
    Users,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddStudentForm } from '@/components/admin/student-form-client';

export default async function StudentsPage() {
    const students = await db.user.findMany({
        where: { role: 'STUDENT' },
        include: {
            studentProfile: {
                include: {
                    class: { include: { board: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const classesData = await db.class.findMany({
        include: {
            board: true,
            subjects: {
                include: { subjectMaster: true }
            }
        }
    });

    // Serialize for client component
    const classes = JSON.parse(JSON.stringify(classesData));


    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Student Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage student enrollment, class assignments, and academic records</p>
                </div>
                <AddStudentForm classes={classes} />
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
                                    <Badge className={`border-0 font-bold text-[10px] uppercase tracking-wide ${student.studentProfile?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50' :
                                        student.studentProfile?.status === 'INACTIVE' ? 'bg-gray-50 text-gray-600 hover:bg-gray-50' :
                                            student.studentProfile?.status === 'SUSPENDED' ? 'bg-red-50 text-red-600 hover:bg-red-50' :
                                                'bg-emerald-50 text-emerald-600 hover:bg-emerald-50'
                                        }`}>
                                        {student.studentProfile?.status || 'ACTIVE'}
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
                                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                                                <DialogHeader>
                                                    <DialogTitle className="font-heading text-xl">Edit Student</DialogTitle>
                                                    <DialogDescription>
                                                        Update student profile and enrollment details.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                                                    <form action={async (formData) => {
                                                        'use server';
                                                        await updateStudent(formData);
                                                    }} id="edit-student-form" className="space-y-6 py-4">
                                                        <input type="hidden" name="id" value={student.id} />
                                                        {/* Personal Information Section */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 border-b pb-1">
                                                                <UserCircle className="h-4 w-4 text-primary" />
                                                                <h3 className="font-heading font-bold text-sm">Personal Information</h3>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground -mt-3">Update basic contact and identification details.</p>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">First Name <span className="text-red-500">*</span></Label>
                                                                    <Input name="firstName" defaultValue={student.studentProfile?.firstName || ''} required />
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Last Name</Label>
                                                                    <Input name="lastName" defaultValue={student.studentProfile?.lastName || ''} />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Email <span className="text-red-500">*</span></Label>
                                                                    <Input name="email" type="email" defaultValue={student.email} required />
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Roll Number</Label>
                                                                    <Input name="rollNumber" defaultValue={student.studentProfile?.rollNumber || ''} />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Date of Birth</Label>
                                                                    <Input name="dateOfBirth" type="date" defaultValue={student.studentProfile?.dateOfBirth ? new Date(student.studentProfile.dateOfBirth).toISOString().split('T')[0] : ''} />
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Gender</Label>
                                                                    <Select name="gender" defaultValue={student.studentProfile?.gender || ''}>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select gender" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Male">Male</SelectItem>
                                                                            <SelectItem value="Female">Female</SelectItem>
                                                                            <SelectItem value="Other">Other</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Parent/Guardian Information Section */}
                                                        <div className="space-y-4 pt-2">
                                                            <div className="flex items-center gap-2 border-b pb-1">
                                                                <Users className="h-4 w-4 text-primary" />
                                                                <h3 className="font-heading font-bold text-sm">Parent/Guardian Information</h3>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground -mt-3">Update details of parents or guardians.</p>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Father&apos;s Name</Label>
                                                                    <Input name="fatherName" defaultValue={student.studentProfile?.fatherName || ''} />
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Mother&apos;s Name</Label>
                                                                    <Input name="motherName" defaultValue={student.studentProfile?.motherName || ''} />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Parent Phone</Label>
                                                                    <Input name="parentPhone" defaultValue={student.studentProfile?.parentPhone || ''} />
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Emergency Contact</Label>
                                                                    <Input name="emergencyContact" defaultValue={student.studentProfile?.emergencyContact || ''} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Student Contact Details Section */}
                                                        <div className="space-y-4 pt-2">
                                                            <div className="flex items-center gap-2 border-b pb-1">
                                                                <UserCircle className="h-4 w-4 text-primary" />
                                                                <h3 className="font-heading font-bold text-sm">Student Contact Details</h3>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground -mt-3">Update additional contact information.</p>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Student Email</Label>
                                                                    <Input name="studentEmail" type="email" defaultValue={student.studentProfile?.studentEmail || ''} />
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Student Phone</Label>
                                                                    <Input name="studentPhone" defaultValue={student.studentProfile?.studentPhone || ''} />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Alternate Email</Label>
                                                                    <Input name="alternateEmail" type="email" defaultValue={student.studentProfile?.alternateEmail || ''} />
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Alternate Phone</Label>
                                                                    <Input name="alternatePhone" defaultValue={student.studentProfile?.alternatePhone || ''} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Academic Details Section */}
                                                        <div className="space-y-4 pt-2">
                                                            <div className="flex items-center gap-2 border-b pb-1">
                                                                <Filter className="h-4 w-4 text-primary" />
                                                                <h3 className="font-heading font-bold text-sm">Academic Details</h3>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground -mt-3">Update class and academic year.</p>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Class <span className="text-red-500">*</span></Label>
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
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Academic Year</Label>
                                                                    <Select name="academicYear" defaultValue={student.studentProfile?.academicYear || '2025-26'}>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select Year" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="2025-26">2025-26</SelectItem>
                                                                            <SelectItem value="2024-25">2024-25</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Other Details Section */}
                                                        <div className="space-y-4 pt-2">
                                                            <div className="flex items-center gap-2 border-b pb-1">
                                                                <Filter className="h-4 w-4 text-primary" />
                                                                <h3 className="font-heading font-bold text-sm">Other Details</h3>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground -mt-3">Update background and address information.</p>

                                                            <div className="grid gap-1.5">
                                                                <Label className="text-xs font-bold">Address</Label>
                                                                <Input name="address" defaultValue={student.studentProfile?.address || ''} />
                                                            </div>

                                                            <div className="grid gap-1.5">
                                                                <Label className="text-xs font-bold">Previous School</Label>
                                                                <Input name="previousSchool" defaultValue={student.studentProfile?.previousSchool || ''} />
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Status</Label>
                                                                    <Select name="status" defaultValue={student.studentProfile?.status || 'ACTIVE'}>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select Status" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                                                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Admin Comments</Label>
                                                                    <Input name="adminComments" defaultValue={student.studentProfile?.adminComments || ''} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </ScrollArea>
                                                <DialogFooter className="pt-4">
                                                    <Button type="submit" form="edit-student-form" className="w-full font-bold">Update Student</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <DeleteConfirm onDelete={async () => {
                                            'use server';
                                            return await deleteStudent(student.id);
                                        }} />
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
