'use client';

import React, { useState, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    createCalendarEntry,
    updateCalendarEntry,
} from '@/lib/actions/academic-calendar';
import {
    CALENDAR_ENTRY_TYPES,
    type CalendarEntryType,
    type CalendarEntry,
} from '@/lib/types/calendar';

interface CalendarEntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry?: CalendarEntry | null;
}

const TYPE_LABELS: Record<CalendarEntryType, string> = {
    HOLIDAY: 'Holiday',
    SCHOOL_EVENT: 'School Event',
    EXAM_DAY: 'Exam Day',
    HALF_DAY: 'Half-Day',
};

function formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

export function CalendarEntryDialog({ open, onOpenChange, entry }: CalendarEntryDialogProps) {
    const isEditing = !!entry;
    const [isPending, startTransition] = useTransition();

    const [date, setDate] = useState(entry ? formatDateForInput(entry.date) : '');
    const [isRange, setIsRange] = useState(!!entry?.endDate);
    const [endDate, setEndDate] = useState(entry?.endDate ? formatDateForInput(entry.endDate) : '');
    const [type, setType] = useState<CalendarEntryType>(
        (entry?.type as CalendarEntryType) || 'HOLIDAY'
    );
    const [title, setTitle] = useState(entry?.title || '');
    const [description, setDescription] = useState(entry?.description || '');

    // Reset form when dialog opens with different entry
    React.useEffect(() => {
        if (open) {
            setDate(entry ? formatDateForInput(entry.date) : '');
            setIsRange(!!entry?.endDate);
            setEndDate(entry?.endDate ? formatDateForInput(entry.endDate) : '');
            setType((entry?.type as CalendarEntryType) || 'HOLIDAY');
            setTitle(entry?.title || '');
            setDescription(entry?.description || '');
        }
    }, [open, entry]);

    const handleSubmit = () => {
        if (!date || !type || !title.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        startTransition(async () => {
            const data = {
                date,
                endDate: isRange && endDate ? endDate : null,
                type,
                title: title.trim(),
                description: description.trim() || null,
            };

            const result = isEditing
                ? await updateCalendarEntry(entry.id, data)
                : await createCalendarEntry(data);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEditing ? 'Entry updated' : 'Entry created');
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Calendar Entry' : 'Add Calendar Entry'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Type */}
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={(val) => setType(val as CalendarEntryType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Diwali Holiday"
                        />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {/* Date Range Toggle */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="isRange"
                            checked={isRange}
                            onCheckedChange={(checked) => setIsRange(!!checked)}
                        />
                        <Label htmlFor="isRange" className="text-sm text-muted-foreground cursor-pointer">
                            This is a date range
                        </Label>
                    </div>

                    {/* End Date (if range) */}
                    {isRange && (
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={date}
                            />
                        </div>
                    )}

                    {/* Description (optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Additional details..."
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending || !date || !title.trim()}>
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isEditing ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
