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
    Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { EditStudentForm } from '@/components/admin/edit-student-form';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import { deleteStudent } from '@/lib/actions/student';

type Student = {
    id: string;
    name: string | null;
    email: string;
    studentProfile: {
        id: string;
        rollNumber: string | null;
        classId: string | null;
        class: {
            name: string;
            section: string | null;
        } | null;
        parentPhone: string | null;
        status: string | null;
        [key: string]: any;
    } | null;
    [key: string]: any;
};

type Class = {
    id: string;
    name: string;
    section: string | null;
    board: {
        id: string; // Add id to satisfy AddStudentForm expectations
        name: string;
    };
    subjects: any[];
};

type StudentListClientProps = {
    initialStudents: Student[];
    classes: Class[];
};

export function StudentListClient({ initialStudents, classes }: StudentListClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedYear, setSelectedYear] = useState('2025');

    // Filter students based on search query, class, and status
    const filteredStudents = useMemo(() => {
        return initialStudents.filter(student => {
            // Search Filter
            const searchLower = searchQuery.toLowerCase();
            const terms = searchLower.split(' ').filter(t => t.length > 0);

            const searchableText = `
                ${student.name || ''}
                ${student.email || ''}
                ${student.studentProfile?.rollNumber || ''}
                ${student.studentProfile?.firstName || ''}
                ${student.studentProfile?.lastName || ''}
                ${student.studentProfile?.admissionNumber || ''}
                ${student.studentProfile?.fatherName || ''}
                ${student.studentProfile?.motherName || ''}
            `.toLowerCase();

            const matchesSearch = terms.length === 0 || terms.every(term => searchableText.includes(term));

            // Class Filter
            const matchesClass = selectedClassId === 'all' || student.studentProfile?.classId === selectedClassId;

            // Status Filter
            const status = student.studentProfile?.status || 'ACTIVE';
            const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

            return matchesSearch && matchesClass && matchesStatus;
        });
    }, [initialStudents, searchQuery, selectedClassId, selectedStatus]);

    const handleReset = () => {
        setSearchQuery('');
        setSelectedClassId('all');
        setSelectedStatus('all');
        setSelectedYear('2025');
    };

    return (
        <div className="space-y-6">
            {/* Filters Section */}
            <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-800/30">
                <CardContent className="p-2 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder="Search students by name, email, roll no..."
                            className="pl-9 h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger className="w-[140px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
                            <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name} {c.section ? `(${c.section})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-[110px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[110px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2025">2025-26</SelectItem>
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
                        {filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-40 text-gray-400 font-medium">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="w-10 h-10 text-gray-200" />
                                        {initialStudents.length === 0
                                            ? "No students found in the database."
                                            : "No students match your search filters."}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student) => (
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
                                        {student.studentProfile?.rollNumber || 'N/A'}
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
                                            <EditStudentForm
                                                student={JSON.parse(JSON.stringify(student))}
                                                classes={classes}
                                            />
                                            <DeleteConfirm onDelete={async () => {
                                                const res = await deleteStudent(student.id);
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
                Showing {filteredStudents.length} of {initialStudents.length} students
            </div>
        </div>
    );
}
