export type Topic = {
    id: string;
    name: string;
    description?: string | null;
    chapterId?: string;
    _count?: { resources: number };
};

export type Chapter = {
    id: string;
    name: string;
    subjectId?: string;
    topics: Topic[];
};

export type Subject = {
    id: string;
    name: string;
    classId?: string;
    chapters: Chapter[];
};

export type ClassType = {
    id: string;
    name: string;
    section: string | null;
    board: { name: string };
    subjects: Subject[];
};

export type TeacherType = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    specialization: string | null;
    experience?: number | null;
    qualification?: string | null;
};

export type Session = {
    id: string;
    title: string;
    description: string | null;
    startTime: string | Date;
    endTime: string | Date;
    status: string;
    classId: string;
    subjectId: string;
    chapterId: string | null;
    topicId: string | null;
    teacherId: string | null;
    class: { id: string; name: string; section: string | null; board: { name: string } };
    subject: { id: string; name: string };
    chapter?: { id: string; name: string } | null;
    teacher?: { id: string; firstName: string | null; lastName: string | null } | null;
};

export type AllocationType = {
    teacherId: string;
    classId: string;
    subjectId: string;
};

export const SESSION_STATUS = {
    SCHEDULED: 'SCHEDULED',
    IN_PROGRESS: 'IN_PROGRESS',
    PENDING_LOG: 'PENDING_LOG',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
} as const;
