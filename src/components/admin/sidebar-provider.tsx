'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type SidebarContextType = {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Load preference from localStorage on mount
    useEffect(() => {
        // Use a microtask to avoid "cascading render" error in ESLint
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
            queueMicrotask(() => {
                setIsCollapsed(saved === 'true');
            });
        }
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem('sidebar-collapsed', String(newState));
            return newState;
        });
    };

    const setCollapsed = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
        localStorage.setItem('sidebar-collapsed', String(collapsed));
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
