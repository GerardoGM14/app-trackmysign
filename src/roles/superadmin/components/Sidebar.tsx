import {
    BsGrid1X2,
    BsBuilding,
    BsGraphUp,
    BsShieldLock,
    BsPersonVcard,
    BsCloud,
    BsChevronLeft,
    BsChevronRight
} from 'react-icons/bs';
import logoAlt from '../../../assets/SuperAdmin/icon-trackmysign-alt.png';
import loaderIcon from '../../../assets/Loader/icon-trackmysign.png';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {

    return (
        <aside
            className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#111936] flex flex-col transition-all duration-300 relative z-20 shrink-0 border-r border-white/5 group/sidebar`}
        >
            {/* Logo Area & Toggle Pestañita */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0 relative">
                <div className="flex items-center">
                    {sidebarOpen ? (
                        <div className="flex items-center">
                            <img
                                src={logoAlt}
                                alt="TrackSign"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                    ) : (
                        <div className="w-9 h-9 flex items-center justify-center shrink-0">
                            <img
                                src={loaderIcon}
                                alt="TS"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* The "Pestañita" Toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`
                        absolute -right-3 top-1/2 -translate-y-1/2 
                        w-6 h-6 bg-[#111936] border border-white/10 rounded-full 
                        flex items-center justify-center text-white/40 hover:text-white hover:bg-blue-600 
                        transition-all duration-300 z-30 shadow-xl cursor-pointer
                        ${sidebarOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'}
                    `}
                >
                    {sidebarOpen ? <BsChevronLeft size={10} /> : <BsChevronRight size={10} />}
                </button>
            </div>


            {/* Navigation Sections */}
            <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar">
                <div>
                    {sidebarOpen && <p className="px-4 text-sm font-semibold text-white/40 tracking-tight mb-2">Operations</p>}
                    <div className="space-y-1">
                        <NavItem icon={<BsGrid1X2 />} label="Overview" active={true} sidebarOpen={sidebarOpen} />
                        <NavItem icon={<BsBuilding />} label="Tenants" sidebarOpen={sidebarOpen} />
                    </div>
                </div>

                <div>
                    {sidebarOpen && <p className="px-4 text-sm font-semibold text-white/40 tracking-tight mb-2">Business</p>}
                    <div className="space-y-1">
                        <NavItem icon={<BsGraphUp />} label="Analytics" sidebarOpen={sidebarOpen} />
                        <NavItem icon={<BsPersonVcard />} label="Users" sidebarOpen={sidebarOpen} />
                    </div>
                </div>

                <div>
                    {sidebarOpen && <p className="px-4 text-sm font-semibold text-white/40 tracking-tight mb-2">Master Control</p>}
                    <div className="space-y-1">
                        <NavItem icon={<BsShieldLock />} label="Settings" sidebarOpen={sidebarOpen} />
                    </div>
                </div>
            </nav>

            {/* Storage Widget */}
            <div className="p-4 border-t border-white/5 shrink-0">
                {sidebarOpen ? (
                    <div className="px-2">
                        <div className="flex items-center gap-2 mb-2">
                            <BsCloud className="text-white text-lg" />
                            <span className="text-[13px] font-semibold text-white tracking-tight">Storage</span>
                        </div>

                        {/* Thicker progress bar at 30% */}
                        <div className="h-[6px] w-full bg-slate-700/30 rounded-full mb-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }} />
                        </div>

                        <div className="flex items-center gap-1.5 px-0.5">
                            <span className="text-[11px] font-medium text-blue-400/60 whitespace-nowrap">
                                716.80 GB free of 1024 GB
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:bg-white/5 transition-all">
                            <BsCloud size={20} />
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

function NavItem({
    icon,
    label,
    active = false,
    sidebarOpen
}: {
    icon: any,
    label: string,
    active?: boolean,
    sidebarOpen: boolean
}) {
    return (
        <button
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold tracking-wide transition-all duration-200 group relative ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className={`text-base shrink-0 ${active ? 'text-white' : 'group-hover:text-blue-400 transition-colors'}`}>
                {icon}
            </span>
            {sidebarOpen && <span className="truncate">{label}</span>}
        </button>
    );
}
