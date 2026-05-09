import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    BsGrid1X2,
    BsCalculator,
    BsKanban,
    BsPatchCheck,
    BsPersonCircle,
    BsChevronLeft,
    BsChevronRight,
} from 'react-icons/bs';
import logoAlt from '../../../assets/SuperAdmin/icon-trackmysign-alt.png';
import loaderIcon from '../../../assets/Loader/icon-trackmysign.png';
import { CUSTOMER_PROFILE, CUSTOMER_ORDERS, getPendingProofs } from '../../../features/customer/customerData';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

interface NavSection {
    label: string;
    items: { icon: React.ReactNode; label: string; path: string; badge?: number }[];
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
    const location = useLocation();

    const pendingProofsCount = useMemo(() => getPendingProofs(CUSTOMER_ORDERS).length, []);

    const sections: NavSection[] = [
        {
            label: 'Mi taller',
            items: [
                { icon: <BsGrid1X2 size={15} />, label: 'Resumen', path: '/dashboard' },
                { icon: <BsCalculator size={15} />, label: 'Mis cotizaciones', path: '/quotes' },
                { icon: <BsKanban size={15} />, label: 'Mis órdenes', path: '/orders' },
                { icon: <BsPatchCheck size={15} />, label: 'Pruebas', path: '/proofs', badge: pendingProofsCount },
            ],
        },
        {
            label: 'Personal',
            items: [
                { icon: <BsPersonCircle size={15} />, label: 'Mi cuenta', path: '/account' },
            ],
        },
    ];

    const initials = CUSTOMER_PROFILE.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

    return (
        <aside
            className={`${sidebarOpen ? 'w-64' : 'w-16'} h-full bg-slate-950 flex flex-col transition-[width] duration-200 relative z-50 shrink-0 border-r border-slate-900 group/sidebar`}
        >
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-900 shrink-0 relative">
                <div className="flex items-center min-w-0">
                    {sidebarOpen ? (
                        <img src={logoAlt} alt="TrackMySign" className="h-7 w-auto object-contain" draggable={false} />
                    ) : (
                        <img src={loaderIcon} alt="TS" className="h-7 w-7 object-contain" draggable={false} />
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Cerrar menú"
                    className="lg:hidden w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                    <BsChevronLeft size={16} />
                </button>

                <button
                    type="button"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
                    className={`
                        hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2
                        w-6 h-6 bg-slate-950 border border-slate-800 rounded-full
                        items-center justify-center text-white/60 hover:text-white hover:border-[#1e40af]
                        transition-colors duration-200 z-[60] cursor-pointer
                        ${sidebarOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'}
                    `}
                >
                    {sidebarOpen ? <BsChevronLeft size={10} /> : <BsChevronRight size={10} />}
                </button>
            </div>

            <nav className="flex-1 py-4 px-2 space-y-5 overflow-y-auto custom-scrollbar">
                {sections.map((section) => (
                    <div key={section.label}>
                        {sidebarOpen && (
                            <p className="px-3 text-[10px] font-semibold text-white/35 uppercase tracking-[0.14em] mb-1.5">
                                {section.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map((item) => (
                                <NavItem
                                    key={item.path}
                                    icon={item.icon}
                                    label={item.label}
                                    path={item.path}
                                    badge={item.badge}
                                    currentPath={location.pathname}
                                    sidebarOpen={sidebarOpen}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-3 border-t border-slate-900 shrink-0">
                {sidebarOpen ? (
                    <div className="flex items-center gap-2.5 px-2 py-2">
                        <span className="w-8 h-8 rounded-full bg-[#1e40af] border border-[#1e40af]/30 flex items-center justify-center text-[11px] font-semibold text-white shrink-0 uppercase">
                            {initials}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-white truncate">{CUSTOMER_PROFILE.name}</p>
                            <p className="text-[10px] text-white/50 truncate">{CUSTOMER_PROFILE.company}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-2">
                        <span className="w-8 h-8 rounded-full bg-[#1e40af] flex items-center justify-center text-[11px] font-semibold text-white uppercase">
                            {initials}
                        </span>
                    </div>
                )}
            </div>
        </aside>
    );
}

function NavItem({
    icon,
    label,
    path,
    badge,
    currentPath,
    sidebarOpen,
}: {
    icon: React.ReactNode;
    label: string;
    path: string;
    badge?: number;
    currentPath: string;
    sidebarOpen: boolean;
}) {
    const navigate = useNavigate();
    const active = currentPath === path;

    return (
        <button
            type="button"
            onClick={() => navigate(path)}
            title={!sidebarOpen ? label : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${active
                    ? 'bg-[#1e40af] text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="shrink-0 flex items-center justify-center w-4 relative">
                {icon}
                {!sidebarOpen && badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-950" />
                )}
            </span>
            {sidebarOpen && (
                <>
                    <span className="truncate flex-1 text-left">{label}</span>
                    {badge !== undefined && badge > 0 && (
                        <span
                            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold tabular-nums ${active ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                                }`}
                        >
                            {badge}
                        </span>
                    )}
                </>
            )}
        </button>
    );
}
