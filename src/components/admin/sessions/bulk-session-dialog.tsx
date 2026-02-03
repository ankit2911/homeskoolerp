'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import { generateSessionTemplate, parseBulkSessions, commitBulkSessions } from '@/lib/actions/bulk-session';
import { toast } from 'sonner';

export function BulkSessionDialog() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload');
    const [isPending, startTransition] = useTransition();
    const [sessions, setSessions] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleDownloadTemplate = async () => {
        const bytes = await generateSessionTemplate();
        const blob = new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'session_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        startTransition(async () => {
            const result = await parseBulkSessions(formData);
            if (result.success) {
                setSessions(result.sessions || []);
                setTeachers(result.allTeachers || []);
                setStep('review');
            } else {
                toast.error(result.error || 'Failed to parse file');
            }
        });
    };

    const handleTeacherChange = (sessionId: string, teacherId: string) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? {
                ...s,
                teacherId: teacherId === 'none' ? null : teacherId,
                teacherName: teachers.find(t => t.id === teacherId)?.firstName ?
                    `${teachers.find(t => t.id === teacherId).firstName} ${teachers.find(t => t.id === teacherId).lastName}` :
                    'Unassigned'
            } : s
        ));
    };

    const handleCommit = async () => {
        const validSessions = sessions.filter(s => s.isValid);
        if (validSessions.length === 0) {
            toast.error('No valid sessions to create');
            return;
        }

        startTransition(async () => {
            const result = await commitBulkSessions(validSessions);
            if (result.success) {
                setStep('success');
                toast.success(`Successfully created ${result.count} sessions`);
            } else {
                setError(result.error || 'Failed to create sessions');
                toast.error(result.error || 'Failed to create sessions');
            }
        });
    };

    const reset = () => {
        setStep('upload');
        setSessions([]);
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5">
                    <Upload className="h-4 w-4" /> Bulk Upload
                </Button>
            </DialogTrigger>
            <DialogContent className={`${step === 'review' ? 'max-w-4xl' : 'sm:max-w-[500px]'} max-h-[90vh] flex flex-col`}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        Bulk Session Creation
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'upload' && "Download the template, fill it with session details, and upload it back."}
                        {step === 'review' && `Review ${sessions.length} sessions from your file. Fix errors and confirm teachers.`}
                        {step === 'success' && "Sessions have been successfully scheduled."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div className="p-4 border rounded-lg bg-muted/30 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-sm font-bold">1. Download Template</div>
                                    <div className="text-xs text-muted-foreground">Get a pre-filled Excel file with valid Boards and Classes.</div>
                                </div>
                                <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                                    <Download className="h-4 w-4" /> Download
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="text-sm font-bold">2. Upload Filled File</div>
                                <div
                                    className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-3 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer relative"
                                    onClick={() => document.getElementById('bulk-upload-input')?.click()}
                                >
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        {isPending ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Click or drag to upload</p>
                                        <p className="text-xs text-muted-foreground">XLSX or XLS files only</p>
                                    </div>
                                    <input
                                        id="bulk-upload-input"
                                        type="file"
                                        className="hidden"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileUpload}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-100 mb-2">
                                <div className="text-xs text-blue-700 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Teachers are auto-assigned based on your allocations. You can change them below.
                                </div>
                                <Badge variant="outline" className="text-[10px] bg-white">
                                    {sessions.filter(s => s.isValid).length} Valid • {sessions.filter(s => !s.isValid).length} Errors
                                </Badge>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="text-[10px] uppercase font-bold">Target</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold">Schedule</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold">Teacher Assignment</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold w-[100px]">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.map((s) => (
                                            <TableRow key={s.id} className={s.isValid ? '' : 'bg-red-50/50'}>
                                                <TableCell className="py-2">
                                                    <div className="text-xs font-bold">{s.subjectName}</div>
                                                    <div className="text-[10px] text-muted-foreground">{s.boardName} • {s.className}</div>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <div className="text-xs whitespace-nowrap">
                                                        {s.startTime ? new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Invalid Date'}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">{s.duration} mins</div>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Select
                                                        value={s.teacherId || 'none'}
                                                        onValueChange={(val) => handleTeacherChange(s.id, val)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs bg-white">
                                                            <SelectValue placeholder="Select Teacher" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Unassigned</SelectItem>
                                                            {teachers.map(t => (
                                                                <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    {s.isValid ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 text-[10px]">
                                                            <CheckCircle2 className="h-2 w-2" /> Ready
                                                        </Badge>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {s.errors.map((e: string, i: number) => (
                                                                <div key={i} className="text-[9px] text-red-600 leading-tight">! {e}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold">Sessions Scheduled!</h3>
                                <p className="text-sm text-muted-foreground">All valid sessions have been successfully added to the calendar.</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    {step === 'upload' && (
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    )}
                    {step === 'review' && (
                        <>
                            <Button variant="ghost" onClick={reset}>Discard & Restart</Button>
                            <Button
                                onClick={handleCommit}
                                disabled={isPending || sessions.filter(s => s.isValid).length === 0}
                                className="font-bold"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Confirm & Create {sessions.filter(s => s.isValid).length} Sessions
                            </Button>
                        </>
                    )}
                    {step === 'success' && (
                        <Button className="w-full" onClick={() => setOpen(false)}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
