import { useState, useRef, useEffect } from 'react';
import {
    BsBell,
    BsChevronDown,
    BsBuilding,
    BsGeoAlt,
    BsPerson,
    BsGear,
    BsBoxArrowRight
} from 'react-icons/bs';
import {
    MdOutlineSignalWifi4Bar,
    MdOutlineSignalWifiConnectedNoInternet4
} from "react-icons/md";
import { useAuth } from '../../../context/AuthContext';

interface NavbarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ }: NavbarProps) {
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
        <header className="h-16 bg-white px-6 flex items-center justify-between border-b border-slate-100 shrink-0 relative z-40">
            {/* Left Side: Business Info Style (Reference specific) */}
            <div className="flex items-center gap-6">
                {/* Company Info */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                        <BsBuilding size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 leading-none mb-1">Company</p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-700 tracking-tight">TrackMySign S.A.</span>
                            <BsChevronDown size={10} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-100 mx-1" />

                {/* Location Info */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                        <BsGeoAlt size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 leading-none mb-1">Location</p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-700 tracking-tight">United States</span>
                            <BsChevronDown size={10} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Actions & Profile */}
            <div className="flex items-center gap-5">
                {/* Dynamic Connectivity Icon */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 p-2 rounded-xl transition-all ${isOnline ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {isOnline ? (
                            <MdOutlineSignalWifi4Bar size={22} />
                        ) : (
                            <MdOutlineSignalWifiConnectedNoInternet4 size={22} />
                        )}
                        <span className="text-[10px] font-bold tracking-tight uppercase">
                            {isOnline ? 'Fast' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Notifications */}
                <button className="relative text-slate-400 hover:text-blue-600 transition-all p-1">
                    <BsBell size={20} />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={`
                            flex items-center gap-2 p-1 rounded-xl transition-all duration-200
                            ${dropdownOpen ? 'scale-95' : 'hover:opacity-80'}
                        `}
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                        </div>
                    </button>

                    {/* Profile Menu Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 animate-in fade-in slide-in-from-top-4 duration-200 overflow-hidden">
                            {/* User Info Header */}
                            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30 mb-2 text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                                <p className="text-sm font-bold text-slate-800 truncate mb-1">{user?.email}</p>
                                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase tracking-tight">
                                    Super Admin
                                </span>
                            </div>

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
                                <div className="h-px bg-slate-50 mx-4 my-2" />
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
