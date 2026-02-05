import { db } from '@/lib/db';
import { updateTeacher, deleteTeacher } from '@/lib/actions/teacher';
import { type User, type TeacherProfile } from '@prisma/client';
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
import { Edit2, Phone, Mail, GraduationCap as GradIcon, Filter, Plus, UserCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { TeacherFilters } from '@/components/admin/teacher-filters';
import { AddTeacherForm } from '@/components/admin/teacher-form-client';
import { EditTeacherForm } from '@/components/admin/edit-teacher-form';


interface PageProps {
    searchParams: Promise<{
        qualification?: string;
        specialization?: string;
        experience?: string;
    }>;
}

export const dynamic = 'force-dynamic';

export default async function TeachersPage({ searchParams }: PageProps) {
    const { qualification, specialization, experience } = await searchParams;

    const where: {
        role: string;
        teacherProfile?: {
            qualification?: string;
            specialization?: { contains: string };
            experience?: { gte: number };
        };
    } = { role: 'TEACHER' };

    if (qualification || specialization || experience) {
        where.teacherProfile = {};
        if (qualification) {
            where.teacherProfile.qualification = qualification;
        }
        if (specialization) {
            where.teacherProfile.specialization = {
                contains: specialization
            };
        }
        if (experience) {
            where.teacherProfile.experience = {
                gte: parseInt(experience)
            };
        }
    }

    const teachers = await db.user.findMany({
        where,
        include: { teacherProfile: true }
    }) as (User & { teacherProfile: TeacherProfile | null })[];

    const subjectMastersData = await db.subjectMaster.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            code: true,
            category: true,
            isActive: true
        },
        orderBy: { name: 'asc' }
    });

    // Serialize for client component
    const subjectMasters = JSON.parse(JSON.stringify(subjectMastersData));

    const classGroups = ['Kids', 'Junior', 'Middle', 'High'];


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
                <AddTeacherForm subjectMasters={subjectMasters} />
            </div>

            <TeacherFilters />

            <div className="rounded-xl border bg-white dark:bg-black/40 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 border-b">
                            <TableHead className="w-[180px] font-bold py-4">Teacher</TableHead>
                            <TableHead className="font-bold py-4">Qualification</TableHead>
                            <TableHead className="font-bold py-4">Phone Number</TableHead>
                            <TableHead className="font-bold py-4">Email Address</TableHead>
                            <TableHead className="font-bold py-4">Specialization</TableHead>
                            <TableHead className="font-bold py-4">Exp.</TableHead>
                            <TableHead className="text-right font-bold w-[100px] py-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground bg-muted/5">
                                    <div className="flex flex-col items-center gap-2">
                                        <Filter className="h-8 w-8 opacity-20" />
                                        <p className="font-medium">No teachers match your filters.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {teachers.map((teacher) => (
                            <TableRow key={teacher.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <span className="font-bold text-foreground line-clamp-1">{teacher.name}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                            {teacher.teacherProfile?.qualification || 'Not specified'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-xs text-foreground font-bold">
                                        <Phone className="h-3.5 w-3.5 text-primary/70" />
                                        {teacher.teacherProfile?.phoneNumber ? (
                                            <span className="tracking-tighter">
                                                <span className="text-[10px] bg-muted px-1 py-0.5 rounded mr-1 text-muted-foreground">{teacher.teacherProfile.phoneCode}</span>
                                                {teacher.teacherProfile.phoneNumber}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground italic">N/A</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5 text-primary/50" />
                                        <span className="truncate max-w-[150px]">{teacher.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {teacher.teacherProfile?.specialization?.split(',').map((s: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-[10px] h-5 truncate max-w-[100px] bg-blue-50 text-blue-700 border-blue-100">
                                                {s.trim()}
                                            </Badge>
                                        )) || <span className="text-xs text-muted-foreground italic">None</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-bold text-foreground">
                                            {teacher.teacherProfile?.experience || 0}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">y</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <EditTeacherForm
                                            teacher={JSON.parse(JSON.stringify(teacher))}
                                            subjectMasters={subjectMasters}
                                        />
                                        <DeleteConfirm onDelete={async () => {
                                            'use server';
                                            return await deleteTeacher(teacher.id);
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
