'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardAction, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Timer, Pencil, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { upsertOperatingSchedule, OperatingScheduleData } from '@/lib/actions/operating-schedule';
import { toast } from 'sonner';

const DAYS = [
    { id: 'MON', label: 'Mon' },
    { id: 'TUE', label: 'Tue' },
    { id: 'WED', label: 'Wed' },
    { id: 'THU', label: 'Thu' },
    { id: 'FRI', label: 'Fri' },
    { id: 'SAT', label: 'Sat' },
];

interface OperatingScheduleCardProps {
    initialData: {
        id?: string;
        workingDays: string[];
        schoolStartTime: string;
        schoolEndTime: string;
        defaultPeriodDuration: number;
    } | null;
}

const DEFAULT_DATA: OperatingScheduleData = {
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    schoolStartTime: '08:00',
    schoolEndTime: '15:30',
    defaultPeriodDuration: 45,
};

function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

export function OperatingScheduleCard({ initialData }: OperatingScheduleCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();

    const currentData = initialData || DEFAULT_DATA;

    const [workingDays, setWorkingDays] = useState<string[]>(currentData.workingDays);
    const [schoolStartTime, setSchoolStartTime] = useState(currentData.schoolStartTime);
    const [schoolEndTime, setSchoolEndTime] = useState(currentData.schoolEndTime);
    const [defaultPeriodDuration, setDefaultPeriodDuration] = useState(currentData.defaultPeriodDuration);

    const handleDayToggle = (dayId: string) => {
        setWorkingDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        );
    };

    const handleCancel = () => {
        // Reset to current data
        setWorkingDays(currentData.workingDays);
        setSchoolStartTime(currentData.schoolStartTime);
        setSchoolEndTime(currentData.schoolEndTime);
        setDefaultPeriodDuration(currentData.defaultPeriodDuration);
        setIsEditing(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await upsertOperatingSchedule({
                workingDays,
                schoolStartTime,
                schoolEndTime,
                defaultPeriodDuration,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Operating schedule updated');
                setIsEditing(false);
            }
        });
    };

    const isConfigured = initialData !== null;

    return (
        <Card className="border-0 shadow-elevation-1">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <Calendar className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div>
                        <CardTitle className="text-base">School Operating Schedule</CardTitle>
                        <CardDescription className="text-xs">
                            {isConfigured
                                ? 'Default operating hours for all regular school days'
                                : 'Configure the school\'s default operating hours'}
                        </CardDescription>
                    </div>
                </div>
                <CardAction>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                disabled={isPending}
                                className="h-8 px-3"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isPending || workingDays.length === 0}
                                className="h-8 px-3"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4 mr-1" />
                                )}
                                Save
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="h-8 px-3"
                        >
                            <Pencil className="w-4 h-4 mr-1" />
                            {isConfigured ? 'Edit' : 'Configure'}
                        </Button>
                    )}
                </CardAction>
            </CardHeader>
            <CardContent className="pt-4">
                {isEditing ? (
                    <div className="space-y-6">
                        {/* Working Days */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Working Days</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map((day) => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => handleDayToggle(day.id)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                            workingDays.includes(day.id)
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        )}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            {workingDays.length === 0 && (
                                <p className="text-xs text-destructive">Select at least one working day</p>
                            )}
                        </div>

                        {/* School Hours */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime" className="text-sm font-medium text-muted-foreground">
                                    School Start Time
                                </Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={schoolStartTime}
                                    onChange={(e) => setSchoolStartTime(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime" className="text-sm font-medium text-muted-foreground">
                                    School End Time
                                </Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={schoolEndTime}
                                    onChange={(e) => setSchoolEndTime(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        {schoolStartTime >= schoolEndTime && schoolEndTime !== '' && (
                            <p className="text-xs text-destructive -mt-2">End time must be after start time</p>
                        )}

                        {/* Period Duration */}
                        <div className="space-y-2">
                            <Label htmlFor="duration" className="text-sm font-medium text-muted-foreground">
                                Default Period Duration
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="duration"
                                    type="number"
                                    min={15}
                                    max={120}
                                    value={defaultPeriodDuration}
                                    onChange={(e) => setDefaultPeriodDuration(parseInt(e.target.value, 10) || 45)}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">minutes</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Working Days Display */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Working Days</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {DAYS.map((day) => (
                                    <span
                                        key={day.id}
                                        className={cn(
                                            "px-2 py-0.5 rounded text-xs font-medium",
                                            currentData.workingDays.includes(day.id)
                                                ? "bg-primary/10 text-primary"
                                                : "bg-muted/50 text-muted-foreground/50 line-through"
                                        )}
                                    >
                                        {day.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* School Hours Display */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">School Hours</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {formatTime(currentData.schoolStartTime)} — {formatTime(currentData.schoolEndTime)}
                            </p>
                        </div>

                        {/* Period Duration Display */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Timer className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Period Duration</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {currentData.defaultPeriodDuration} minutes
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
