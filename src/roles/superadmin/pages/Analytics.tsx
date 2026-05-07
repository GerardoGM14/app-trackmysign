import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import {
    BsArrowUp,
    BsArrowDown,
    BsDownload,
    BsArrowRight,
    BsThreeDots,
} from 'react-icons/bs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import ExportOverlay from '../../../components/ExportOverlay';
import { useToast } from '../../../context/ToastContext';

/* ---------- Mock data ---------- */

const MONTHLY_REVENUE = [
    { month: 'Jul', mrr: 8200 },
    { month: 'Ago', mrr: 8900 },
    { month: 'Sep', mrr: 9400 },
    { month: 'Oct', mrr: 9200 },
    { month: 'Nov', mrr: 10100 },
    { month: 'Dic', mrr: 10800 },
    { month: 'Ene', mrr: 11200 },
    { month: 'Feb', mrr: 11600 },
    { month: 'Mar', mrr: 12540 },
    { month: 'Abr', mrr: 12980 },
    { month: 'May', mrr: 13420 },
    { month: 'Jun', mrr: 13760 },
];

const TOP_TENANTS = [
    { name: 'TechGraphics Inc', revenue: 2970, users: 156, plan: 'Enterprise' },
    { name: 'DesignWorks AU', revenue: 2376, users: 92, plan: 'Enterprise' },
    { name: 'EuroPrint Hub', revenue: 1980, users: 84, plan: 'Enterprise' },
    { name: 'PrintForce GmbH', revenue: 1470, users: 35, plan: 'Professional' },
    { name: 'Global Signage Ltd', revenue: 1078, users: 42, plan: 'Professional' },
];

const FEATURE_USAGE = [
    { name: 'Seguimiento de envíos', usage: 94 },
    { name: 'Generación de reportes', usage: 78 },
    { name: 'Gestión de usuarios', usage: 72 },
    { name: 'Integraciones API', usage: 45 },
    { name: 'Branding personalizado', usage: 32 },
];

const DAILY_ACTIVE = [
    { day: 'Lun', dau: 340 },
    { day: 'Mar', dau: 420 },
    { day: 'Mié', dau: 480 },
    { day: 'Jue', dau: 460 },
    { day: 'Vie', dau: 510 },
    { day: 'Sáb', dau: 180 },
    { day: 'Dom', dau: 120 },
];

const PERIODS = ['3m', '6m', '9m', '12m'] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_MONTHS: Record<Period, number> = { '3m': 3, '6m': 6, '9m': 9, '12m': 12 };

interface KPI {
    title: string;
    value: string;
    trend: string;
    positive: boolean;
    description?: string;
    sparkline: number[];
}

const PRIMARY_KPIS: KPI[] = [
    {
        title: 'Ingresos mensuales',
        value: '€13,760',
        trend: '+8.4%',
        positive: true,
        description: 'MRR del periodo actual',
        sparkline: [8200, 8900, 9400, 9200, 10100, 10800, 11200, 11600, 12540, 12980, 13420, 13760],
    },
    {
        title: 'Ingresos anualizados',
        value: '€165,120',
        trend: '+12%',
        positive: true,
        description: 'ARR proyectado',
        sparkline: [98400, 106800, 112800, 110400, 121200, 129600, 134400, 139200, 150480, 155760, 161040, 165120],
    },
    {
        title: 'Tasa de cancelación',
        value: '4.2%',
        trend: '-0.8%',
        positive: true,
        description: 'Churn mensual',
        sparkline: [6.4, 6.1, 5.8, 5.9, 5.5, 5.3, 5.0, 4.9, 4.7, 4.5, 4.4, 4.2],
    },
    {
        title: 'Ingreso por empresa',
        value: '€298',
        trend: '+3.1%',
        positive: true,
        description: 'ARPU promedio',
        sparkline: [262, 268, 271, 269, 274, 278, 281, 284, 289, 292, 295, 298],
    },
];

const GROWTH_KPIS: KPI[] = [
    {
        title: 'Nuevas empresas',
        value: '5',
        trend: '+2',
        positive: true,
        description: 'Este mes',
        sparkline: [3, 4, 2, 5, 3, 6, 4, 5, 3, 4, 3, 5],
    },
    {
        title: 'Conversión de prueba',
        value: '68%',
        trend: '+5%',
        positive: true,
        description: 'Trial → pago',
        sparkline: [54, 56, 55, 58, 60, 61, 63, 62, 65, 66, 67, 68],
    },
    {
        title: 'Tiempo de onboarding',
        value: '2.4 días',
        trend: '-12h',
        positive: true,
        description: 'Promedio',
        sparkline: [4.1, 3.9, 3.8, 3.5, 3.4, 3.2, 3.0, 2.9, 2.7, 2.6, 2.5, 2.4],
    },
    {
        title: 'Tickets de soporte',
        value: '12',
        trend: '+3',
        positive: false,
        description: 'Abiertos',
        sparkline: [6, 7, 8, 7, 9, 8, 10, 9, 11, 10, 11, 12],
    },
];

export default function Analytics() {
    const { showToast } = useToast();
    const [period, setPeriod] = useState<Period>('9m');
    const [exporting, setExporting] = useState(false);

    const revenueData = useMemo(
        () => MONTHLY_REVENUE.slice(-PERIOD_MONTHS[period]),
        [period],
    );

    const handlePeriod = (next: Period) => {
        setPeriod(next);
        showToast(`Mostrando los últimos ${PERIOD_MONTHS[next]} meses.`, 'info');
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();

            // Sheet 1 — Revenue
            const revenueSheet = workbook.addWorksheet('Ingresos');
            revenueSheet.columns = [
                { header: 'Mes', key: 'month', width: 12 },
                { header: 'MRR (€)', key: 'mrr', width: 14 },
            ];
            revenueData.forEach((r) => revenueSheet.addRow(r));

            // Sheet 2 — Top tenants
            const topSheet = workbook.addWorksheet('Top empresas');
            topSheet.columns = [
                { header: 'Empresa', key: 'name', width: 28 },
                { header: 'Ingresos (€)', key: 'revenue', width: 14 },
                { header: 'Usuarios', key: 'users', width: 12 },
                { header: 'Plan', key: 'plan', width: 16 },
            ];
            TOP_TENANTS.forEach((t) => topSheet.addRow(t));

            // Sheet 3 — Feature usage
            const featureSheet = workbook.addWorksheet('Adopción');
            featureSheet.columns = [
                { header: 'Funcionalidad', key: 'name', width: 28 },
                { header: 'Uso (%)', key: 'usage', width: 12 },
            ];
            FEATURE_USAGE.forEach((f) => featureSheet.addRow(f));

            // Style headers (all sheets)
            [revenueSheet, topSheet, featureSheet].forEach((sheet) => {
                const header = sheet.getRow(1);
                header.eachCell((cell) => {
                    cell.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                });
                header.height = 22;
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `analitica_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            showToast('No fue posible exportar el archivo.', 'error');
            setExporting(false);
        }
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Reporte de analítica exportado correctamente.', 'success');
    };

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Analítica
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Métricas detalladas de negocio y desempeño de tu plataforma.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                        <PeriodSelector value={period} onChange={handlePeriod} />
                        <button
                            type="button"
                            onClick={handleExport}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsDownload size={12} />
                            Exportar
                        </button>
                    </div>
                </header>

                {/* Primary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PRIMARY_KPIS.map((kpi) => (
                        <KPICard key={kpi.title} kpi={kpi} />
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                    {/* MRR Trend */}
                    <section className="xl:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                    Tendencia de ingresos
                                </h2>
                                <p className="text-[12px] text-slate-500 mt-0.5">
                                    MRR de los últimos {PERIOD_MONTHS[period]} meses.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => showToast('Detalle expandido próximamente.', 'info')}
                                aria-label="Más opciones"
                                className="w-7 h-7 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <BsThreeDots size={13} />
                            </button>
                        </div>
                        <div className="p-5">
                            <RevenueChart data={revenueData} />
                        </div>
                    </section>

                    {/* DAU */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200">
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                Usuarios activos diarios
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">Distribución semanal.</p>
                        </div>
                        <div className="p-5">
                            <DAUChart data={DAILY_ACTIVE} />
                        </div>
                    </section>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {/* Top tenants */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                    Empresas por ingresos
                                </h2>
                                <p className="text-[12px] text-slate-500 mt-0.5">Top contribuyentes del periodo.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => showToast('Vista completa próximamente.', 'info')}
                                className="text-[12px] font-medium text-[#1e40af] hover:text-[#1e3a8a] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                Ver todas <BsArrowRight size={11} />
                            </button>
                        </div>
                        <ul className="px-5 py-3">
                            {TOP_TENANTS.map((t, i) => (
                                <TopTenantRow key={t.name} rank={i + 1} {...t} />
                            ))}
                        </ul>
                    </section>

                    {/* Feature adoption */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200">
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                Adopción de funcionalidades
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                                Uso promedio entre todas las empresas.
                            </p>
                        </div>
                        <div className="px-5 py-4 space-y-3.5">
                            {FEATURE_USAGE.map((f) => (
                                <FeatureRow key={f.name} name={f.name} usage={f.usage} />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Growth KPIs */}
                <div>
                    <div className="flex items-baseline gap-2 mb-3">
                        <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">Crecimiento</h2>
                        <span className="text-[12px] text-slate-500">indicadores secundarios</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {GROWTH_KPIS.map((kpi) => (
                            <KPICard key={kpi.title} kpi={kpi} compact />
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {exporting && (
                    <ExportOverlay
                        label="Exportando reporte de analítica"
                        description="Generando un archivo con ingresos, top empresas y adopción."
                        onComplete={handleExportComplete}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Period selector ---------- */

function PeriodSelector({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
    return (
        <div className="inline-flex h-9 bg-slate-100 border border-slate-200 rounded-md p-0.5">
            {PERIODS.map((p) => (
                <button
                    key={p}
                    type="button"
                    onClick={() => onChange(p)}
                    className={`px-2.5 text-[12px] font-medium rounded transition-colors cursor-pointer ${value === p
                            ? 'bg-white text-slate-900 border border-slate-200'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                >
                    {p}
                </button>
            ))}
        </div>
    );
}

/* ---------- KPI Card ---------- */

function KPICard({ kpi, compact = false }: { kpi: KPI; compact?: boolean }) {
    const TrendIcon = kpi.positive ? BsArrowUp : BsArrowDown;
    const trendColor = kpi.positive ? 'text-emerald-700' : 'text-rose-700';
    const accentColor = kpi.positive ? '#047857' : '#b91c1c';

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-slate-500 truncate">{kpi.title}</span>
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium shrink-0 ${trendColor}`}>
                    <TrendIcon size={9} />
                    {kpi.trend}
                </span>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
                <p
                    className={`${compact ? 'text-[22px]' : 'text-[26px]'
                        } font-semibold text-slate-900 tracking-[-0.02em] leading-none tabular-nums`}
                >
                    {kpi.value}
                </p>
                <Sparkline values={kpi.sparkline} color={accentColor} />
            </div>

            {kpi.description && (
                <p className="text-[11px] text-slate-400 mt-2">{kpi.description}</p>
            )}
        </div>
    );
}

/* ---------- Interactive Sparkline ---------- */

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
    const [hover, setHover] = useState<{ index: number; x: number; y: number; value: number } | null>(null);

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
        setHover({ index: nearest, x: points[nearest].x, y: points[nearest].y, value: points[nearest].v });
    };

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
                {hover && (
                    <>
                        <circle cx={hover.x} cy={hover.y} r={3} fill={color} stroke="#fff" strokeWidth={1.5} />
                    </>
                )}
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
                        {formatSparkValue(hover.value)}
                    </div>
                </div>
            )}
        </div>
    );
}

function formatSparkValue(v: number): string {
    if (v >= 1000) return v.toLocaleString('es-PE');
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(1);
}

/* ---------- Revenue chart (interactive SVG) ---------- */

interface HoverState {
    index: number;
    x: number;
    y: number;
    month: string;
    mrr: number;
}

function RevenueChart({ data }: { data: { month: string; mrr: number }[] }) {
    const width = 600;
    const height = 220;
    const padding = { top: 16, right: 16, bottom: 28, left: 16 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const containerRef = useRef<SVGSVGElement>(null);
    const [hover, setHover] = useState<HoverState | null>(null);

    const max = Math.max(...data.map((d) => d.mrr));
    const min = Math.min(...data.map((d) => d.mrr));
    const range = max - min || 1;
    const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

    const points = data.map((d, i) => {
        const x = padding.left + i * stepX;
        const y = padding.top + chartH - ((d.mrr - min) / range) * chartH;
        return { x, y, ...d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    const total = data.reduce((sum, d) => sum + d.mrr, 0);
    const avg = Math.round(total / data.length);

    const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const cursorX = ((e.clientX - rect.left) / rect.width) * width;

        // Find closest point
        let nearest = 0;
        let minDist = Infinity;
        points.forEach((p, i) => {
            const dist = Math.abs(p.x - cursorX);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        });

        setHover({
            index: nearest,
            x: points[nearest].x,
            y: points[nearest].y,
            month: points[nearest].month,
            mrr: points[nearest].mrr,
        });
    };

    return (
        <div>
            <div className="flex items-baseline gap-6 mb-4">
                <div>
                    <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Total acumulado</p>
                    <p className="text-[20px] font-semibold text-slate-900 tracking-[-0.02em] tabular-nums">
                        €{total.toLocaleString('es-PE')}
                    </p>
                </div>
                <div>
                    <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Promedio mensual</p>
                    <p className="text-[16px] font-semibold text-slate-700 tracking-tight tabular-nums">
                        €{avg.toLocaleString('es-PE')}
                    </p>
                </div>
            </div>

            <div className="relative">
                <svg
                    ref={containerRef}
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto cursor-crosshair"
                    onMouseMove={handleMove}
                    onMouseLeave={() => setHover(null)}
                    aria-label="Gráfico de tendencia de ingresos mensuales"
                >
                    {/* Horizontal grid */}
                    {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                        const y = padding.top + chartH * t;
                        return (
                            <line
                                key={t}
                                x1={padding.left}
                                x2={width - padding.right}
                                y1={y}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth={1}
                            />
                        );
                    })}

                    {/* Area */}
                    <path d={areaPath} fill="#1e40af" opacity={0.08} />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#1e40af"
                        strokeWidth={1.75}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* Crosshair */}
                    {hover && (
                        <line
                            x1={hover.x}
                            x2={hover.x}
                            y1={padding.top}
                            y2={padding.top + chartH}
                            stroke="#1e40af"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            opacity={0.4}
                        />
                    )}

                    {/* Points */}
                    {points.map((p, i) => {
                        const isActive = hover?.index === i;
                        return (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r={isActive ? 5 : 2.5}
                                fill={isActive ? '#1e40af' : '#fff'}
                                stroke="#1e40af"
                                strokeWidth={1.5}
                                style={{ transition: 'r 0.15s ease' }}
                            />
                        );
                    })}

                    {/* X labels */}
                    {data.map((d, i) => (
                        <text
                            key={i}
                            x={padding.left + i * stepX}
                            y={height - 8}
                            textAnchor="middle"
                            className={`transition-colors ${hover?.index === i ? 'fill-slate-900 font-semibold' : 'fill-slate-400'}`}
                            style={{ fontSize: '10px', fontFamily: 'Inter' }}
                        >
                            {d.month}
                        </text>
                    ))}
                </svg>

                {/* Tooltip */}
                {hover && containerRef.current && (
                    <ChartTooltip
                        x={(hover.x / width) * 100}
                        y={(hover.y / height) * 100}
                        month={hover.month}
                        mrr={hover.mrr}
                        previous={hover.index > 0 ? data[hover.index - 1].mrr : null}
                    />
                )}
            </div>
        </div>
    );
}

function ChartTooltip({
    x,
    y,
    month,
    mrr,
    previous,
}: {
    x: number;
    y: number;
    month: string;
    mrr: number;
    previous: number | null;
}) {
    const delta = previous !== null ? mrr - previous : null;
    const pct = previous !== null && previous !== 0 ? ((mrr - previous) / previous) * 100 : null;
    const positive = (delta ?? 0) >= 0;

    return (
        <div
            className="absolute pointer-events-none z-10"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, calc(-100% - 12px))',
            }}
        >
            <div className="bg-white border border-slate-200 rounded-md px-3 py-2 min-w-[140px]">
                <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">{month}</p>
                <p className="text-[15px] font-semibold text-slate-900 tracking-tight tabular-nums leading-tight mt-0.5">
                    €{mrr.toLocaleString('es-PE')}
                </p>
                {pct !== null && (
                    <p className={`text-[11px] font-medium mt-0.5 ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {positive ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}% vs mes anterior
                    </p>
                )}
            </div>
            {/* Arrow */}
            <div className="w-0 h-0 mx-auto border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-slate-200" />
        </div>
    );
}

/* ---------- DAU bar chart (amCharts 5) ---------- */

function DAUChart({ data }: { data: { day: string; dau: number }[] }) {
    const chartRef = useRef<HTMLDivElement>(null);
    const total = data.reduce((sum, d) => sum + d.dau, 0);

    useLayoutEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);
        root.setThemes([am5themes_Animated.new(root)]);
        root.setThemes([
            am5.Theme.new(root),
            am5themes_Animated.new(root),
        ]);

        // Disable amCharts logo (paid feature normally)
        const logo = root._logo;
        if (logo) logo.dispose();

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: 'none',
                wheelY: 'none',
                paddingLeft: 0,
                paddingRight: 0,
                paddingTop: 4,
                paddingBottom: 0,
            }),
        );

        const xRenderer = am5xy.AxisRendererX.new(root, {
            minGridDistance: 30,
            cellStartLocation: 0.25,
            cellEndLocation: 0.75,
        });
        xRenderer.grid.template.set('forceHidden', true);
        xRenderer.labels.template.setAll({
            fontSize: 10,
            fontFamily: 'Inter',
            fill: am5.color('#94a3b8'),
        });

        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: 'day',
                renderer: xRenderer,
            }),
        );
        xAxis.data.setAll(data);

        const yRenderer = am5xy.AxisRendererY.new(root, {
            strokeOpacity: 0,
        });
        yRenderer.grid.template.setAll({
            stroke: am5.color('#f1f5f9'),
            strokeOpacity: 1,
        });
        yRenderer.labels.template.setAll({
            fontSize: 10,
            fontFamily: 'Inter',
            fill: am5.color('#94a3b8'),
        });

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: yRenderer,
                min: 0,
            }),
        );

        const series = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                xAxis,
                yAxis,
                valueYField: 'dau',
                categoryXField: 'day',
                tooltip: am5.Tooltip.new(root, {
                    labelText: '[bold]{day}[/]\n{valueY} usuarios activos',
                }),
            }),
        );

        series.columns.template.setAll({
            cornerRadiusTL: 3,
            cornerRadiusTR: 3,
            fill: am5.color('#1e40af'),
            stroke: am5.color('#1e40af'),
            fillOpacity: 0.85,
            strokeWidth: 0,
            tooltipY: 0,
        });

        // Hover state
        series.columns.template.states.create('hover', {
            fillOpacity: 1,
        });

        // Tooltip styling
        const tooltip = series.get('tooltip');
        if (tooltip) {
            tooltip.get('background')?.setAll({
                fill: am5.color('#ffffff'),
                stroke: am5.color('#e2e8f0'),
                strokeWidth: 1,
                fillOpacity: 1,
            });
            tooltip.label.setAll({
                fill: am5.color('#0f172a'),
                fontSize: 12,
                fontFamily: 'Inter',
            });
        }

        series.data.setAll(data);

        // Animate on load
        series.appear(800);
        chart.appear(800, 100);

        return () => {
            root.dispose();
        };
    }, [data]);

    return (
        <div>
            <div className="mb-3">
                <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Total semanal</p>
                <p className="text-[20px] font-semibold text-slate-900 tracking-[-0.02em] tabular-nums">
                    {total.toLocaleString('es-PE')}
                </p>
            </div>

            <div ref={chartRef} className="w-full h-[180px]" />
        </div>
    );
}

/* ---------- Top tenant row ---------- */

function TopTenantRow({
    rank,
    name,
    revenue,
    users,
    plan,
}: {
    rank: number;
    name: string;
    revenue: number;
    users: number;
    plan: string;
}) {
    return (
        <li className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-600 shrink-0 tabular-nums">
                    {rank}
                </span>
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{name}</p>
                    <p className="text-[11px] text-slate-500">
                        {users} usuarios · {plan}
                    </p>
                </div>
            </div>
            <span className="text-[13px] font-semibold text-slate-900 tabular-nums shrink-0">
                €{revenue.toLocaleString('es-PE')}
            </span>
        </li>
    );
}

/* ---------- Feature usage row ---------- */

function FeatureRow({ name, usage }: { name: string; usage: number }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[13px] font-medium text-slate-700">{name}</span>
                <span className="text-[12px] font-semibold text-slate-900 tabular-nums">{usage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-[#1e40af] rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${usage}%` }}
                />
            </div>
        </div>
    );
}
