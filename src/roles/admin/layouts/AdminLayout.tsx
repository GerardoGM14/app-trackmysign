import { useEffect, useState, type ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

interface LayoutProps {
    children: ReactNode;
}

const DESKTOP_BREAKPOINT = 1024;

export default function AdminLayout({ children }: LayoutProps) {
    const isDesktop = () => window.innerWidth >= DESKTOP_BREAKPOINT;

    const [sidebarOpen, setSidebarOpen] = useState(isDesktop());
    const [isMobile, setIsMobile] = useState(!isDesktop());

    useEffect(() => {
        const handleResize = () => {
            const desktop = isDesktop();
            setIsMobile(!desktop);
            if (!desktop) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-900 antialiased overflow-hidden">
            {isMobile && (
                <div
                    className={`fixed inset-0 bg-slate-950/40 z-[60] transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div
                className={`${isMobile
                        ? `fixed inset-y-0 left-0 z-[70] transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                        : 'relative z-auto shrink-0'
                    }`}
            >
                <Sidebar sidebarOpen={isMobile ? true : sidebarOpen} setSidebarOpen={setSidebarOpen} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6 lg:py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
