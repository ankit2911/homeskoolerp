'use client';

import React, { useState, useMemo } from 'react';
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
import { Plus, UserCircle, GraduationCap } from 'lucide-react';
import { createTeacher } from '@/lib/actions/teacher';

// Category styling - same as class creation
const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
    primary: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Primary Subjects' },
    secondary: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', label: 'Secondary Subjects' },
    language: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Languages' },
    elective: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Electives' },
    cocurricular: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', label: 'Co-curricular' },
};

type SubjectMaster = {
    id: string;
    name: string;
    code: string;
    category: string | null;
};

type AddTeacherFormProps = {
    subjectMasters: SubjectMaster[];
};

import { useRouter } from 'next/navigation';

export function AddTeacherForm({ subjectMasters }: AddTeacherFormProps) {
    const router = useRouter();
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const classGroups = ['Kids', 'Junior', 'Middle', 'High'];

    // Group subjects by category
    const subjectsByCategory = useMemo(() => {
        const groups: Record<string, SubjectMaster[]> = {};
        subjectMasters.forEach(subject => {
            const category = subject.category || 'primary';
            if (!groups[category]) groups[category] = [];
            groups[category].push(subject);
        });
        return groups;
    }, [subjectMasters]);

    const toggleSubject = (subjectName: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectName)
                ? prev.filter(name => name !== subjectName)
                : [...prev, subjectName]
        );
    };

    const toggleClass = (classGroup: string) => {
        setSelectedClasses(prev =>
            prev.includes(classGroup)
                ? prev.filter(c => c !== classGroup)
                : [...prev, classGroup]
        );
    };

    const selectAllInCategory = (category: string) => {
        const categorySubjectNames = subjectsByCategory[category]?.map(s => s.name) || [];
        const allSelected = categorySubjectNames.every(name => selectedSubjects.includes(name));

        if (allSelected) {
            setSelectedSubjects(prev => prev.filter(name => !categorySubjectNames.includes(name)));
        } else {
            setSelectedSubjects(prev => [...new Set([...prev, ...categorySubjectNames])]);
        }
    };

    const resetForm = () => {
        setSelectedSubjects([]);
        setSelectedClasses([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button className="vibrant"><Plus className="mr-2 h-4 w-4" /> Create Teacher</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-heading text-xl">Add New Teacher</DialogTitle>
                    <DialogDescription>
                        Create a detailed profile for a new teacher.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 overflow-y-auto pr-4" style={{ maxHeight: '60vh' }}>
                    <form action={async (formData) => {
                        // Add selected subjects and classes to form data
                        selectedSubjects.forEach(subject => {
                            formData.append('specialization', subject);
                        });
                        selectedClasses.forEach(cls => {
                            formData.append('classes', cls);
                        });
                        await createTeacher(formData);
                        setIsOpen(false);
                        resetForm();
                        router.refresh();
                    }} id="teacher-form" className="space-y-6 py-4">
                        {/* Personal Information Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <UserCircle className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Personal Information</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground -mt-3">Please provide basic contact and identification details.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">First Name <span className="text-red-500">*</span></Label>
                                    <Input name="firstName" placeholder="e.g. John" required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Last Name</Label>
                                    <Input name="lastName" placeholder="e.g. Doe" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Email <span className="text-red-500">*</span></Label>
                                    <Input name="email" type="email" placeholder="e.g. john@school.com" required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Password <span className="text-red-500">*</span></Label>
                                    <Input name="password" type="password" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-1.5 col-span-1">
                                    <Label className="text-xs font-bold">Code <span className="text-red-500">*</span></Label>
                                    <Select name="phoneCode" defaultValue="+91">
                                        <SelectTrigger>
                                            <SelectValue placeholder="+91" />
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
                                    <Input name="phoneNumber" placeholder="e.g. 9876543210" required />
                                </div>
                            </div>
                        </div>

                        {/* Professional Information Section */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <GraduationCap className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Professional Information</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground -mt-3">Specify qualifications and teaching background.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Highest Qualification <span className="text-red-500">*</span></Label>
                                    <Select name="qualification">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select qualification" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bachelors">Bachelors Degree</SelectItem>
                                            <SelectItem value="Masters">Masters Degree</SelectItem>
                                            <SelectItem value="PhD">PhD / Doctorate</SelectItem>
                                            <SelectItem value="Diploma">Diploma</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Years of Experience <span className="text-red-500">*</span></Label>
                                    <Input name="experience" type="number" placeholder="e.g. 5" required />
                                </div>
                            </div>

                            {/* Subject Specialization - Color coded by category */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold">Subject Specialization <span className="text-red-500">*</span></Label>
                                    <span className="text-[10px] text-muted-foreground">({selectedSubjects.length} selected)</span>
                                </div>

                                {subjectMasters.length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground italic">No global subjects defined. Define them in Configuration first.</p>
                                ) : (
                                    Object.entries(subjectsByCategory).map(([category, subjects]) => {
                                        const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.primary;
                                        const allSelected = subjects.every(s => selectedSubjects.includes(s.name));

                                        return (
                                            <div key={category} className={`rounded-lg border ${style.border} ${style.bg} p-3 space-y-2`}>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold ${style.text}`}>{style.label}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectAllInCategory(category)}
                                                        className={`text-[10px] font-medium ${style.text} hover:underline`}
                                                    >
                                                        {allSelected ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {subjects.map(subject => (
                                                        <label
                                                            key={subject.id}
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border ${selectedSubjects.includes(subject.name)
                                                                ? `${style.border} ring-2 ring-offset-1 ring-primary/50 bg-white`
                                                                : 'border-transparent bg-white/50 hover:bg-white'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSubjects.includes(subject.name)}
                                                                onChange={() => toggleSubject(subject.name)}
                                                                className="h-3.5 w-3.5 accent-primary"
                                                            />
                                                            <div className="flex flex-col leading-none">
                                                                <span className="text-xs font-medium">{subject.name}</span>
                                                                <span className="text-[9px] font-mono text-muted-foreground">{subject.code}</span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Classes Specialised */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Classes Specialised <span className="text-red-500">*</span></Label>
                                <div className="flex flex-wrap gap-2">
                                    {classGroups.map(group => (
                                        <label
                                            key={group}
                                            className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg cursor-pointer transition-all ${selectedClasses.includes(group)
                                                ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                                                : 'hover:bg-muted/50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedClasses.includes(group)}
                                                onChange={() => toggleClass(group)}
                                                className="h-3.5 w-3.5 accent-primary"
                                            />
                                            <span className="text-xs font-medium">{group}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold">Teaching License Number</Label>
                                <Input name="licenseNumber" placeholder="e.g. TL-2024-12345" />
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold">Previous Institutions</Label>
                                <Textarea name="previousInstitutions" placeholder="e.g. Springfield High School" className="min-h-[80px] bg-muted/5 border-dashed" />
                            </div>
                        </div>
                    </form>
                </ScrollArea>
                <DialogFooter className="pt-4">
                    <Button type="submit" form="teacher-form" className="w-full vibrant py-6 text-base shadow-lg transition-transform active:scale-[0.98]">
                        Create Teacher
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
