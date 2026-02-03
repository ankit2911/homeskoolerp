'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Users, ChevronRight, ChevronLeft, Save, AlertCircle, Star, User } from 'lucide-react';
import { submitSessionLog } from '@/lib/actions/session';

type Student = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    rollNumber: string | null;
};

type SessionLogData = {
    id?: string;
    topicsCovered?: string;
    homework?: string;
    classNotes?: string;
    challenges?: string;
    nextSteps?: string;
    studentNotes?: Array<{
        studentId: string;
        note: string;
        flag?: string | null;
    }>;
};

type SessionLogDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: {
        id: string;
        title: string;
        teacherId: string | null;
        class: { name: string; section: string | null };
        subject: { name: string };
    };
    students: Student[];
    existingLog?: SessionLogData;
};

const FLAG_OPTIONS = [
    { value: 'none', label: 'No Flag', color: 'bg-gray-100 text-gray-600' },
    { value: 'EXCELLENT', label: 'Excellent', color: 'bg-green-100 text-green-700' },
    { value: 'GOOD', label: 'Good', color: 'bg-blue-100 text-blue-700' },
    { value: 'NEEDS_ATTENTION', label: 'Needs Attention', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 text-red-700' },
];

export function SessionLogDialog({
    open,
    onOpenChange,
    session,
    students,
    existingLog
}: SessionLogDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [topicsCovered, setTopicsCovered] = useState(existingLog?.topicsCovered || '');
    const [homework, setHomework] = useState(existingLog?.homework || '');
    const [classNotes, setClassNotes] = useState(existingLog?.classNotes || '');
    const [challenges, setChallenges] = useState(existingLog?.challenges || '');
    const [nextSteps, setNextSteps] = useState(existingLog?.nextSteps || '');

    // Student notes state
    const [studentNotes, setStudentNotes] = useState<Record<string, { note: string; flag: string }>>(() => {
        const initial: Record<string, { note: string; flag: string }> = {};
        students.forEach(s => {
            const existing = existingLog?.studentNotes?.find(n => n.studentId === s.id);
            initial[s.id] = {
                note: existing?.note || '',
                flag: existing?.flag || 'none'
            };
        });
        return initial;
    });

    const updateStudentNote = (studentId: string, field: 'note' | 'flag', value: string) => {
        setStudentNotes(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    const handleSubmit = () => {
        if (!topicsCovered.trim()) {
            setError('Topics Covered is required');
            setStep(1);
            return;
        }

        const formData = new FormData();
        formData.set('sessionId', session.id);
        formData.set('teacherId', session.teacherId || '');
        formData.set('topicsCovered', topicsCovered);
        formData.set('homework', homework);
        formData.set('classNotes', classNotes);
        formData.set('challenges', challenges);
        formData.set('nextSteps', nextSteps);

        // Convert student notes to JSON
        const notesArray = Object.entries(studentNotes)
            .filter(([, data]) => data.note || data.flag !== 'none')
            .map(([studentId, data]) => ({
                studentId,
                note: data.note,
                flag: data.flag === 'none' ? null : data.flag
            }));
        formData.set('studentNotes', JSON.stringify(notesArray));

        startTransition(async () => {
            const result = await submitSessionLog(formData);
            if (result.error) {
                setError(result.error);
            } else {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Session Log
                    </DialogTitle>
                    <DialogDescription>
                        {session.title} - {session.class.name}{session.class.section} | {session.subject.name}
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 py-2">
                    <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        onClick={() => setStep(1)}
                    >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">Class Notes</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        onClick={() => setStep(2)}
                    >
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Student Notes</span>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                <ScrollArea className="flex-1 pr-4">
                    {step === 1 && (
                        <div className="grid gap-4 py-2">
                            <div className="grid gap-2">
                                <Label htmlFor="topicsCovered">Topics Covered *</Label>
                                <Textarea
                                    id="topicsCovered"
                                    value={topicsCovered}
                                    onChange={(e) => setTopicsCovered(e.target.value)}
                                    placeholder="What topics were covered in this session?"
                                    rows={3}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="homework">Homework Assigned</Label>
                                <Textarea
                                    id="homework"
                                    value={homework}
                                    onChange={(e) => setHomework(e.target.value)}
                                    placeholder="Any homework or assignments given?"
                                    rows={2}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="classNotes">Class Notes</Label>
                                <Textarea
                                    id="classNotes"
                                    value={classNotes}
                                    onChange={(e) => setClassNotes(e.target.value)}
                                    placeholder="General observations about class performance..."
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="challenges">Challenges Faced</Label>
                                    <Textarea
                                        id="challenges"
                                        value={challenges}
                                        onChange={(e) => setChallenges(e.target.value)}
                                        placeholder="Any difficulties encountered?"
                                        rows={2}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="nextSteps">Next Steps</Label>
                                    <Textarea
                                        id="nextSteps"
                                        value={nextSteps}
                                        onChange={(e) => setNextSteps(e.target.value)}
                                        placeholder="Plans for next session?"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid gap-3 py-2">
                            <p className="text-sm text-muted-foreground">
                                Add individual notes for each student (optional)
                            </p>
                            {students.map((student) => (
                                <div key={student.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">
                                                {student.firstName} {student.lastName}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {student.rollNumber}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Notes about this student..."
                                                value={studentNotes[student.id]?.note || ''}
                                                onChange={(e) => updateStudentNote(student.id, 'note', e.target.value)}
                                                className="flex-1"
                                            />
                                            <Select
                                                value={studentNotes[student.id]?.flag || 'none'}
                                                onValueChange={(v) => updateStudentNote(student.id, 'flag', v)}
                                            >
                                                <SelectTrigger className="w-40">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FLAG_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${opt.color}`}>
                                                                {opt.label}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {students.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No students enrolled in this class yet.
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button variant="outline" onClick={() => setStep(step - 1)}>
                                <ChevronLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step < 2 ? (
                            <Button onClick={() => setStep(step + 1)}>
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={isPending}>
                                <Save className="h-4 w-4 mr-1" />
                                {isPending ? 'Saving...' : 'Save Log'}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
