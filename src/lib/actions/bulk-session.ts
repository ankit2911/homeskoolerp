'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Generates an Excel template for bulk session creation.
 * Includes Boards, Classes, and Subjects data for dropdown validation.
 */
export async function generateSessionTemplate() {
    const ExcelJS = (await import('exceljs')).default;
    const boards = await db.board.findMany({ include: { classes: { include: { subjects: true } } } });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sessions');
    const dataSheet = workbook.addWorksheet('Data', { state: 'hidden' });

    // Main Headers
    sheet.columns = [
        { header: 'Board', key: 'board', width: 20 },
        { header: 'Class', key: 'class', width: 20 },
        { header: 'Subject', key: 'subject', width: 20 },
        { header: 'Start Date & Time (YYYY-MM-DD HH:MM)', key: 'startTime', width: 35 },
        { header: 'Duration (Minutes)', key: 'duration', width: 20 },
    ];

    // Helper columns for data validation
    // We'll flatten boards/classes/subjects into a hidden sheet for dropdown references
    let currentRow = 1;
    boards.forEach(board => {
        dataSheet.getCell(currentRow, 1).value = board.name;
        const boardClasses = board.classes;
        boardClasses.forEach((cls, idx) => {
            dataSheet.getCell(currentRow, 2 + idx).value = `${cls.name}${cls.section ? ` (${cls.section})` : ''}`;
            // Note: For complex cascading (Class dropdown depends on Board), ExcelJS data validation 
            // is tricky for multiple rows. To keep it simple but functional, we'll provide 
            // full lists or use named ranges if needed.
        });
        currentRow++;
    });

    // Simplified: Global lists for Boards, and for Classes/Subjects we'll provide valid options
    // in the first row. For true cascading, we'd need complex Excel formulas.
    // Instead, let's just provide the reference lists on the Data sheet.

    const boardRange = `'Data'!$A$1:$A$${boards.length}`;

    // Apply validations to first 100 rows
    for (let i = 2; i <= 101; i++) {
        sheet.getCell(i, 1).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [boardRange],
        };

        // For Class and Subject, since they depend on the previous selection, 
        // we'll leave them as free text but validate during upload OR 
        // use a large flat list of "Board - Class" combos for simple dropdown.
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Array.from(new Uint8Array(buffer));
}

/**
 * Parses uploaded Excel file into potentially valid session objects.
 */
export async function parseBulkSessions(formData: FormData) {
    const XLSX = await import('xlsx');
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file uploaded');

        const bytes = await file.arrayBuffer();
        const workbook = XLSX.read(bytes, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        // Fetch master data for mapping
        const boards = await db.board.findMany({
            include: {
                classes: {
                    include: {
                        subjects: true,
                        allocations: true
                    }
                }
            }
        });

        const results = rows.map((row, index) => {
            const boardName = row['Board'];
            const className = row['Class'];
            const subjectName = row['Subject'];
            const startTimeStr = row['Start Date & Time (YYYY-MM-DD HH:MM)'];
            const duration = parseInt(row['Duration (Minutes)'] || '60');

            let errors: string[] = [];
            let mappedBoard = boards.find(b => b.name === boardName);
            let mappedClass = mappedBoard?.classes.find(c => `${c.name}${c.section ? ` (${c.section})` : ''}` === className);
            let mappedSubject = mappedClass?.subjects.find(s => s.name === subjectName);

            if (!mappedBoard) errors.push(`Board "${boardName}" not found`);
            if (!mappedClass) errors.push(`Class "${className}" not found in ${boardName}`);
            if (!mappedSubject) errors.push(`Subject "${subjectName}" not found in ${className}`);

            let startTime: Date | null = null;
            if (startTimeStr) {
                startTime = new Date(startTimeStr);
                if (isNaN(startTime.getTime())) errors.push('Invalid Start Date/Time format');
            } else {
                errors.push('Start Date/Time is required');
            }

            // Auto-assign teacher
            let teacherId = null;
            let teacherName = 'Not Assigned';
            if (mappedClass && mappedSubject) {
                const allocation = mappedClass.allocations.find(a => a.subjectId === mappedSubject!.id);
                if (allocation) {
                    teacherId = allocation.teacherId;
                    // We'd need to fetch teacher name separately or include it in the query
                }
            }

            return {
                id: `row-${index}`,
                boardName,
                className,
                subjectName,
                startTime: startTime?.toISOString(),
                duration,
                classId: mappedClass?.id,
                subjectId: mappedSubject?.id,
                teacherId,
                errors,
                isValid: errors.length === 0
            };
        });

        // To get teacher names, fetch all teachers once
        const teachers = await db.teacherProfile.findMany({
            select: { id: true, firstName: true, lastName: true }
        });

        results.forEach(res => {
            if (res.teacherId) {
                const t = teachers.find(t => t.id === res.teacherId);
                (res as any).teacherName = t ? `${t.firstName} ${t.lastName}` : 'Unassigned';
            } else {
                (res as any).teacherName = 'Unassigned';
            }
        });

        return { success: true, sessions: results, allTeachers: teachers };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Commits multiple sessions to the database.
 */
export async function commitBulkSessions(sessions: any[]) {
    try {
        const createResults = await db.$transaction(
            sessions.map(s => {
                const start = new Date(s.startTime);
                const end = new Date(start.getTime() + (s.duration || 60) * 60000);

                // Use the same auto-title logic as client-side
                const datePart = start.toISOString().replace(/[-:T]/g, '').slice(2, 12);
                const academicYear = getAcademicYear();
                const sessionTitle = `${datePart}-${s.boardName}-${s.className}-${s.subjectName} (${academicYear})`;

                return db.session.create({
                    data: {
                        title: sessionTitle,
                        startTime: start,
                        endTime: end,
                        classId: s.classId,
                        subjectId: s.subjectId,
                        teacherId: s.teacherId || null,
                        status: 'SCHEDULED'
                    }
                });
            })
        );

        revalidatePath('/admin/sessions');
        return { success: true, count: createResults.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

function getAcademicYear(): string {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;
    return `${startYear.toString().slice(-2)}${endYear.toString().slice(-2)}`;
}
