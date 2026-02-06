'use client';

import React, { useState, useMemo } from 'react';
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
import { Plus, UserCircle, Users, GraduationCap, BookOpen, Filter } from 'lucide-react';
import { createStudent } from '@/lib/actions/student';

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

type AddStudentFormProps = {
    classes: Class[];
};
export function AddStudentForm({ classes }: AddStudentFormProps) {
    const router = useRouter();
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

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
        setSelectedClassId(''); // Reset class when board changes
        setSelectedSubjects([]);
    };

    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        setSelectedSubjects([]); // Reset subjects when class changes
    };

    const toggleSubject = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const selectAllInCategory = (category: string) => {
        const categorySubjects = subjectsByCategory[category] || [];
        const categoryIds = categorySubjects.map(s => s.id);
        const allSelected = categoryIds.every(id => selectedSubjects.includes(id));

        if (allSelected) {
            // Deselect all in category
            setSelectedSubjects(prev => prev.filter(id => !categoryIds.includes(id)));
        } else {
            // Select all in category
            setSelectedSubjects(prev => [...new Set([...prev, ...categoryIds])]);
        }
    };

    const resetForm = () => {
        setSelectedBoardId('');
        setSelectedClassId('');
        setSelectedSubjects([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button className="h-8 px-4 font-bold shadow-sm shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95">
                    <Plus className="mr-2 h-4 w-4" /> Add Student
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-heading text-xl">Add New Student</DialogTitle>
                    <DialogDescription>
                        Create a detailed profile for a new student.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 overflow-y-auto pr-4" style={{ maxHeight: '60vh' }}>
                    <form action={async (formData) => {
                        // Add selected subjects to form data
                        selectedSubjects.forEach(subjectId => {
                            formData.append('subjectIds', subjectId);
                        });
                        await createStudent(formData);
                        setIsOpen(false);
                        resetForm();
                        router.refresh();
                    }} id="student-form" className="space-y-6 py-4">
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
                                    <Input name="firstName" placeholder="e.g. Alice" required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Last Name</Label>
                                    <Input name="lastName" placeholder="e.g. Smith" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Email <span className="text-red-500">*</span></Label>
                                    <Input name="email" type="email" placeholder="e.g. alice@school.com" required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Password <span className="text-red-500">*</span></Label>
                                    <Input name="password" type="password" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Roll Number</Label>
                                    <Input name="rollNumber" placeholder="e.g. 2025001" />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Date of Birth</Label>
                                    <Input name="dateOfBirth" type="date" />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold">Gender</Label>
                                <Select name="gender">
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

                        {/* Parent/Guardian Information Section */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <Users className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Parent/Guardian Information</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground -mt-3">Provide details of parents or guardians for emergency contact.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Father&apos;s Name</Label>
                                    <Input name="fatherName" placeholder="e.g. John Smith" />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Mother&apos;s Name</Label>
                                    <Input name="motherName" placeholder="e.g. Jane Smith" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Parent Phone</Label>
                                    <Input name="parentPhone" placeholder="e.g. +91 9876543210" />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Emergency Contact</Label>
                                    <Input name="emergencyContact" placeholder="e.g. Uncle Robert" />
                                </div>
                            </div>
                        </div>

                        {/* Student Contact Details Section */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <UserCircle className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Student Contact Details</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground -mt-3">Additional contact information for the student.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Student Email</Label>
                                    <Input name="studentEmail" type="email" placeholder="e.g. alice@gmail.com" />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Student Phone</Label>
                                    <Input name="studentPhone" placeholder="e.g. +91 9876543210" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Alternate Email</Label>
                                    <Input name="alternateEmail" type="email" placeholder="e.g. backup@email.com" />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Alternate Phone</Label>
                                    <Input name="alternatePhone" placeholder="e.g. +91 9876543210" />
                                </div>
                            </div>
                        </div>

                        {/* Other Details Section */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <Filter className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Other Details</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground -mt-3">Additional background and address information.</p>

                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold">Address</Label>
                                <Input name="address" placeholder="e.g. 123 Main St, City, State, PIN" />
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold">Previous School</Label>
                                <Input name="previousSchool" placeholder="e.g. ABC Public School" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold">Status</Label>
                                    <Select name="status" defaultValue="ACTIVE">
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
                                    <Input name="adminComments" placeholder="e.g. Excellent student" />
                                </div>
                            </div>
                        </div>

                        {/* Academic Details Section - Now at the end */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b pb-1">
                                <GraduationCap className="h-4 w-4 text-primary" />
                                <h3 className="font-heading font-bold text-sm">Academic Enrollment</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground -mt-3">Assign class and select subjects for the student.</p>

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
                                <Select name="academicYear" defaultValue="2025-26">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2025-26">2025-26</SelectItem>
                                        <SelectItem value="2024-25">2024-25</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Subject Selection - Shows only when class is selected */}
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
                    <Button type="submit" form="student-form" className="w-full font-bold">Enroll Student</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
