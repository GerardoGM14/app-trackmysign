import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import {
    BsPeople,
    BsFileEarmarkText,
    BsCheckCircle,
    BsClock,
    BsArrowUp,
    BsArrowDown,
    BsArrowRight,
    BsPlus,
    BsDownload,
} from 'react-icons/bs';
import ExportOverlay from '../../../components/ExportOverlay';
import { useToast } from '../../../context/ToastContext';
import { usePlan } from '../../../hooks/usePlan';

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
        title: 'Órdenes en producción',
        value: '18',
        trend: '+4',
        positive: true,
        icon: <BsClock size={13} />,
        sparkline: [10, 11, 13, 12, 14, 15, 14, 16, 16, 17, 17, 18],
    },
    {
        title: 'Cotizaciones pendientes',
        value: '12',
        trend: '-3',
        positive: true,
        icon: <BsFileEarmarkText size={13} />,
        sparkline: [22, 20, 19, 18, 17, 16, 15, 15, 14, 13, 13, 12],
    },
    {
        title: 'Empleados activos',
        value: '24',
        trend: '+2',
        positive: true,
        icon: <BsPeople size={13} />,
        sparkline: [18, 18, 19, 20, 20, 21, 22, 22, 23, 23, 24, 24],
    },
    {
        title: 'Órdenes entregadas (mes)',
        value: '46',
        trend: '+12%',
        positive: true,
        icon: <BsCheckCircle size={13} />,
        sparkline: [28, 30, 32, 34, 36, 38, 40, 41, 43, 44, 45, 46],
    },
];

interface DocumentItem {
    id: string;
    title: string;
    signer: string;
    status: 'signed' | 'pending' | 'expired';
    date: string;
}

const RECENT_DOCUMENTS: DocumentItem[] = [
    { id: 'OR-2026-042', title: 'Vinilo lonalux 4x2m — Acme Corp', signer: 'Ana Pérez', status: 'signed', date: 'hace 8 min' },
    { id: 'OR-2026-041', title: 'Letrero acrílico iluminado — Beta Industries', signer: 'Carlos López', status: 'pending', date: 'hace 1 h' },
    { id: 'OR-2026-040', title: 'Banner roll-up 80x200cm — Centro Médico', signer: 'María Silva', status: 'signed', date: 'hace 3 h' },
    { id: 'OR-2026-039', title: 'Señalética interior x12 — Edificio Plaza', signer: 'James Park', status: 'pending', date: 'hace 5 h' },
    { id: 'OR-2026-038', title: 'Vinilo decorativo escaparate — Boutique Lima', signer: 'Olaf Nilsen', status: 'expired', date: 'hace 1 día' },
];

const STATUS_CONFIG: Record<DocumentItem['status'], { text: string; cls: string; dot: string }> = {
    signed: { text: 'Entregada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    pending: { text: 'En producción', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    expired: { text: 'Atrasada', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

interface ActivityItem {
    title: string;
    detail: string;
    time: string;
    type: 'sign' | 'invite' | 'create';
}

const ACTIVITY: ActivityItem[] = [
    { title: 'Orden entregada', detail: 'OR-2026-042 entregada a Acme Corp', time: 'hace 8 min', type: 'sign' },
    { title: 'Empleado invitado', detail: 'Carlos López aceptó la invitación', time: 'hace 1 h', type: 'invite' },
    { title: 'Cotización creada', detail: 'COT-2026-118 — Beta Industries', time: 'hace 2 h', type: 'create' },
    { title: 'Prueba aprobada', detail: 'Centro Médico aprobó la prueba de OR-2026-040', time: 'hace 3 h', type: 'sign' },
    { title: 'Empleado invitado', detail: 'Diego Ramos invitado al equipo', time: 'ayer', type: 'invite' },
];

const ACTIVITY_DOT: Record<ActivityItem['type'], string> = {
    sign: 'bg-emerald-500',
    invite: 'bg-[#1e40af]',
    create: 'bg-amber-500',
};

const TIME_RANGES = ['7d', '30d', '90d', '12m'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

// Number of points (months) to show in sparklines per range.
// Sparklines have 12 mock points so we slice from the end.
const RANGE_POINTS: Record<TimeRange, number> = { '7d': 4, '30d': 6, '90d': 9, '12m': 12 };

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { planName } = usePlan();
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
        showToast(`Mostrando los últimos ${next}.`, 'info');
    };

    const handleExport = () => {
        setExporting(true);
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Resumen del panel exportado correctamente.', 'success');
    };

    const handleNewDocument = () => {
        navigate('/documents');
        showToast('Crea una nueva cotización u orden desde su sección.', 'info');
    };

    const handleViewAllDocuments = () => navigate('/documents');

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.14em]">
                                Tu empresa
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e40af]/10 text-[#1e40af] border border-[#1e40af]/15">
                                Plan {planName}
                            </span>
                        </div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Resumen general
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Estado de tus órdenes de producción, cotizaciones y equipo.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
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
                            onClick={handleNewDocument}
                            className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsPlus size={15} />
                            Nueva cotización
                        </button>
                    </div>
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {KPIS.map((kpi) => (
                        <KPICard key={kpi.title} kpi={kpi} range={range} />
                    ))}
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                    {/* Recent documents table */}
                    <section className="xl:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
                            <div>
                                <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                    Órdenes recientes
                                </h2>
                                <p className="text-[12px] text-slate-500 mt-0.5">
                                    Últimas órdenes de producción registradas.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleViewAllDocuments}
                                className="text-[12px] font-medium text-[#1e40af] hover:text-[#1e3a8a] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                Ver todos <BsArrowRight size={11} />
                            </button>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50/60 border-b border-slate-200">
                                        <th className="px-5 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
                                        <th className="px-5 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                                        <th className="px-5 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-5 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-3 py-2 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {RECENT_DOCUMENTS.map((doc) => (
                                        <DocumentRow
                                            key={doc.id}
                                            doc={doc}
                                            onOpen={() => {
                                                navigate('/documents');
                                                showToast(`El detalle de "${doc.id}" estará disponible en Documentos.`, 'info');
                                            }}
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

                        {/* Plan usage card */}
                        <PlanUsageCard />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {exporting && (
                    <ExportOverlay
                        label="Exportando resumen del panel"
                        description="Estamos preparando un archivo con tus métricas. No cierres esta ventana."
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

function KPICard({ kpi, range }: { kpi: KPI; range: TimeRange }) {
    const TrendIcon = kpi.positive ? BsArrowUp : BsArrowDown;
    const trendColor = kpi.positive ? 'text-emerald-700' : 'text-rose-700';
    const accentColor = kpi.positive ? '#047857' : '#b91c1c';

    const visibleValues = useMemo(
        () => kpi.sparkline.slice(-RANGE_POINTS[range]),
        [kpi.sparkline, range],
    );

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
                <Sparkline values={visibleValues} color={accentColor} />
            </div>
        </div>
    );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
    const width = 88;
    const height = 32;
    const padding = 2;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = values.length > 1 ? chartW / (values.length - 1) : chartW;

    const containerRef = useRef<SVGSVGElement>(null);
    const [hover, setHover] = useState<{ x: number; y: number; value: number } | null>(null);

    const points = values.map((v, i) => ({
        x: padding + i * step,
        y: padding + chartH - ((v - min) / range) * chartH,
        v,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding + chartH} L ${points[0].x} ${padding + chartH} Z`;

    const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const cursorX = ((e.clientX - rect.left) / rect.width) * width;

        let nearest = 0;
        let minDist = Infinity;
        points.forEach((p, i) => {
            const dist = Math.abs(p.x - cursorX);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        });
        setHover({ x: points[nearest].x, y: points[nearest].y, value: points[nearest].v });
    };

    const formatValue = (v: number) =>
        v >= 1000 ? v.toLocaleString('es-PE') : Number.isInteger(v) ? String(v) : v.toFixed(1);

    return (
        <div className="relative shrink-0">
            <svg
                ref={containerRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible cursor-crosshair"
                onMouseMove={handleMove}
                onMouseLeave={() => setHover(null)}
                aria-hidden
            >
                <path d={areaPath} fill={color} opacity={0.08} />
                <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.25}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                {hover && <circle cx={hover.x} cy={hover.y} r={3} fill={color} stroke="#fff" strokeWidth={1.5} />}
            </svg>

            {hover && (
                <div
                    className="absolute pointer-events-none z-10"
                    style={{
                        left: `${(hover.x / width) * 100}%`,
                        top: `${(hover.y / height) * 100}%`,
                        transform: 'translate(-50%, calc(-100% - 6px))',
                    }}
                >
                    <div className="bg-slate-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap tabular-nums">
                        {formatValue(hover.value)}
                    </div>
                </div>
            )}
        </div>
    );
}

function DocumentRow({ doc, onOpen }: { doc: DocumentItem; onOpen: () => void }) {
    const status = STATUS_CONFIG[doc.status];

    return (
        <tr
            onClick={onOpen}
            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors cursor-pointer"
        >
            <td className="px-5 py-2.5">
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{doc.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{doc.id}</p>
                </div>
            </td>
            <td className="px-5 py-2.5">
                <span className="text-[12px] text-slate-700">{doc.signer}</span>
            </td>
            <td className="px-5 py-2.5">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.text}
                </span>
            </td>
            <td className="px-5 py-2.5">
                <span className="text-[12px] text-slate-500">{doc.date}</span>
            </td>
            <td className="px-3 py-2.5 text-right">
                <BsArrowRight size={11} className="text-slate-300 inline" />
            </td>
        </tr>
    );
}

function PlanUsageCard() {
    const { plan, planName } = usePlan();
    const navigate = useNavigate();

    const usersUsed = 24;
    const usersLimit = plan.maxUsers === -1 ? null : plan.maxUsers;
    const usersPct = usersLimit ? Math.round((usersUsed / usersLimit) * 100) : 0;

    const storageUsed = plan.storageGB === -1 ? 30 : plan.storageGB * 0.42;
    const storageLimit = plan.storageGB === -1 ? null : plan.storageGB;
    const storagePct = storageLimit ? Math.round((storageUsed / storageLimit) * 100) : 0;

    return (
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">Uso de tu plan</h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">Plan {planName}</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/settings')}
                    className="text-[12px] font-medium text-[#1e40af] hover:text-[#1e3a8a] flex items-center gap-1 cursor-pointer transition-colors"
                >
                    Gestionar <BsArrowRight size={11} />
                </button>
            </div>

            <div className="px-5 py-4 space-y-4">
                <UsageBar
                    label="Usuarios"
                    used={usersUsed}
                    limit={usersLimit}
                    pct={usersPct}
                    formatter={(v) => `${v}`}
                />
                <UsageBar
                    label="Almacenamiento"
                    used={storageUsed}
                    limit={storageLimit}
                    pct={storagePct}
                    formatter={(v) => `${v.toFixed(1)} GB`}
                />
            </div>
        </section>
    );
}

function UsageBar({
    label,
    used,
    limit,
    pct,
    formatter,
}: {
    label: string;
    used: number;
    limit: number | null;
    pct: number;
    formatter: (v: number) => string;
}) {
    const isUnlimited = limit === null;
    const barColor =
        pct >= 90 ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-[#1e40af]';

    return (
        <div>
            <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[13px] font-medium text-slate-700">{label}</span>
                <span className="text-[12px] text-slate-500 tabular-nums">
                    {formatter(used)}{' '}
                    <span className="text-slate-400">
                        / {isUnlimited ? '∞' : formatter(limit)}
                    </span>
                </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} rounded-full transition-[width] duration-500`}
                    style={{ width: isUnlimited ? '20%' : `${pct}%` }}
                />
            </div>
        </div>
    );
}
