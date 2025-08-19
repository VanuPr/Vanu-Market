
"use client"

import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminHeader({ children }: { children?: React.ReactNode }) {
    return (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="ml-auto flex items-center gap-2">
                {children}
            </div>
        </header>
    )
}
