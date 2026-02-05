// Calendar entry types and constants
export const CALENDAR_ENTRY_TYPES = {
    HOLIDAY: 'HOLIDAY',
    SCHOOL_EVENT: 'SCHOOL_EVENT',
    EXAM_DAY: 'EXAM_DAY',
    HALF_DAY: 'HALF_DAY',
} as const;

export type CalendarEntryType = typeof CALENDAR_ENTRY_TYPES[keyof typeof CALENDAR_ENTRY_TYPES];

export type CalendarEntryData = {
    date: string; // ISO date string
    endDate?: string | null;
    type: CalendarEntryType;
    title: string;
    description?: string | null;
};

export type CalendarEntry = {
    id: string;
    date: Date;
    endDate: Date | null;
    type: string;
    title: string;
    description: string | null;
};
