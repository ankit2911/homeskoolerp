'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Edit2, UserCircle, Users, GraduationCap, BookOpen, Filter } from 'lucide-react';
import { updateStudent } from '@/lib/actions/student';

// Category styling - same as class creation
const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
    primary: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Primary Subjects' },
    secondary: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', label: 'Secondary Subjects' },
    language: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Languages' },
    elective: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Electives' },
    cocurricular: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', label: 'Co-curricular' },
};

type Subject = {
    id: string;
    name: string;
    subjectMaster?: { category: string | null } | null;
};

type Class = {
    id: string;
    name: string;
    section: string | null;
    board: { id: string; name: string };
    subjects: Subject[];
};

type StudentProfile = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    rollNumber: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    fatherName: string | null;
    motherName: string | null;
    emergencyContact: string | null;
    parentPhone: string | null;
    studentEmail: string | null;
    studentPhone: string | null;
    alternateEmail: string | null;
    alternatePhone: string | null;
    address: string | null;
    previousSchool: string | null;
    academicYear: string | null;
    classId: string | null;
    status: string | null;
    adminComments: string | null;
};

type Student = {
    id: string;
    email: string;
    studentProfile: StudentProfile | null;
};

type EditStudentFormProps = {
    student: Student;
    classes: Class[];
    enrolledSubjectIds?: string[];
};

export function EditStudentForm({ student, classes, enrolledSubjectIds = [] }: EditStudentFormProps) {
    const profile = student.studentProfile;
    const router = useRouter();
    // Derive initial board ID from the student's class
    const initialBoardId = useMemo(() => {
        if (profile?.classId) {
            const cls = classes.find(c => c.id === profile.classId);
            return cls?.board.id || '';
        }
        return '';
    }, [classes, profile?.classId]);

    const [selectedBoardId, setSelectedBoardId] = useState<string>(initialBoardId);
    const [selectedClassId, setSelectedClassId] = useState<string>(profile?.classId || '');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(enrolledSubjectIds);
    const [isOpen, setIsOpen] = useState(false);

    // Extract unique boards from classes
    const boards = useMemo(() => {
        const uniqueBoards = new Map();
        classes.forEach(c => {
            if (c.board && !uniqueBoards.has(c.board.id)) {
                uniqueBoards.set(c.board.id, c.board);
            }
        });
        return Array.from(uniqueBoards.values());
    }, [classes]);

    // Filter classes for selected board
    const availableClasses = useMemo(() => {
        if (!selectedBoardId) return [];
        return classes.filter(c => c.board.id === selectedBoardId);
    }, [classes, selectedBoardId]);

    // Update selectedBoardID if profile class loads later or changes externally (unlikely but good practice)
    useEffect(() => {
        if (profile?.classId && !selectedBoardId) {
            const cls = classes.find(c => c.id === profile.classId);
            if (cls) setSelectedBoardId(cls.board.id);
        }
    }, [profile?.classId, classes, selectedBoardId]);

    // Get subjects for selected class
    const classSubjects = useMemo(() => {
        const cls = classes.find(c => c.id === selectedClassId);
        return cls?.subjects || [];
    }, [classes, selectedClassId]);

    // Group subjects by category
    const subjectsByCategory = useMemo(() => {
        const groups: Record<string, Subject[]> = {};
        classSubjects.forEach(subject => {
            const category = subject.subjectMaster?.category || 'primary';
            if (!groups[category]) groups[category] = [];
            groups[category].push(subject);
        });
        return groups;
    }, [classSubjects]);

    const handleBoardChange = (boardId: string) => {
        setSelectedBoardId(boardId);
        setSelectedClassId(''); // Reset class
        setSelectedSubjects([]);
    };

    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        // Keep only subjects that exist in the new class
        const newClassSubjectIds = classes.find(c => c.id === classId)?.subjects.map(s => s.id) || [];
        setSelectedSubjects(prev => prev.filter(id => newClassSubjectIds.includes(id)));
    };

    const toggleSubject = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const selectAllInCategory = (category: string) => {
        const categorySubjectIds = subjectsByCategory[category]?.map(s => s.id) || [];
        const allSelected = categorySubjectIds.every(id => selectedSubjects.includes(id));

        if (allSelected) {
            setSelectedSubjects(prev => prev.filter(id => !categorySubjectIds.includes(id)));
        } else {
            setSelectedSubjects(prev => [...new Set([...prev, ...categorySubjectIds])]);
        }
    };

    // Format date for input
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors">
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
                <ScrollArea className="flex-1 overflow-y-auto pr-4" style={{ maxHeight: '60vh' }}>
                    <form action={async (formData) => {
                        selectedSubjects.forEach(subjectId => {
                            formData.append('subjectIds', subjectId);
                        });
                        await updateStudent(formData);
                        setIsOpen(false);
                        router.refresh();
                    }} id={`edit-student-form-${student.id}`} className="space-y-6 py-4">
                        <input type="hidden" name="id" value={student.id} />

                        {/* Personal Information Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <UserCircle className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Personal Information</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">First Name <span className="text-red-500">*</span></Label>
                                    <Input name="firstName" defaultValue={profile?.firstName || ''} required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Last Name</Label>
                                    <Input name="lastName" defaultValue={profile?.lastName || ''} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Email <span className="text-red-500">*</span></Label>
                                    <Input name="email" type="email" defaultValue={student.email} required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Roll Number</Label>
                                    <Input name="rollNumber" defaultValue={profile?.rollNumber || ''} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Date of Birth</Label>
                                    <Input name="dateOfBirth" type="date" defaultValue={formatDate(profile?.dateOfBirth ?? null)} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Gender</Label>
                                    <Select name="gender" defaultValue={profile?.gender || ''}>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Father&apos;s Name</Label>
                                    <Input name="fatherName" defaultValue={profile?.fatherName || ''} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Mother&apos;s Name</Label>
                                    <Input name="motherName" defaultValue={profile?.motherName || ''} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Parent Phone</Label>
                                    <Input name="parentPhone" defaultValue={profile?.parentPhone || ''} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Emergency Contact</Label>
                                    <Input name="emergencyContact" defaultValue={profile?.emergencyContact || ''} />
                                </div>
                            </div>
                        </div>

                        {/* Student Contact Details Section */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <UserCircle className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Student Contact Details</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Student Email</Label>
                                    <Input name="studentEmail" type="email" defaultValue={profile?.studentEmail || ''} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Student Phone</Label>
                                    <Input name="studentPhone" defaultValue={profile?.studentPhone || ''} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Alternate Email</Label>
                                    <Input name="alternateEmail" type="email" defaultValue={profile?.alternateEmail || ''} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Alternate Phone</Label>
                                    <Input name="alternatePhone" defaultValue={profile?.alternatePhone || ''} />
                                </div>
                            </div>
                        </div>

                        {/* Other Details Section */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <Filter className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Other Details</h3>
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold">Address</Label>
                                <Input name="address" defaultValue={profile?.address || ''} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold">Previous School</Label>
                                <Input name="previousSchool" defaultValue={profile?.previousSchool || ''} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Status</Label>
                                    <Select name="status" defaultValue={profile?.status || 'ACTIVE'}>
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
                                    <Input name="adminComments" defaultValue={profile?.adminComments || ''} />
                                </div>
                            </div>
                        </div>

                        {/* Academic Enrollment Section - At the end */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <GraduationCap className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Academic Enrollment</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Board <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={selectedBoardId}
                                        onValueChange={handleBoardChange}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Board" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {boards.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Class <span className="text-red-500">*</span></Label>
                                    <Select
                                        name="classId"
                                        value={selectedClassId}
                                        onValueChange={handleClassChange}
                                        disabled={!selectedBoardId}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableClasses.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name} {c.section ? `(${c.section})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-1.5 pt-2">
                                <Label className="text-xs font-bold">Academic Year</Label>
                                <Select name="academicYear" defaultValue={profile?.academicYear || '2025-26'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2025-26">2025-26</SelectItem>
                                        <SelectItem value="2024-25">2024-25</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Subject Selection */}
                            {selectedClassId && classSubjects.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                        <Label className="text-xs font-bold">Select Subjects</Label>
                                        <span className="text-[10px] text-muted-foreground">({selectedSubjects.length} selected)</span>
                                    </div>

                                    {Object.entries(subjectsByCategory).map(([category, subjects]) => {
                                        const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.primary;
                                        const allSelected = subjects.every(s => selectedSubjects.includes(s.id));

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
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border ${selectedSubjects.includes(subject.id)
                                                                ? `${style.border} ring-2 ring-offset-1 ring-primary/50 bg-white`
                                                                : 'border-transparent bg-white/50 hover:bg-white'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSubjects.includes(subject.id)}
                                                                onChange={() => toggleSubject(subject.id)}
                                                                className="h-3.5 w-3.5 accent-primary"
                                                            />
                                                            <span className="text-xs font-medium">{subject.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {selectedClassId && classSubjects.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    No subjects configured for this class.
                                </div>
                            )}
                        </div>
                    </form>
                </ScrollArea>
                <DialogFooter className="pt-4">
                    <Button type="submit" form={`edit-student-form-${student.id}`} className="w-full font-bold">Update Student</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
