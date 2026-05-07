import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BsBuilding,
    BsPeople,
    BsCreditCard,
    BsArrowUp,
    BsArrowDown,
    BsPlus,
    BsArrowRight,
    BsArrowUpRight,
    BsThreeDots,
    BsDownload,
} from 'react-icons/bs';
import { AnimatePresence } from 'motion/react';
import { useToast } from '../../../context/ToastContext';
import ExportOverlay from '../../../components/ExportOverlay';

interface KPI {
    title: string;
    value: string;
    trend: string;
    positive: boolean;
    icon: React.ReactNode;
    sparkline: number[];
}

const KPIS: KPI[] = [
    {
        title: 'Empresas activas',
        value: '42',
        trend: '+12%',
        positive: true,
        icon: <BsBuilding size={13} />,
        sparkline: [22, 26, 24, 28, 30, 33, 35, 38, 36, 40, 41, 42],
    },
    {
        title: 'MRR mensual',
        value: '€12,540',
        trend: '+8.4%',
        positive: true,
        icon: <BsCreditCard size={13} />,
        sparkline: [8200, 8800, 9100, 9400, 9900, 10400, 10800, 11200, 11600, 11900, 12200, 12540],
    },
    {
        title: 'Usuarios totales',
        value: '1,284',
        trend: '-2.1%',
        positive: false,
        icon: <BsPeople size={13} />,
        sparkline: [1310, 1305, 1320, 1315, 1300, 1295, 1310, 1300, 1295, 1290, 1288, 1284],
    },
    {
        title: 'Suscripciones',
        value: '38',
        trend: '+4',
        positive: true,
        icon: <BsArrowUpRight size={13} />,
        sparkline: [28, 30, 31, 32, 33, 34, 34, 35, 36, 37, 37, 38],
    },
];

interface Tenant {
    company: string;
    admin: string;
    status: 'active' | 'suspended' | 'pending';
    plan: 'enterprise' | 'professional' | 'basic';
    users: number;
}

const TENANTS: Tenant[] = [
    { company: 'EuroPrint Hub', admin: 'boss@europrint.de', status: 'active', plan: 'enterprise', users: 42 },
    { company: 'Global Signage Ltd', admin: 'admin@globalsign.co.uk', status: 'active', plan: 'professional', users: 18 },
    { company: 'Imprenta Madrid', admin: 'info@madridpress.es', status: 'suspended', plan: 'basic', users: 3 },
    { company: 'TechGraphics Inc', admin: 'support@techgraph.com', status: 'active', plan: 'enterprise', users: 67 },
    { company: 'Oceanic Brands', admin: 'mkt@oceanic.it', status: 'pending', plan: 'professional', users: 11 },
];

const STATUS_CONFIG: Record<Tenant['status'], { text: string; cls: string }> = {
    active: { text: 'Activo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    suspended: { text: 'Suspendido', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    pending: { text: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const PLAN_LABEL: Record<Tenant['plan'], string> = {
    enterprise: 'Enterprise',
    professional: 'Professional',
    basic: 'Basic',
};

const SUBSCRIPTION_MIX = [
    { label: 'Enterprise', sublabel: '€99 / mes', percentage: 45, count: 19 },
    { label: 'Professional', sublabel: '€49 / mes', percentage: 35, count: 15 },
    { label: 'Starter', sublabel: '€29 / mes', percentage: 20, count: 8 },
];

interface ActivityItem {
    title: string;
    detail: string;
    time: string;
    type: 'create' | 'update' | 'alert';
}

const ACTIVITY: ActivityItem[] = [
    { title: 'Nueva empresa registrada', detail: 'EuroPrint Hub completó el onboarding', time: 'hace 12 min', type: 'create' },
    { title: 'Plan actualizado', detail: 'Global Signage cambió de Pro a Enterprise', time: 'hace 2 h', type: 'update' },
    { title: 'Usuario suspendido', detail: 'Imprenta Madrid superó intentos de acceso', time: 'hace 5 h', type: 'alert' },
    { title: 'Pago procesado', detail: 'TechGraphics — €99.00 (renovación)', time: 'ayer', type: 'update' },
    { title: 'Nueva empresa registrada', detail: 'Oceanic Brands inició evaluación', time: 'ayer', type: 'create' },
];

const ACTIVITY_DOT: Record<ActivityItem['type'], string> = {
    create: 'bg-emerald-500',
    update: 'bg-[#1e40af]',
    alert: 'bg-amber-500',
};

const TIME_RANGES = ['7d', '30d', '90d', '12m'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [range, setRange] = useState<TimeRange>('30d');
    const [exporting, setExporting] = useState(false);
    const lastUpdate = new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });

    const handleRangeChange = (next: TimeRange) => {
        setRange(next);
        showToast(`Rango actualizado: últimos ${next}.`, 'info');
    };

    const handleExport = () => {
        setExporting(true);
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Datos del panel exportados correctamente.', 'success');
    };

    const handleNewTenant = () => {
        navigate('/tenants');
        showToast('Abre el formulario de creación desde Empresas.', 'info');
    };

    const handleViewAllTenants = () => navigate('/tenants');

    const handleTenantOptions = (company: string) => {
        showToast(`Acciones para "${company}" disponibles próximamente.`, 'info');
    };

    const handleMixOptions = () => {
        showToast('Opciones del mix de suscripciones disponibles próximamente.', 'info');
    };

    return (
        <>
        <div className="space-y-5">
            {/* Page header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                        Resumen general
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Vista global del estado del ecosistema y desempeño operativo.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[11px] text-slate-400 font-mono mr-1 hidden sm:block">
                        Actualizado · {lastUpdate}
                    </div>

                    <RangeSelector value={range} onChange={handleRangeChange} />

                    <button
                        type="button"
                        onClick={handleExport}
                        className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <BsDownload size={12} />
                        Exportar
                    </button>
                    <button
                        type="button"
                        onClick={handleNewTenant}
                        className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <BsPlus size={15} />
                        Nueva empresa
                    </button>
                </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {KPIS.map((kpi) => (
                    <KPICard key={kpi.title} kpi={kpi} />
                ))}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                {/* Recent tenants table */}
                <section className="xl:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
                        <div>
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">Empresas recientes</h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">5 últimas empresas registradas.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleViewAllTenants}
                            className="text-[12px] font-medium text-[#1e40af] hover:text-[#1e3a8a] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            Ver todos <BsArrowRight size={11} />
                        </button>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50/60 border-b border-slate-200">
                                    <th className="px-5 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Empresa</th>
                                    <th className="px-5 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Administrador</th>
                                    <th className="px-5 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-5 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider text-right">Usuarios</th>
                                    <th className="px-5 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-5 py-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {TENANTS.map((tenant) => (
                                    <TenantRow
                                        key={tenant.company}
                                        tenant={tenant}
                                        onOptions={() => handleTenantOptions(tenant.company)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Right column */}
                <div className="space-y-3">
                    {/* Activity feed */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">Actividad reciente</h3>
                            <span className="text-[11px] text-slate-400 font-mono">Hoy</span>
                        </div>

                        <ul className="px-5 py-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                            {ACTIVITY.map((item, i) => (
                                <li key={i} className="flex gap-3 py-2.5 relative">
                                    {/* Timeline dot + line */}
                                    <div className="flex flex-col items-center shrink-0">
                                        <span className={`w-1.5 h-1.5 rounded-full ${ACTIVITY_DOT[item.type]} mt-1.5`} />
                                        {i !== ACTIVITY.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" />}
                                    </div>
                                    <div className="min-w-0 flex-1 pb-1">
                                        <p className="text-[13px] font-medium text-slate-900 leading-snug">{item.title}</p>
                                        <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{item.detail}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{item.time}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Subscription mix */}
                    <section className="bg-white border border-slate-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">Mix de suscripciones</h3>
                            <button
                                type="button"
                                onClick={handleMixOptions}
                                className="w-7 h-7 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                                aria-label="Más opciones"
                            >
                                <BsThreeDots size={14} />
                            </button>
                        </div>

                        {/* Stacked bar */}
                        <div className="flex h-2 rounded-full overflow-hidden mb-4 bg-slate-100">
                            {SUBSCRIPTION_MIX.map((item, i) => (
                                <div
                                    key={item.label}
                                    className={i === 0 ? 'bg-[#1e40af]' : i === 1 ? 'bg-[#3b82f6]' : 'bg-slate-300'}
                                    style={{ width: `${item.percentage}%` }}
                                    title={`${item.label}: ${item.percentage}%`}
                                />
                            ))}
                        </div>

                        <div className="space-y-2.5">
                            {SUBSCRIPTION_MIX.map((item, i) => (
                                <MixRow
                                    key={item.label}
                                    {...item}
                                    color={i === 0 ? 'bg-[#1e40af]' : i === 1 ? 'bg-[#3b82f6]' : 'bg-slate-300'}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>

        <AnimatePresence>
            {exporting && (
                <ExportOverlay
                    label="Exportando datos del panel"
                    description="Estamos preparando tu archivo. No cierres esta ventana."
                    onComplete={handleExportComplete}
                />
            )}
        </AnimatePresence>
        </>
    );
}

function RangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
    return (
        <div className="inline-flex h-9 bg-slate-100 border border-slate-200 rounded-md p-0.5">
            {TIME_RANGES.map((r) => (
                <button
                    key={r}
                    type="button"
                    onClick={() => onChange(r)}
                    className={`px-2.5 text-[12px] font-medium rounded transition-colors cursor-pointer ${value === r
                            ? 'bg-white text-slate-900 border border-slate-200'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                >
                    {r}
                </button>
            ))}
        </div>
    );
}

function KPICard({ kpi }: { kpi: KPI }) {
    const TrendIcon = kpi.positive ? BsArrowUp : BsArrowDown;
    const trendColor = kpi.positive ? 'text-emerald-700' : 'text-rose-700';
    const accentColor = kpi.positive ? '#047857' : '#b91c1c';

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        {kpi.icon}
                    </span>
                    <span className="text-[12px] font-medium text-slate-500">{kpi.title}</span>
                </div>
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${trendColor}`}>
                    <TrendIcon size={9} />
                    {kpi.trend}
                </span>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-[28px] font-semibold text-slate-900 tracking-[-0.02em] leading-none tabular-nums">
                    {kpi.value}
                </p>
                <Sparkline values={kpi.sparkline} color={accentColor} />
            </div>
        </div>
    );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 80;
    const height = 28;
    const step = width / (values.length - 1);

    const points = values
        .map((v, i) => {
            const x = i * step;
            const y = height - ((v - min) / range) * height;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0" aria-hidden>
            <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" points={points} />
        </svg>
    );
}

function TenantRow({ tenant, onOptions }: { tenant: Tenant; onOptions: () => void }) {
    const status = STATUS_CONFIG[tenant.status];
    const initials = tenant.company
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
            <td className="px-5 py-2.5">
                <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                        {initials}
                    </span>
                    <p className="text-[13px] font-semibold text-slate-900">{tenant.company}</p>
                </div>
            </td>
            <td className="px-5 py-2.5">
                <p className="text-[12px] text-slate-600 font-mono">{tenant.admin}</p>
            </td>
            <td className="px-5 py-2.5">
                <span className="text-[12px] font-medium text-slate-700">{PLAN_LABEL[tenant.plan]}</span>
            </td>
            <td className="px-5 py-2.5 text-right">
                <span className="text-[12px] font-mono text-slate-700 tabular-nums">{tenant.users}</span>
            </td>
            <td className="px-5 py-2.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}>
                    {status.text}
                </span>
            </td>
            <td className="px-3 py-2.5">
                <button
                    type="button"
                    onClick={onOptions}
                    className="w-7 h-7 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Más opciones"
                >
                    <BsThreeDots size={13} />
                </button>
            </td>
        </tr>
    );
}

function MixRow({
    label,
    sublabel,
    percentage,
    count,
    color,
}: {
    label: string;
    sublabel: string;
    percentage: number;
    count: number;
    color: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-sm shrink-0 ${color}`} />
                <span className="text-[13px] font-medium text-slate-700 truncate">{label}</span>
                <span className="text-[11px] text-slate-400 truncate">{sublabel}</span>
            </div>
            <div className="flex items-baseline gap-2 shrink-0">
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">{count}</span>
                <span className="text-[13px] font-semibold text-slate-900 tabular-nums w-9 text-right">{percentage}%</span>
            </div>
        </div>
    );
}
