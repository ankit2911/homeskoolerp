'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, GraduationCap, Briefcase, FilterX, Send } from 'lucide-react';
import { useState, useTransition } from 'react';

export function TeacherFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Local state for staged filters
    const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
    const [qualification, setQualification] = useState(searchParams.get('qualification') || 'all');
    const [experience, setExperience] = useState(searchParams.get('experience') || 'all');

    const handleApply = () => {
        const params = new URLSearchParams();

        if (specialization.trim()) params.set('specialization', specialization.trim());
        if (qualification !== 'all') params.set('qualification', qualification);
        if (experience !== 'all') params.set('experience', experience);

        startTransition(() => {
            router.replace(`?${params.toString()}`, { scroll: false });
        });
    };

    const handleReset = () => {
        setSpecialization('');
        setQualification('all');
        setExperience('all');

        startTransition(() => {
            router.replace('?', { scroll: false });
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-black/40 p-4 rounded-xl border shadow-sm items-end transition-all duration-300">
            <div className="flex-1 space-y-1.5 w-full">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Subject / Specialization</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search subjects..."
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="pl-9 h-10 bg-muted/5 border-muted-foreground/10 focus:border-primary/30 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                    />
                </div>
            </div>

            <div className="w-full md:w-[200px] space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Qualification</label>
                <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={qualification} onValueChange={setQualification}>
                        <SelectTrigger className="pl-9 h-10 bg-muted/5 border-muted-foreground/10">
                            <SelectValue placeholder="Qualification" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Qualifications</SelectItem>
                            <SelectItem value="Bachelors">Bachelors Degree</SelectItem>
                            <SelectItem value="Masters">Masters Degree</SelectItem>
                            <SelectItem value="PhD">PhD / Doctorate</SelectItem>
                            <SelectItem value="Diploma">Diploma</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="w-full md:w-[180px] space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Min Experience</label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={experience} onValueChange={setExperience}>
                        <SelectTrigger className="pl-9 h-10 bg-muted/5 border-muted-foreground/10">
                            <SelectValue placeholder="Experience" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any Experience</SelectItem>
                            <SelectItem value="2">2+ Years</SelectItem>
                            <SelectItem value="5">5+ Years</SelectItem>
                            <SelectItem value="10">10+ Years</SelectItem>
                            <SelectItem value="15">15+ Years</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto pt-2 md:pt-0">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    className="h-10 w-10 shrink-0 border-dashed hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all"
                    title="Reset Filters"
                >
                    <FilterX className="h-4 w-4" />
                </Button>
                <Button
                    onClick={handleApply}
                    disabled={isPending}
                    className="h-10 px-6 vibrant flex-1 gap-2 shadow-sm font-bold active:scale-95 transition-all"
                >
                    {isPending ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send className="h-3.5 w-3.5" />
                    )}
                    Apply
                </Button>
            </div>
        </div>
    );
}
