'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardAction, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CalendarEntryDialog } from './calendar-entry-dialog';
import { deleteCalendarEntry } from '@/lib/actions/academic-calendar';
import { type CalendarEntry, CALENDAR_ENTRY_TYPES } from '@/lib/types/calendar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AcademicCalendarSectionProps {
    entries: CalendarEntry[];
}

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
    HOLIDAY: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', icon: '🏖️' },
    SCHOOL_EVENT: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: '🎉' },
    EXAM_DAY: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', icon: '📝' },
    HALF_DAY: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', icon: '⏰' },
};

const TYPE_LABELS: Record<string, string> = {
    HOLIDAY: 'Holiday',
    SCHOOL_EVENT: 'School Event',
    EXAM_DAY: 'Exam Day',
    HALF_DAY: 'Half-Day',
};

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatDateRange(start: Date | string, end: Date | string | null): string {
    if (!end) return formatDate(start);
    return `${formatDate(start)} — ${formatDate(end)}`;
}

export function AcademicCalendarSection({ entries }: AcademicCalendarSectionProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<CalendarEntry | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleAdd = () => {
        setEditingEntry(null);
        setDialogOpen(true);
    };

    const handleEdit = (entry: CalendarEntry) => {
        setEditingEntry(entry);
        setDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!deleteId) return;

        startTransition(async () => {
            const result = await deleteCalendarEntry(deleteId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Entry deleted');
            }
            setDeleteId(null);
        });
    };

    // Group entries by month
    const entriesByMonth = entries.reduce((acc, entry) => {
        const monthKey = new Date(entry.date).toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
        });
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(entry);
        return acc;
    }, {} as Record<string, CalendarEntry[]>);

    return (
        <>
            <Card className="border-0 shadow-elevation-1">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                            <Calendar className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div>
                            <CardTitle className="text-base">Academic Calendar</CardTitle>
                            <CardDescription className="text-xs">
                                Define holidays, events, and exceptions to the operating schedule
                            </CardDescription>
                        </div>
                    </div>
                    <CardAction>
                        <Button size="sm" onClick={handleAdd} className="h-8 px-3">
                            <Plus className="w-4 h-4 mr-1" />
                            Add Entry
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="pt-4">
                    {entries.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No calendar entries yet</p>
                            <p className="text-xs mt-1">Add holidays, events, and exceptions to the default schedule</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(entriesByMonth).map(([month, monthEntries]) => (
                                <div key={month}>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                        {month}
                                    </h4>
                                    <div className="space-y-2">
                                        {monthEntries.map((entry) => {
                                            const style = TYPE_STYLES[entry.type] || TYPE_STYLES.HOLIDAY;
                                            return (
                                                <div
                                                    key={entry.id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg group transition-colors",
                                                        style.bg
                                                    )}
                                                >
                                                    <span className="text-lg">{style.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm text-foreground">
                                                                {entry.title}
                                                            </span>
                                                            <span className={cn("text-xs px-1.5 py-0.5 rounded", style.text, "bg-white/50 dark:bg-black/20")}>
                                                                {TYPE_LABELS[entry.type] || entry.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {formatDateRange(entry.date, entry.endDate)}
                                                            {entry.description && ` • ${entry.description}`}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => handleEdit(entry)}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteId(entry.id)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <CalendarEntryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                entry={editingEntry}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Calendar Entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The entry will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isPending}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
