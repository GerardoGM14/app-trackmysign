import React, { useState } from 'react';
import {
    BsGrid1X2,
    BsPeople,
    BsShieldLock,
    BsBuilding,
    BsSearch,
    BsBell,
    BsPerson,
    BsGem,
    BsBriefcase,
    BsPersonBadge,
    BsClipboardCheck,
    BsBoxArrowRight
} from 'react-icons/bs';
import { useAuth, type UserRole } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
    const { role, user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => signOut(auth);

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'superadmin': return <BsGem className="text-white" />;
            case 'admin': return <BsShieldLock className="text-white" />;
            case 'employee': return <BsBriefcase className="text-white" />;
            case 'client': return <BsPersonBadge className="text-white" />;
            default: return <BsBuilding className="text-white" />;
        }
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 flex flex-col transition-all duration-300`}>
                <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center shrink-0">
                        {getRoleIcon(role)}
                    </div>
                    {sidebarOpen && <span className="text-white font-black tracking-tighter uppercase text-sm truncate">TrackSign SaaS</span>}
                </div>

                <div className="p-4 shrink-0">
                    <div className={`bg-slate-800 p-3 rounded border border-slate-700 ${!sidebarOpen && 'text-center'}`}>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Role</p>
                        <p className="text-white text-[10px] font-black uppercase mt-2 truncate">
                            {sidebarOpen ? role : (role?.[0] || 'U')}
                        </p>
                    </div>
                </div>

                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    {role === 'superadmin' && (
                        <>
                            <NavItem icon={<BsGrid1X2 />} label="Overview" active sidebarOpen={sidebarOpen} />
                            <NavItem icon={<BsBuilding />} label="Tenants" sidebarOpen={sidebarOpen} />
                            <NavItem icon={<BsGem />} label="Billing" sidebarOpen={sidebarOpen} />
                        </>
                    )}
                    {role === 'admin' && (
                        <>
                            <NavItem icon={<BsGrid1X2 />} label="Dashboard" active sidebarOpen={sidebarOpen} />
                            <NavItem icon={<BsPeople />} label="Employees" sidebarOpen={sidebarOpen} />
                            <NavItem icon={<BsShieldLock />} label="Security" sidebarOpen={sidebarOpen} />
                        </>
                    )}
                    {role === 'employee' && (
                        <>
                            <NavItem icon={<BsGrid1X2 />} label="My Work" active sidebarOpen={sidebarOpen} />
                            <NavItem icon={<BsClipboardCheck />} label="Tasks" sidebarOpen={sidebarOpen} />
                        </>
                    )}
                    {role === 'client' && (
                        <>
                            <NavItem icon={<BsGrid1X2 />} label="Portal" active sidebarOpen={sidebarOpen} />
                            <NavItem icon={<BsSearch />} label="Track Order" sidebarOpen={sidebarOpen} />
                        </>
                    )}
                </nav>

                <div className="p-2 border-t border-slate-800 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-black uppercase text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                        <BsBoxArrowRight className="text-lg" />
                        {sidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
                <header className="h-16 bg-white px-8 flex items-center justify-between border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                            <BsGrid1X2 />
                        </button>
                        <div className="flex items-center gap-3 bg-slate-100 px-4 py-1.5 rounded border border-slate-200 w-64 md:w-80">
                            <BsSearch className="text-slate-400 text-sm" />
                            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full" />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative text-slate-500 hover:text-slate-800 transition-colors">
                            <BsBell className="text-lg" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-6 shrink-0">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black leading-none uppercase text-slate-400">User Profile</p>
                                <p className="text-xs font-bold text-slate-900 mt-1">{user?.email?.split('@')[0] || 'User'}</p>
                            </div>
                            <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center text-slate-500 border border-slate-300">
                                <BsPerson />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, sidebarOpen }: { icon: any, label: string, active?: boolean, sidebarOpen: boolean }) {
    return (
        <button
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                }`}
        >
            <span className="text-base shrink-0">{icon}</span>
            {sidebarOpen && <span className="truncate">{label}</span>}
        </button>
    );
}
