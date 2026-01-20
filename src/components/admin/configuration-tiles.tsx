'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, School, Layers, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigurationTileProps {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    onClick: () => void;
}

function ConfigurationTile({ title, description, icon: Icon, color, onClick }: ConfigurationTileProps) {
    return (
        <Card
            className="group cursor-pointer border-0 shadow-elevation-1 transition-base hover:shadow-elevation-2 active:scale-[0.98]"
            onClick={onClick}
        >
            <CardContent className="p-4 flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl shrink-0 transition-colors", color)}>
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground mb-0.5 group-hover:text-primary transition-colors">{title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export function ConfigurationTiles({
    onAction
}: {
    onAction: (action: 'create-board' | 'create-class' | 'bulk-map') => void
}) {
    const tiles: { id: 'create-board' | 'create-class' | 'bulk-map'; title: string; description: string; icon: LucideIcon; color: string }[] = [
        {
            id: 'create-board',
            title: 'Define Board',
            description: 'CBSE, ICSE, IGCSE etc.',
            icon: School,
            color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
            id: 'create-class',
            title: 'Add New Class',
            description: 'Define grade and section',
            icon: Layers,
            color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        },
        {
            id: 'bulk-map',
            title: 'Subject Configuration',
            description: 'Define global subjects and codes',
            icon: BookOpen,
            color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {tiles.map((tile) => (
                <ConfigurationTile
                    key={tile.id}
                    title={tile.title}
                    description={tile.description}
                    icon={tile.icon}
                    color={tile.color}
                    onClick={() => onAction(tile.id)}
                />
            ))}
        </div>
    );
}
