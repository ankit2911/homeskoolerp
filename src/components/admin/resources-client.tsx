'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import {
    Plus, Edit2, FileText, Video, Link as LinkIcon, BookOpen, Search, RotateCcw,
    ClipboardCheck, BookMarked, PlayCircle, CheckSquare, RefreshCw, Image,
    Upload, X, File, Loader2, ExternalLink
} from 'lucide-react';
import { DeleteConfirm } from '@/components/admin/delete-confirm';
import { createResource, updateResource, deleteResource } from '@/lib/actions/resources';

// Resource types (purpose of the resource)
const RESOURCE_TYPES = {
    NOTES: { label: 'Notes', icon: FileText, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    QUIZ: { label: 'Quiz', icon: ClipboardCheck, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    PRE_CLASS: { label: 'Pre-Class', icon: PlayCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    POST_CLASS: { label: 'Post-Class', icon: CheckSquare, color: 'bg-green-50 text-green-700 border-green-200' },
    REVISION: { label: 'Revision', icon: RefreshCw, color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

// Content/File types
const CONTENT_TYPES = {
    PDF: { label: 'PDF Document', icon: FileText, accept: '.pdf', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    IMAGE: { label: 'Image', icon: Image, accept: '.jpg,.jpeg,.png,.gif,.webp', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    VIDEO: { label: 'Video', icon: Video, accept: '.mp4,.webm,.mov', color: 'bg-red-50 text-red-700 border-red-200' },
    LINK: { label: 'External Link', icon: ExternalLink, accept: '', color: 'bg-gray-50 text-gray-700 border-gray-200' },
};

type FileData = {
    id?: string;
    url: string;
    fileName: string | null;
    fileSize: number | null;
    fileType: string;
};

type Topic = { id: string; name: string; description: string | null; chapterId: string };
type Chapter = { id: string; name: string; subjectId: string; topics: Topic[] };
type Subject = { id: string; name: string; classId: string; chapters: Chapter[] };
type Class = { id: string; name: string; section: string | null; boardId: string; subjects: Subject[] };
type Board = { id: string; name: string; classes: Class[] };

type Resource = {
    id: string;
    title: string;
    description: string | null;
    type: string;
    classId: string;
    subjectId: string;
    topicId: string | null;
    createdAt: string;
    class: { id: string; name: string; board: { name: string } };
    subject: { id: string; name: string };
    topic: { id: string; name: string; chapter: { name: string } } | null;
    files: FileData[];
};

type ResourcesClientProps = {
    resources: Resource[];
    boards: Board[];
};

export function ResourcesClient({ resources, boards }: ResourcesClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [boardFilter, setBoardFilter] = useState<string>('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Form state for add dialog
    const [selectedContentType, setSelectedContentType] = useState<string>('PDF');
    const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
    const [linkUrl, setLinkUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Flatten topics for selection
    const allTopics = useMemo(() => {
        return boards.flatMap(b =>
            b.classes.flatMap(c =>
                c.subjects.flatMap(s =>
                    s.chapters.flatMap(ch =>
                        ch.topics.map(t => ({
                            ...t,
                            chapterName: ch.name,
                            subjectName: s.name,
                            subjectId: s.id,
                            className: c.name,
                            classId: c.id,
                            boardName: b.name
                        }))
                    )
                )
            )
        );
    }, [boards]);

    // Flatten subjects for selection
    const allSubjects = useMemo(() => {
        return boards.flatMap(b =>
            b.classes.flatMap(c =>
                c.subjects.map(s => ({
                    ...s,
                    className: c.name,
                    classId: c.id,
                    boardName: b.name
                }))
            )
        );
    }, [boards]);

    // Filtered resources
    const filteredResources = useMemo(() => {
        return resources.filter(res => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matches =
                    res.title.toLowerCase().includes(query) ||
                    res.description?.toLowerCase().includes(query) ||
                    res.class.name.toLowerCase().includes(query) ||
                    res.subject.name.toLowerCase().includes(query) ||
                    res.topic?.name.toLowerCase().includes(query);
                if (!matches) return false;
            }
            if (typeFilter !== 'all' && res.type !== typeFilter) return false;
            if (boardFilter !== 'all' && res.class.board.name !== boardFilter) return false;
            return true;
        });
    }, [resources, searchQuery, typeFilter, boardFilter]);

    // Stats
    const stats = useMemo(() => {
        const byType: Record<string, number> = {};
        resources.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });
        return {
            total: resources.length,
            linked: resources.filter(r => r.topicId).length,
            byType
        };
    }, [resources]);

    const getTypeConfig = (type: string) => {
        return RESOURCE_TYPES[type as keyof typeof RESOURCE_TYPES] || RESOURCE_TYPES.NOTES;
    };

    const getContentTypeConfig = (type: string) => {
        return CONTENT_TYPES[type as keyof typeof CONTENT_TYPES] || CONTENT_TYPES.PDF;
    };

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (uploadedFiles.length + files.length > 5) {
            alert('Maximum 5 files allowed per resource');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.error) {
                alert(result.error);
            } else if (result.files) {
                setUploadedFiles(prev => [...prev, ...result.files]);
            }
        } catch (error) {
            alert('Failed to upload files');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Add link as file
    const handleAddLink = () => {
        if (!linkUrl.trim()) return;
        if (uploadedFiles.length >= 5) {
            alert('Maximum 5 files/links allowed per resource');
            return;
        }
        setUploadedFiles(prev => [...prev, {
            url: linkUrl,
            fileName: linkUrl,
            fileSize: 0,
            fileType: 'LINK'
        }]);
        setLinkUrl('');
    };

    // Remove uploaded file
    const removeUploadedFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Reset form
    const resetForm = () => {
        setSelectedContentType('PDF');
        setUploadedFiles([]);
        setLinkUrl('');
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</p>
                            <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70">Total Resources</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.linked}</p>
                            <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">Topic Linked</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20">
                            <ClipboardCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.byType['QUIZ'] || 0}</p>
                            <p className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70">Quizzes</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
                            <BookMarked className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.byType['NOTES'] || 0}</p>
                            <p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">Notes</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search, Filters & Add Button */}
            <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-800/30">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search resources..."
                            className="pl-10 h-9 bg-white dark:bg-gray-900 border-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-gray-900">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.entries(RESOURCE_TYPES).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={boardFilter} onValueChange={setBoardFilter}>
                        <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-gray-900">
                            <SelectValue placeholder="Board" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Boards</SelectItem>
                            {boards.map(b => (
                                <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(searchQuery || typeFilter !== 'all' || boardFilter !== 'all') && (
                        <Button variant="ghost" size="sm" className="h-9 text-gray-400" onClick={() => {
                            setSearchQuery('');
                            setTypeFilter('all');
                            setBoardFilter('all');
                        }}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    )}

                    {/* Add Resource Dialog */}
                    <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                        setIsAddDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="font-bold h-9 shadow-md shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> Add Resource
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white dark:bg-gray-900 max-h-[90vh]">
                            <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-heading flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Add New Resource
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                                        Upload study materials (up to 5 files, max 10MB each) linked to curriculum topics.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                <form action={async (formData) => {
                                    const topicId = formData.get('topicId') as string;
                                    if (topicId === 'none') {
                                        formData.delete('topicId');
                                    }
                                    const selectedTopicId = formData.get('topicId') as string;
                                    if (selectedTopicId && selectedTopicId !== 'none') {
                                        const topic = allTopics.find(t => t.id === selectedTopicId);
                                        if (topic) {
                                            formData.set('classId', topic.classId);
                                            formData.set('subjectId', topic.subjectId);
                                        }
                                    } else {
                                        const combined = formData.get('subjectCombined') as string;
                                        if (combined) {
                                            const [subjectId, classId] = combined.split('|');
                                            formData.set('subjectId', subjectId);
                                            formData.set('classId', classId);
                                        }
                                    }
                                    // Add files data
                                    formData.set('files', JSON.stringify(uploadedFiles));
                                    await createResource(formData);
                                    setIsAddDialogOpen(false);
                                    resetForm();
                                }} className="space-y-6">
                                    {/* Basic Info Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b pb-1">
                                            <FileText className="h-4 w-4 text-primary" />
                                            <h3 className="font-heading font-bold text-sm">Basic Information</h3>
                                        </div>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label className="text-xs font-bold">Title <span className="text-red-500">*</span></Label>
                                                <Input name="title" placeholder="e.g. Chapter 1 - Introduction to Algebra" required />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs font-bold">Description</Label>
                                                <Textarea name="description" placeholder="Describe the resource content..." rows={2} className="resize-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resource Type Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b pb-1">
                                            <BookMarked className="h-4 w-4 text-primary" />
                                            <h3 className="font-heading font-bold text-sm">Resource Type</h3>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
                                            {Object.entries(RESOURCE_TYPES).map(([key, config]) => {
                                                const Icon = config.icon;
                                                return (
                                                    <label key={key} className="relative">
                                                        <input type="radio" name="type" value={key} className="peer sr-only" defaultChecked={key === 'NOTES'} />
                                                        <div className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all peer-checked:ring-2 peer-checked:ring-primary peer-checked:border-primary hover:bg-gray-50 ${config.color}`}>
                                                            <Icon className="h-5 w-5" />
                                                            <span className="text-[10px] font-medium text-center">{config.label}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Curriculum Link Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b pb-1">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                            <h3 className="font-heading font-bold text-sm">Curriculum Link</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label className="text-xs font-bold">Topic <span className="text-xs text-muted-foreground font-normal">(recommended)</span></Label>
                                                <Select name="topicId" defaultValue="none">
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select topic..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[250px]">
                                                        <SelectItem value="none">No specific topic</SelectItem>
                                                        {allTopics.map(t => (
                                                            <SelectItem key={t.id} value={t.id} className="text-xs">
                                                                {t.boardName} / {t.className} / {t.subjectName} / {t.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs font-bold">Or Class/Subject <span className="text-xs text-muted-foreground font-normal">(if no topic)</span></Label>
                                                <Select name="subjectCombined">
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {allSubjects.map(s => (
                                                            <SelectItem key={`${s.classId}-${s.id}`} value={`${s.id}|${s.classId}`} className="text-xs">
                                                                {s.boardName} / {s.className} / {s.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resource Content Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b pb-1">
                                            <Upload className="h-4 w-4 text-primary" />
                                            <h3 className="font-heading font-bold text-sm">Resource Content</h3>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground -mt-3">Upload files or add external links (up to 5 items, max 10MB per file)</p>

                                        {/* Content Type Selector */}
                                        <div className="flex gap-2">
                                            {Object.entries(CONTENT_TYPES).map(([key, config]) => {
                                                const Icon = config.icon;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setSelectedContentType(key)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${selectedContentType === key
                                                            ? 'ring-2 ring-primary border-primary ' + config.color
                                                            : 'hover:bg-gray-50 border-gray-200'
                                                            }`}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                        {config.label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Upload Area or Link Input */}
                                        {selectedContentType === 'LINK' ? (
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="https://..."
                                                    value={linkUrl}
                                                    onChange={(e) => setLinkUrl(e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Button type="button" variant="outline" onClick={handleAddLink} disabled={!linkUrl.trim()}>
                                                    <Plus className="h-4 w-4 mr-1" /> Add Link
                                                </Button>
                                            </div>
                                        ) : (
                                            <div
                                                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    multiple
                                                    accept={CONTENT_TYPES[selectedContentType as keyof typeof CONTENT_TYPES].accept}
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                                {isUploading ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                        <p className="text-sm text-muted-foreground">Uploading...</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Upload className="h-8 w-8 text-gray-400" />
                                                        <p className="text-sm font-medium">Click to upload {CONTENT_TYPES[selectedContentType as keyof typeof CONTENT_TYPES].label}</p>
                                                        <p className="text-xs text-muted-foreground">or drag and drop files here</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Uploaded Files List */}
                                        {uploadedFiles.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold">Uploaded Content ({uploadedFiles.length}/5)</Label>
                                                <div className="space-y-2">
                                                    {uploadedFiles.map((file, index) => {
                                                        const typeConfig = getContentTypeConfig(file.fileType);
                                                        const Icon = typeConfig.icon;
                                                        return (
                                                            <div key={index} className={`flex items-center justify-between p-2.5 rounded-lg border ${typeConfig.color}`}>
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                                                    <span className="text-xs font-medium truncate">{file.fileName}</span>
                                                                    {file.fileSize ? (
                                                                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatFileSize(file.fileSize)}</span>
                                                                    ) : null}
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                                                                    onClick={() => removeUploadedFile(index)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <DialogFooter className="pt-2">
                                        <Button type="submit" className="w-full h-11 font-bold text-base shadow-md shadow-primary/20" disabled={uploadedFiles.length === 0}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Resource
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {/* Resources Table */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider w-[100px]">Type</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider">Title</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider w-[200px]">Curriculum</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider w-[150px]">Content</TableHead>
                            <TableHead className="text-right py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[11px] tracking-wider w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredResources.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground bg-muted/5">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-8 w-8 opacity-20" />
                                        <p className="font-medium">{searchQuery || typeFilter !== 'all' || boardFilter !== 'all' ? 'No matching resources.' : 'No resources uploaded yet.'}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredResources.map(res => {
                                const typeConfig = getTypeConfig(res.type);
                                const Icon = typeConfig.icon;

                                return (
                                    <TableRow key={res.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-b border-gray-50 dark:border-gray-800">
                                        <TableCell>
                                            <Badge variant="outline" className={`${typeConfig.color} text-[10px] font-bold`}>
                                                <Icon className="h-3 w-3 mr-1" />
                                                {typeConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p className="font-semibold text-gray-900 dark:text-white">{res.title}</p>
                                                {res.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{res.description}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="font-medium">{res.class.name}</span>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span className="text-muted-foreground">{res.subject.name}</span>
                                                </div>
                                                {res.topic && (
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                                                        <BookOpen className="h-2.5 w-2.5 mr-1" />
                                                        {res.topic.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {res.files.map((file, idx) => {
                                                    const contentConfig = getContentTypeConfig(file.fileType);
                                                    const FileIcon = contentConfig.icon;
                                                    return (
                                                        <a
                                                            key={idx}
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${contentConfig.color} hover:opacity-80`}
                                                        >
                                                            <FileIcon className="h-3 w-3" />
                                                            {file.fileType}
                                                        </a>
                                                    );
                                                })}
                                                {res.files.length === 0 && (
                                                    <span className="text-xs text-muted-foreground italic">No files</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50">
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[550px]">
                                                        <DialogHeader>
                                                            <DialogTitle className="font-heading">Edit Resource</DialogTitle>
                                                        </DialogHeader>
                                                        <EditResourceForm
                                                            resource={res}
                                                            allTopics={allTopics}
                                                            allSubjects={allSubjects}
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                                <DeleteConfirm onDelete={() => deleteResource(res.id)} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// Edit Resource Form Component
function EditResourceForm({ resource, allTopics, allSubjects }: {
    resource: Resource;
    allTopics: any[];
    allSubjects: any[];
}) {
    const [uploadedFiles, setUploadedFiles] = useState<FileData[]>(resource.files);
    const [selectedContentType, setSelectedContentType] = useState<string>('PDF');
    const [linkUrl, setLinkUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getContentTypeConfig = (type: string) => {
        return CONTENT_TYPES[type as keyof typeof CONTENT_TYPES] || CONTENT_TYPES.PDF;
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (uploadedFiles.length + files.length > 5) {
            alert('Maximum 5 files allowed');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.files) {
                setUploadedFiles(prev => [...prev, ...result.files]);
            }
        } catch (error) {
            alert('Failed to upload');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddLink = () => {
        if (!linkUrl.trim() || uploadedFiles.length >= 5) return;
        setUploadedFiles(prev => [...prev, { url: linkUrl, fileName: linkUrl, fileSize: 0, fileType: 'LINK' }]);
        setLinkUrl('');
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <form action={async (formData) => {
            const topicId = formData.get('topicId') as string;
            if (topicId === 'none') formData.delete('topicId');
            const combined = formData.get('subjectCombined') as string;
            if (combined) {
                const [subjectId, classId] = combined.split('|');
                formData.set('subjectId', subjectId);
                formData.set('classId', classId);
            }
            formData.set('files', JSON.stringify(uploadedFiles));
            await updateResource(formData);
        }} className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto">
            <input type="hidden" name="id" value={resource.id} />

            {/* Basic Info Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-bold text-sm">Basic Information</h3>
                </div>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold">Title <span className="text-red-500">*</span></Label>
                        <Input name="title" defaultValue={resource.title} required />
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold">Description</Label>
                        <Textarea name="description" defaultValue={resource.description || ''} rows={2} className="resize-none" />
                    </div>
                </div>
            </div>

            {/* Resource Type Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-1">
                    <BookMarked className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-bold text-sm">Resource Type</h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {Object.entries(RESOURCE_TYPES).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                            <label key={key} className="relative">
                                <input type="radio" name="type" value={key} className="peer sr-only" defaultChecked={resource.type === key} />
                                <div className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all peer-checked:ring-2 peer-checked:ring-primary peer-checked:border-primary hover:bg-gray-50 ${config.color}`}>
                                    <Icon className="h-5 w-5" />
                                    <span className="text-[10px] font-medium text-center">{config.label}</span>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Curriculum Link Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-1">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-bold text-sm">Curriculum Link</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold">Topic</Label>
                        <Select name="topicId" defaultValue={resource.topicId || 'none'}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select topic..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                <SelectItem value="none">No specific topic</SelectItem>
                                {allTopics.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id} className="text-xs">
                                        {t.boardName} / {t.className} / {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold">Class / Subject</Label>
                        <Select name="subjectCombined" defaultValue={`${resource.subjectId}|${resource.classId}`}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {allSubjects.map((s: any) => (
                                    <SelectItem key={`${s.classId}-${s.id}`} value={`${s.id}|${s.classId}`} className="text-xs">
                                        {s.boardName} / {s.className} / {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Resource Content Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-1">
                    <Upload className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-bold text-sm">Resource Content ({uploadedFiles.length}/5)</h3>
                </div>

                {/* Existing Files */}
                {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                        {uploadedFiles.map((file, index) => {
                            const typeConfig = getContentTypeConfig(file.fileType);
                            const Icon = typeConfig.icon;
                            return (
                                <div key={index} className={`flex items-center justify-between p-2.5 rounded-lg border ${typeConfig.color}`}>
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-xs font-medium truncate">{file.fileName}</span>
                                        {file.fileSize ? (
                                            <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatFileSize(file.fileSize)}</span>
                                        ) : null}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-gray-400 hover:text-red-500"
                                        onClick={() => removeFile(index)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add More Content */}
                {uploadedFiles.length < 5 && (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            {Object.entries(CONTENT_TYPES).map(([key, config]) => {
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedContentType(key)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${selectedContentType === key
                                                ? 'ring-2 ring-primary border-primary ' + config.color
                                                : 'hover:bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>

                        {selectedContentType === 'LINK' ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="flex-1 h-9"
                                />
                                <Button type="button" variant="outline" size="sm" onClick={handleAddLink} disabled={!linkUrl.trim()}>
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                        ) : (
                            <div
                                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept={CONTENT_TYPES[selectedContentType as keyof typeof CONTENT_TYPES].accept}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                {isUploading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                        <span className="text-sm text-muted-foreground">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <Upload className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm font-medium">Click to upload {CONTENT_TYPES[selectedContentType as keyof typeof CONTENT_TYPES].label}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <DialogFooter className="pt-2">
                <Button type="submit" className="w-full h-10 font-bold shadow-md shadow-primary/20">
                    <Edit2 className="mr-2 h-4 w-4" /> Update Resource
                </Button>
            </DialogFooter>
        </form>
    );
}
