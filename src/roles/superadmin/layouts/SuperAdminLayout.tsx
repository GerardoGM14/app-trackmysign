import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

interface LayoutProps {
    children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-800 antialiased overflow-hidden font-sans">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white/40 p-10 custom-scrollbar relative">
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
