import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
    'application/pdf': 'PDF',
    'image/jpeg': 'IMAGE',
    'image/png': 'IMAGE',
    'image/gif': 'IMAGE',
    'image/webp': 'IMAGE',
    'video/mp4': 'VIDEO',
    'video/webm': 'VIDEO',
    'video/quicktime': 'VIDEO',
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        if (files.length > 5) {
            return NextResponse.json({ error: 'Maximum 5 files allowed' }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resources');

        // Ensure upload directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const uploadedFiles: { url: string; fileName: string; fileSize: number; fileType: string }[] = [];

        for (const file of files) {
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File "${file.name}" exceeds 10MB limit` },
                    { status: 400 }
                );
            }

            // Validate file type
            const fileType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
            if (!fileType) {
                return NextResponse.json(
                    { error: `File type "${file.type}" not allowed. Allowed: PDF, Images, Videos` },
                    { status: 400 }
                );
            }

            // Generate unique filename
            const ext = path.extname(file.name);
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const uniqueName = `${timestamp}-${randomStr}${ext}`;
            const filePath = path.join(uploadDir, uniqueName);

            // Write file to disk
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            uploadedFiles.push({
                url: `/uploads/resources/${uniqueName}`,
                fileName: file.name,
                fileSize: file.size,
                fileType: fileType,
            });
        }

        return NextResponse.json({ files: uploadedFiles });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
    }
}
