import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

interface LayoutProps {
    children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: LayoutProps) {
    const isDesktop = () => window.innerWidth >= 1024;

    // On desktop: controls expand/collapse (w-64 vs w-20)
    // On mobile: controls whether the drawer is open or closed
    const [sidebarOpen, setSidebarOpen] = useState(isDesktop());
    // Tracks whether we're on mobile to manage the drawer backdrop
    const [isMobile, setIsMobile] = useState(!isDesktop());

    useEffect(() => {
        const handleResize = () => {
            const desktop = isDesktop();
            setIsMobile(!desktop);
            // When switching to mobile, close the drawer by default
            if (!desktop) setSidebarOpen(false);
            // When switching back to desktop, restore the sidebar open
            if (desktop) setSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-800 antialiased overflow-hidden font-sans">
            {/* Backdrop overlay — only on mobile when drawer is open */}
            {isMobile && (
                <div
                    className={`fixed inset-0 bg-slate-900/50 z-[60] transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar wrapper: fixed drawer on mobile, static on desktop */}
            <div className={`
                ${isMobile
                    ? `fixed inset-y-0 left-0 z-[70] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                    : 'relative z-auto shrink-0'
                }
            `}>
                <Sidebar sidebarOpen={isMobile ? true : sidebarOpen} setSidebarOpen={setSidebarOpen} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white/40 p-4 sm:p-6 lg:p-10 custom-scrollbar relative">
                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-200/40 blur-[120px] rounded-full -ml-48 -mb-48 pointer-events-none" />

                    <div className="relative z-10 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
