'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
import { Edit2, Plus, GraduationCap, UserCircle } from 'lucide-react';
import { updateTeacher } from '@/lib/actions/teacher';

type SubjectMaster = {
    id: string;
    name: string;
    code: string;
    category: string | null;
};

type Teacher = {
    id: string;
    email: string;
    teacherProfile: {
        firstName: string | null;
        lastName: string | null;
        phoneCode: string | null;
        phoneNumber: string | null;
        qualification: string | null;
        experience: number | null;
        specialization: string | null;
        classes: string | null;
        licenseNumber: string | null;
        previousInstitutions: string | null;
    } | null;
};

type EditTeacherFormProps = {
    teacher: Teacher;
    subjectMasters: SubjectMaster[];
};

export function EditTeacherForm({ teacher, subjectMasters }: EditTeacherFormProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const classGroups = ['Kids', 'Junior', 'Middle', 'High'];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                        await updateTeacher(formData);
                        setIsOpen(false);
                        router.refresh();
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
                                <GraduationCap className="h-4 w-4 text-primary" />
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
                                    {subjectMasters.map((sm) => (
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
    );
}
