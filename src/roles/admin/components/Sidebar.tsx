import { useLocation, useNavigate } from 'react-router-dom';
import {
    BsGrid1X2,
    BsPeople,
    BsFileEarmarkText,
    BsBarChart,
    BsGear,
    BsHddNetwork,
    BsChevronLeft,
    BsChevronRight,
    BsCalculator,
    BsKanban,
} from 'react-icons/bs';
import logoAlt from '../../../assets/SuperAdmin/icon-trackmysign-alt.png';
import loaderIcon from '../../../assets/Loader/icon-trackmysign.png';
import { usePlan } from '../../../hooks/usePlan';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

interface NavSection {
    label: string;
    items: { icon: React.ReactNode; label: string; path: string }[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        label: 'Operación',
        items: [
            { icon: <BsGrid1X2 size={15} />, label: 'Resumen', path: '/dashboard' },
            { icon: <BsCalculator size={15} />, label: 'Cotizaciones', path: '/quotes' },
            { icon: <BsKanban size={15} />, label: 'Órdenes', path: '/orders' },
            { icon: <BsFileEarmarkText size={15} />, label: 'Documentos', path: '/documents' },
        ],
    },
    {
        label: 'Equipo',
        items: [
            { icon: <BsPeople size={15} />, label: 'Empleados', path: '/employees' },
            { icon: <BsBarChart size={15} />, label: 'Reportes', path: '/reports' },
        ],
    },
    {
        label: 'Empresa',
        items: [
            { icon: <BsGear size={15} />, label: 'Configuración', path: '/settings' },
        ],
    },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
    const location = useLocation();
    const { plan, planName } = usePlan();

    // Storage usage example (could come from real data later)
    const usedGB = plan.storageGB === -1 ? 30 : plan.storageGB * 0.42;
    const totalGB = plan.storageGB === -1 ? 100 : plan.storageGB;
    const usagePct = Math.round((usedGB / totalGB) * 100);

    return (
        <aside
            className={`${sidebarOpen ? 'w-64' : 'w-16'} h-full bg-slate-950 flex flex-col transition-[width] duration-200 relative z-50 shrink-0 border-r border-slate-900 group/sidebar`}
        >
            {/* Logo + mobile close */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-900 shrink-0 relative">
                <div className="flex items-center min-w-0">
                    {sidebarOpen ? (
                        <img src={logoAlt} alt="TrackMySign" className="h-7 w-auto object-contain" draggable={false} />
                    ) : (
                        <img src={loaderIcon} alt="TS" className="h-7 w-7 object-contain" draggable={false} />
                    )}
                </div>

                {/* Mobile close */}
                <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Cerrar menú"
                    className="lg:hidden w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                    <BsChevronLeft size={16} />
                </button>

                {/* Desktop collapse toggle */}
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

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-5 overflow-y-auto custom-scrollbar">
                {NAV_SECTIONS.map((section) => (
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
                                    currentPath={location.pathname}
                                    sidebarOpen={sidebarOpen}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Plan + storage widget */}
            <div className="p-3 border-t border-slate-900 shrink-0">
                {sidebarOpen ? (
                    <div className="px-2 py-2 space-y-3">
                        {/* Plan badge */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.14em]">
                                Plan actual
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e40af]/20 text-[#60a5fa] border border-[#1e40af]/30">
                                {planName}
                            </span>
                        </div>

                        {/* Storage */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <BsHddNetwork className="text-white/60" size={13} />
                                    <span className="text-[11px] font-medium text-white/80">Almacenamiento</span>
                                </div>
                                <span className="text-[10px] font-mono text-white/50">{usagePct}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1e40af] rounded-full" style={{ width: `${usagePct}%` }} />
                            </div>
                            <p className="text-[10px] text-white/40 mt-1.5 tabular-nums">
                                {usedGB.toFixed(1)} GB / {plan.storageGB === -1 ? '∞' : `${totalGB} GB`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-2 text-white/50">
                        <BsHddNetwork size={15} />
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
    currentPath,
    sidebarOpen,
}: {
    icon: React.ReactNode;
    label: string;
    path: string;
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
            <span className="shrink-0 flex items-center justify-center w-4">{icon}</span>
            {sidebarOpen && <span className="truncate">{label}</span>}
        </button>
    );
}
