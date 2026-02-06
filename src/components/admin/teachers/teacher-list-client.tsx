'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    RotateCcw,
    Users,
    Phone,
    Mail,
    Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { EditTeacherForm } from '@/components/admin/edit-teacher-form';
import { AddTeacherForm } from '@/components/admin/teacher-form-client';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import { deleteTeacher } from '@/lib/actions/teacher';

type Teacher = {
    id: string;
    name: string | null;
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
    [key: string]: any;
};

type Board = {
    id: string;
    name: string;
};

type SubjectMaster = {
    id: string;
    name: string;
    code: string;
    category: string | null;
};

type TeacherListClientProps = {
    initialTeachers: Teacher[];
    boards: Board[];
    subjects: SubjectMaster[]; // Using SubjectMaster type which matches our data
};

export function TeacherListClient({ initialTeachers, boards, subjects }: TeacherListClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedQualification, setSelectedQualification] = useState('all');
    const [selectedSpecialization, setSelectedSpecialization] = useState('all');

    // Filter teachers based on search query and filters
    const filteredTeachers = useMemo(() => {
        return initialTeachers.filter(teacher => {
            // Search Filter
            const searchLower = searchQuery.toLowerCase();
            const terms = searchLower.split(' ').filter(t => t.length > 0);

            const searchableText = `
                ${teacher.name || ''}
                ${teacher.email || ''}
                ${teacher.teacherProfile?.qualification || ''}
                ${teacher.teacherProfile?.specialization || ''}
                ${teacher.teacherProfile?.phoneNumber || ''}
            `.toLowerCase();

            const matchesSearch = terms.length === 0 || terms.every(term => searchableText.includes(term));

            // Qualification Filter
            const matchesQualification = selectedQualification === 'all' ||
                (teacher.teacherProfile?.qualification === selectedQualification);

            // Specialization Filter
            const matchesSpecialization = selectedSpecialization === 'all' ||
                (teacher.teacherProfile?.specialization?.toLowerCase() || '').includes(selectedSpecialization.toLowerCase());

            return matchesSearch && matchesQualification && matchesSpecialization;
        });
    }, [initialTeachers, searchQuery, selectedQualification, selectedSpecialization]);

    const handleReset = () => {
        setSearchQuery('');
        setSelectedQualification('all');
        setSelectedSpecialization('all');
    };

    // Get unique qualifications for filter
    const uniqueQualifications = useMemo(() => {
        const quals = new Set<string>();
        initialTeachers.forEach(t => {
            if (t.teacherProfile?.qualification) quals.add(t.teacherProfile.qualification);
        });
        return Array.from(quals).sort();
    }, [initialTeachers]);

    // Get unique specializations (split by comma) for filter could be complex, 
    // simply using the subjects passed as props is better or extracting from existing data.
    // Let's use the passed subjects for the filter dropdown to align with data entry.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                {/* Header Actions - Add Teacher Button moved here to align with other pages */}
                <div className="flex-1"></div>
                <AddTeacherForm subjectMasters={subjects} />
            </div>

            {/* Filters Section */}
            <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-800/30">
                <CardContent className="p-2 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder="Search teachers by name, email, specialization..."
                            className="pl-9 h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={selectedQualification} onValueChange={setSelectedQualification}>
                        <SelectTrigger className="w-[150px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
                            <SelectValue placeholder="Qualification" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Qualifications</SelectItem>
                            {uniqueQualifications.map((q) => (
                                <SelectItem key={q} value={q}>{q}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                        <SelectTrigger className="w-[150px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
                            <SelectValue placeholder="Specialization" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Specializations</SelectItem>
                            {subjects.map((s) => (
                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="ghost"
                        className="h-8 text-gray-400 font-bold gap-2 text-xs hover:text-gray-600"
                        onClick={handleReset}
                    >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </Button>
                </CardContent>
            </Card>

            {/* Teachers Table */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                            <TableHead className="w-12 text-center">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            </TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Teacher</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Contact</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Email</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Specialization</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Exp.</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTeachers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-40 text-gray-400 font-medium">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="w-10 h-10 text-gray-200" />
                                        {initialTeachers.length === 0
                                            ? "No teachers found in the database."
                                            : "No teachers match your search filters."}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTeachers.map((teacher) => (
                                <TableRow key={teacher.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-b border-gray-50 dark:border-gray-800 transition-colors">
                                    <TableCell className="text-center">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 dark:text-white leading-tight">{teacher.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                                                {teacher.teacherProfile?.qualification || 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                                            <Phone className="h-3 w-3 text-gray-400" />
                                            {teacher.teacherProfile?.phoneNumber ? (
                                                <span className="tracking-tighter">
                                                    {teacher.teacherProfile.phoneCode && <span className="mr-1 text-gray-400">{teacher.teacherProfile.phoneCode}</span>}
                                                    {teacher.teacherProfile.phoneNumber}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">N/A</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                                            <Mail className="h-3 w-3 text-gray-400" />
                                            <span className="truncate max-w-[150px]">{teacher.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {teacher.teacherProfile?.specialization?.split(',').map((s: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="text-[10px] h-5 truncate max-w-[100px] bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">
                                                    {s.trim()}
                                                </Badge>
                                            )) || <span className="text-xs text-gray-400 italic">None</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                {teacher.teacherProfile?.experience || 0}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">yr</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <EditTeacherForm
                                                teacher={JSON.parse(JSON.stringify(teacher))}
                                                subjectMasters={subjects}
                                            />
                                            <DeleteConfirm onDelete={async () => {
                                                const res = await deleteTeacher(teacher.id);
                                                router.refresh();
                                                return res;
                                            }} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground text-center">
                Showing {filteredTeachers.length} of {initialTeachers.length} teachers
            </div>
        </div>
    );
}
