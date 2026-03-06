import { useState, useRef, useEffect } from 'react';
import { BiWorld } from "react-icons/bi";
import {
    BsBell,
    BsChevronDown,
    BsPerson,
    BsGear,
    BsBoxArrowRight,
    BsList
} from 'react-icons/bs';
import { MdOutlineSignalWifi4Bar, MdOutlineSignalWifiConnectedNoInternet4 } from "react-icons/md";
import { LuBuilding2 } from "react-icons/lu";
import { useAuth } from '../../../context/AuthContext';

interface NavbarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
    const { user, setMockRole } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Monitoring connectivity
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=Admin`;

    return (
        <header className="h-16 bg-white px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0 relative z-20">
            {/* Left Side: Mobile Menu Button & Business Info Style */}
            <div className="flex items-center gap-2 sm:gap-6">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 transition-all"
                >
                    <BsList size={24} />
                </button>

                {/* Company Info - Always visible */}
                <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
                    <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                        <LuBuilding2 size={22} />
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold text-slate-400 leading-none mb-0.5">Company</p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-semibold text-slate-700 tracking-tight">TrackMySign S.A.</span>
                            <BsChevronDown size={10} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-1" />

                {/* Location Info - Always visible */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                        <BiWorld size={22} />
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold text-slate-400 leading-none mb-0.5">Location</p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-semibold text-slate-700 tracking-tight">United States</span>
                            <BsChevronDown size={10} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Actions & Profile */}
            <div className="flex items-center gap-2 sm:gap-5">
                <div className="h-9 w-px bg-slate-100 mx-1 hidden md:block" />

                {/* Dynamic Connectivity Icon (Simplified) */}
                <div className="flex items-center justify-center cursor-pointer">
                    {isOnline ? (
                        <MdOutlineSignalWifi4Bar size={22} className="text-emerald-500" />
                    ) : (
                        <MdOutlineSignalWifiConnectedNoInternet4 size={22} className="text-rose-500" />
                    )}
                </div>

                {/* Notifications */}
                <button className="relative text-slate-400 hover:text-blue-600 transition-all p-1 cursor-pointer">
                    <BsBell className="text-lg sm:text-[20px]" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={`
                            flex items-center gap-2 p-1 rounded-xl transition-all duration-200 cursor-pointer
                            ${dropdownOpen ? 'scale-95' : ''}
                        `}
                    >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                        </div>
                    </button>

                    {/* Profile Menu Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 animate-in fade-in slide-in-from-top-4 duration-200 overflow-hidden">
                            {/* User Info Header */}
                            <div className="px-2 mb-1">
                                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50">
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-white shadow-sm shrink-0">
                                        <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold font-sans text-slate-800 truncate leading-tight">{user?.email}</p>
                                        <span className="text-[12px] font-semibold text-slate-400">Signed in as Super Admin</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-px bg-slate-100 mx-4 mb-1" />

                            {/* Menu Items */}
                            <div className="px-2 space-y-1">
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all group">
                                    <BsPerson className="text-slate-400 group-hover:text-blue-500" size={18} />
                                    View Profile
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all group">
                                    <BsGear className="text-slate-400 group-hover:text-blue-500" size={18} />
                                    Account Settings
                                </button>
                                <div className="h-px bg-slate-100 mx-4 my-1" />
                                <button
                                    onClick={() => setMockRole(null)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-all group"
                                >
                                    <BsBoxArrowRight className="group-hover:translate-x-0.5 transition-transform" size={18} />
                                    Sign Out Platform
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
