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

interface PageProps {
    searchParams: Promise<{
        qualification?: string;
        specialization?: string;
        experience?: string;
    }>;
}

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
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                                                <DialogHeader>
                                                    <DialogTitle className="font-heading text-xl">Edit Teacher Profile</DialogTitle>
                                                    <DialogDescription>
                                                        Update the personal and professional details for this teacher.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                                                    <form action={async (formData) => {
                                                        'use server';
                                                        await updateTeacher(formData);
                                                    }} className="space-y-6 py-4">
                                                        <input type="hidden" name="id" value={teacher.id} />

                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 border-b pb-1">
                                                                <Plus className="h-4 w-4 text-primary" />
                                                                <h3 className="font-heading font-bold text-sm">Personal Information</h3>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground -mt-3">Please provide basic contact and identification details.</p>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">First Name <span className="text-red-500">*</span></Label>
                                                                    <Input name="firstName" defaultValue={teacher.teacherProfile?.firstName || ''} required />
                                                                    <p className="text-[10px] text-muted-foreground italic">Teacher&apos;s legal first name.</p>
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Last Name</Label>
                                                                    <Input name="lastName" defaultValue={teacher.teacherProfile?.lastName || ''} />
                                                                    <p className="text-[10px] text-muted-foreground italic">Optional surname.</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Email <span className="text-red-500">*</span></Label>
                                                                    <Input name="email" type="email" defaultValue={teacher.email} required placeholder="e.g. john@school.com" />
                                                                    <p className="text-[10px] text-muted-foreground italic">Used for login and notifications.</p>
                                                                </div>
                                                                <div className="grid gap-1.5 opacity-50 select-none">
                                                                    <Label className="text-xs font-bold">Password</Label>
                                                                    <Input disabled placeholder="********" className="bg-muted/30 cursor-not-allowed" />
                                                                    <p className="text-[10px] text-muted-foreground italic">Password cannot be changed here.</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div className="grid gap-1.5 col-span-1">
                                                                    <Label className="text-xs font-bold">Code <span className="text-red-500">*</span></Label>
                                                                    <Select name="phoneCode" defaultValue={teacher.teacherProfile?.phoneCode || '+91'}>
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="+91">+91 (IN)</SelectItem>
                                                                            <SelectItem value="+1">+1 (US)</SelectItem>
                                                                            <SelectItem value="+44">+44 (UK)</SelectItem>
                                                                            <SelectItem value="+971">+971 (UAE)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="grid gap-1.5 col-span-2">
                                                                    <Label className="text-xs font-bold">Phone Number <span className="text-red-500">*</span></Label>
                                                                    <Input name="phoneNumber" defaultValue={teacher.teacherProfile?.phoneNumber || ''} placeholder="e.g. 9876543210" required />
                                                                    <p className="text-[10px] text-muted-foreground italic">Primary contact number.</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 pt-2">
                                                            <div className="flex items-center gap-2 border-b pb-1">
                                                                <GradIcon className="h-4 w-4 text-primary" />
                                                                <h3 className="font-heading font-bold text-sm">Professional Information</h3>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground -mt-3">Specify qualifications and teaching background.</p>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Highest Qualification <span className="text-red-500">*</span></Label>
                                                                    <Select name="qualification" defaultValue={teacher.teacherProfile?.qualification || ''}>
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Bachelors">Bachelors Degree</SelectItem>
                                                                            <SelectItem value="Masters">Masters Degree</SelectItem>
                                                                            <SelectItem value="PhD">PhD / Doctorate</SelectItem>
                                                                            <SelectItem value="Diploma">Diploma</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <p className="text-[10px] text-muted-foreground italic">Most recent degree.</p>
                                                                </div>
                                                                <div className="grid gap-1.5">
                                                                    <Label className="text-xs font-bold">Years of Experience <span className="text-red-500">*</span></Label>
                                                                    <Input name="experience" type="number" defaultValue={teacher.teacherProfile?.experience || 0} placeholder="e.g. 5" required />
                                                                    <p className="text-[10px] text-muted-foreground italic">Total years in education.</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid gap-1.5">
                                                                <Label className="text-xs font-bold">Subject Specialization <span className="text-red-500">*</span></Label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {subjectMasters.length === 0 && (
                                                                        <p className="text-[10px] text-muted-foreground italic">No global subjects defined.</p>
                                                                    )}
                                                                    {subjectMasters.map(sm => (
                                                                        <label key={sm.id} className="flex items-center gap-2 border px-3 py-1.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                                                            <input
                                                                                type="checkbox"
                                                                                name="specialization"
                                                                                value={sm.name}
                                                                                defaultChecked={teacher.teacherProfile?.specialization?.split(', ').includes(sm.name)}
                                                                                className="h-3.5 w-3.5 accent-primary"
                                                                            />
                                                                            <div className="flex flex-col leading-none">
                                                                                <span className="text-xs font-medium">{sm.name}</span>
                                                                                <span className="text-[9px] font-mono text-muted-foreground">{sm.code}</span>
                                                                            </div>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground italic">Select specialized subjects.</p>
                                                            </div>

                                                            <div className="grid gap-1.5">
                                                                <Label className="text-xs font-bold">Classes Specialised <span className="text-red-500">*</span></Label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {classGroups.map(group => (
                                                                        <label key={group} className="flex items-center gap-2 border px-3 py-1.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                                                            <input
                                                                                type="checkbox"
                                                                                name="classes"
                                                                                value={group}
                                                                                defaultChecked={teacher.teacherProfile?.classes?.split(', ').includes(group)}
                                                                                className="h-3.5 w-3.5 accent-primary"
                                                                            />
                                                                            <span className="text-xs font-medium">{group}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground italic">Select all that apply.</p>
                                                            </div>

                                                            <div className="grid gap-1.5">
                                                                <Label className="text-xs font-bold">Teaching License Number</Label>
                                                                <Input name="licenseNumber" defaultValue={teacher.teacherProfile?.licenseNumber || ''} placeholder="e.g. TL-2024-12345" />
                                                                <p className="text-[10px] text-muted-foreground italic">Optional: Enter your professional license ID.</p>
                                                            </div>

                                                            <div className="grid gap-1.5">
                                                                <Label className="text-xs font-bold">Previous Institutions</Label>
                                                                <Textarea name="previousInstitutions" defaultValue={teacher.teacherProfile?.previousInstitutions || ''} className="min-h-[80px] bg-muted/5 border-dashed" />
                                                                <p className="text-[10px] text-muted-foreground italic">Optional: Your most recent teaching positions.</p>
                                                            </div>
                                                        </div>

                                                        <DialogFooter className="pt-4">
                                                            <Button type="submit" className="w-full vibrant py-6 text-base shadow-lg transition-transform active:scale-[0.98]">
                                                                Update Teacher
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
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
