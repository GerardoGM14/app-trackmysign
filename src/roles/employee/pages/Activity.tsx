import { useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
    BsArrowUp,
    BsArrowDown,
    BsDownload,
    BsCheckCircle,
    BsClock,
    BsBullseye,
    BsFileEarmarkText,
    BsThreeDots,
    BsCalendar3,
} from 'react-icons/bs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import ExportOverlay from '../../../components/ExportOverlay';
import { useToast } from '../../../context/ToastContext';

/* ---------- Mock data (scope: employee personal) ---------- */

interface KPI {
    title: string;
    value: string;
    trend: string;
    positive: boolean;
    description: string;
    icon: React.ReactNode;
    sparkline: number[];
}

const KPIS: KPI[] = [
    {
        title: 'Documentos firmados',
        value: '24',
        trend: '+6',
        positive: true,
        description: 'En el periodo',
        icon: <BsCheckCircle size={13} />,
        sparkline: [12, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 24],
    },
    {
        title: 'Tiempo de respuesta',
        value: '1.8 h',
        trend: '-22 min',
        positive: true,
        description: 'Desde envío hasta firma',
        icon: <BsClock size={13} />,
        sparkline: [3.4, 3.2, 3.0, 2.8, 2.6, 2.5, 2.3, 2.1, 2.0, 1.9, 1.85, 1.8],
    },
    {
        title: 'Tasa de finalización',
        value: '94%',
        trend: '+2%',
        positive: true,
        description: 'Firmados vs recibidos',
        icon: <BsBullseye size={13} />,
        sparkline: [82, 84, 85, 86, 88, 89, 90, 91, 92, 93, 93, 94],
    },
    {
        title: 'Documentos creados',
        value: '12',
        trend: '+2',
        positive: true,
        description: 'Que tú enviaste',
        icon: <BsFileEarmarkText size={13} />,
        sparkline: [4, 5, 6, 7, 8, 9, 9, 10, 11, 11, 12, 12],
    },
];

const SIGNATURE_EVOLUTION = [
    { month: 'Jul', signed: 8 },
    { month: 'Ago', signed: 11 },
    { month: 'Sep', signed: 14 },
    { month: 'Oct', signed: 12 },
    { month: 'Nov', signed: 16 },
    { month: 'Dic', signed: 18 },
    { month: 'Ene', signed: 19 },
    { month: 'Feb', signed: 21 },
    { month: 'Mar', signed: 20 },
    { month: 'Abr', signed: 22 },
    { month: 'May', signed: 23 },
    { month: 'Jun', signed: 24 },
];

interface ComparisonRow {
    label: string;
    you: string;
    team: string;
    youValue: number;
    teamValue: number;
    /** "lower-better" or "higher-better" */
    direction: 'higher' | 'lower';
    suffix?: string;
}

const COMPARISON: ComparisonRow[] = [
    { label: 'Documentos firmados', you: '24', team: '17', youValue: 24, teamValue: 17, direction: 'higher' },
    { label: 'Tiempo de respuesta', you: '1.8 h', team: '2.4 h', youValue: 1.8, teamValue: 2.4, direction: 'lower' },
    { label: 'Tasa de finalización', you: '94%', team: '88%', youValue: 94, teamValue: 88, direction: 'higher', suffix: '%' },
    { label: 'Días con actividad', you: '22', team: '18', youValue: 22, teamValue: 18, direction: 'higher' },
];

const DOC_TYPE_DISTRIBUTION = [
    { name: 'Contrato', count: 11, pct: 46 },
    { name: 'NDA', count: 7, pct: 29 },
    { name: 'Acuerdo', count: 4, pct: 17 },
    { name: 'Anexo', count: 2, pct: 8 },
];

interface ActivityEvent {
    title: string;
    detail: string;
    time: string;
    type: 'sign' | 'create' | 'reject';
}

const RECENT_ACTIVITY: ActivityEvent[] = [
    { title: 'Firmaste un documento', detail: 'D-2026-040 — Acuerdo de colaboración Q2', time: 'hace 1 h', type: 'sign' },
    { title: 'Creaste un documento', detail: 'D-2026-038 — Anexo modificatorio v2', time: 'hace 4 h', type: 'create' },
    { title: 'Firmaste un documento', detail: 'D-2026-035 — Contrato laboral', time: 'ayer', type: 'sign' },
    { title: 'Rechazaste un documento', detail: 'D-2026-033 — NDA proveedor', time: 'ayer', type: 'reject' },
    { title: 'Firmaste un documento', detail: 'D-2026-031 — Política interna', time: 'hace 3 días', type: 'sign' },
    { title: 'Creaste un documento', detail: 'D-2026-029 — NDA proveedor cloud', time: 'hace 5 días', type: 'create' },
];

const ACTIVITY_DOT: Record<ActivityEvent['type'], string> = {
    sign: 'bg-emerald-500',
    create: 'bg-[#1e40af]',
    reject: 'bg-rose-500',
};

const PERIODS = ['7d', '30d', '90d', '12m'] as const;
type Period = (typeof PERIODS)[number];
const PERIOD_POINTS: Record<Period, number> = { '7d': 4, '30d': 6, '90d': 9, '12m': 12 };

export default function Activity() {
    const { showToast } = useToast();
    const [period, setPeriod] = useState<Period>('12m');
    const [exporting, setExporting] = useState(false);

    const evolutionData = useMemo(
        () => SIGNATURE_EVOLUTION.slice(-PERIOD_POINTS[period]),
        [period],
    );

    const handlePeriod = (next: Period) => {
        setPeriod(next);
        showToast(`Mostrando los últimos ${next}.`, 'info');
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();

            const kpiSheet = workbook.addWorksheet('Indicadores');
            kpiSheet.columns = [
                { header: 'Indicador', key: 'title', width: 28 },
                { header: 'Valor', key: 'value', width: 14 },
                { header: 'Tendencia', key: 'trend', width: 14 },
            ];
            KPIS.forEach((k) => kpiSheet.addRow({ title: k.title, value: k.value, trend: k.trend }));

            const evoSheet = workbook.addWorksheet('Evolución de firmas');
            evoSheet.columns = [
                { header: 'Mes', key: 'month', width: 12 },
                { header: 'Firmados', key: 'signed', width: 12 },
            ];
            evolutionData.forEach((d) => evoSheet.addRow(d));

            const compSheet = workbook.addWorksheet('Comparativo equipo');
            compSheet.columns = [
                { header: 'Métrica', key: 'label', width: 26 },
                { header: 'Tú', key: 'you', width: 12 },
                { header: 'Promedio del equipo', key: 'team', width: 22 },
            ];
            COMPARISON.forEach((c) => compSheet.addRow(c));

            const typesSheet = workbook.addWorksheet('Tipos de documento');
            typesSheet.columns = [
                { header: 'Tipo', key: 'name', width: 18 },
                { header: 'Cantidad', key: 'count', width: 14 },
                { header: 'Porcentaje', key: 'pct', width: 14 },
            ];
            DOC_TYPE_DISTRIBUTION.forEach((d) => typesSheet.addRow(d));

            [kpiSheet, evoSheet, compSheet, typesSheet].forEach((sheet) => {
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
            saveAs(blob, `mi-actividad_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            showToast('No fue posible exportar el archivo.', 'error');
            setExporting(false);
        }
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Reporte exportado correctamente.', 'success');
    };

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Mi actividad
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Métricas personales de tu desempeño en la plataforma.
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

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {KPIS.map((kpi) => (
                        <KPICard key={kpi.title} kpi={kpi} period={period} />
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                    {/* Signature evolution */}
                    <section className="xl:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                    Evolución de tus firmas
                                </h2>
                                <p className="text-[12px] text-slate-500 mt-0.5">
                                    Firmas que hiciste en los últimos {PERIOD_POINTS[period]} meses.
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
                            <SignatureChart data={evolutionData} />
                        </div>
                    </section>

                    {/* Doc types */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200">
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                Tipos que más firmas
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">Distribución personal.</p>
                        </div>
                        <div className="p-5">
                            <DocTypeChart data={DOC_TYPE_DISTRIBUTION} />
                        </div>
                    </section>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {/* Comparison vs team */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200">
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                Tú vs el equipo
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                                Comparativo con el promedio de tu organización.
                            </p>
                        </div>
                        <ul className="px-5 py-3">
                            {COMPARISON.map((row) => (
                                <ComparisonItem key={row.label} row={row} />
                            ))}
                        </ul>
                    </section>

                    {/* Recent activity */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                Actividad reciente
                            </h2>
                            <span className="text-[11px] text-slate-400 font-mono inline-flex items-center gap-1">
                                <BsCalendar3 size={10} />
                                Últimos 7 días
                            </span>
                        </div>
                        <ul className="px-5 py-3 max-h-[320px] overflow-y-auto custom-scrollbar">
                            {RECENT_ACTIVITY.map((item, i) => (
                                <li key={i} className="flex gap-3 py-2.5 relative">
                                    <div className="flex flex-col items-center shrink-0">
                                        <span className={`w-1.5 h-1.5 rounded-full ${ACTIVITY_DOT[item.type]} mt-1.5`} />
                                        {i !== RECENT_ACTIVITY.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" />}
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
                </div>
            </div>

            <AnimatePresence>
                {exporting && (
                    <ExportOverlay
                        label="Exportando tu actividad"
                        description="Estamos preparando un archivo con todas tus métricas."
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

/* ---------- KPI ---------- */

function KPICard({ kpi, period }: { kpi: KPI; period: Period }) {
    const TrendIcon = kpi.positive ? BsArrowUp : BsArrowDown;
    const trendColor = kpi.positive ? 'text-emerald-700' : 'text-rose-700';
    const accentColor = kpi.positive ? '#047857' : '#b91c1c';

    const visibleValues = useMemo(
        () => kpi.sparkline.slice(-PERIOD_POINTS[period]),
        [kpi.sparkline, period],
    );

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-400 shrink-0">{kpi.icon}</span>
                    <span className="text-[12px] font-medium text-slate-500 truncate">{kpi.title}</span>
                </div>
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium shrink-0 ${trendColor}`}>
                    <TrendIcon size={9} />
                    {kpi.trend}
                </span>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-none tabular-nums">
                    {kpi.value}
                </p>
                <Sparkline values={visibleValues} color={accentColor} />
            </div>

            <p className="text-[11px] text-slate-400 mt-2">{kpi.description}</p>
        </div>
    );
}

/* ---------- Sparkline ---------- */

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
                <path d={linePath} fill="none" stroke={color} strokeWidth={1.25} strokeLinejoin="round" strokeLinecap="round" />
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

/* ---------- Signature chart (interactive SVG) ---------- */

interface HoverState {
    index: number;
    x: number;
    y: number;
    month: string;
    signed: number;
}

function SignatureChart({ data }: { data: { month: string; signed: number }[] }) {
    const width = 600;
    const height = 220;
    const padding = { top: 16, right: 16, bottom: 28, left: 16 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const containerRef = useRef<SVGSVGElement>(null);
    const [hover, setHover] = useState<HoverState | null>(null);

    const max = Math.max(...data.map((d) => d.signed));
    const min = Math.min(...data.map((d) => d.signed));
    const range = max - min || 1;
    const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

    const points = data.map((d, i) => {
        const x = padding.left + i * stepX;
        const y = padding.top + chartH - ((d.signed - min) / range) * chartH;
        return { x, y, ...d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    const total = data.reduce((sum, d) => sum + d.signed, 0);
    const avg = Math.round(total / data.length);

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

        setHover({
            index: nearest,
            x: points[nearest].x,
            y: points[nearest].y,
            month: points[nearest].month,
            signed: points[nearest].signed,
        });
    };

    return (
        <div>
            <div className="flex items-baseline gap-6 mb-4">
                <div>
                    <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Total firmados</p>
                    <p className="text-[20px] font-semibold text-slate-900 tracking-[-0.02em] tabular-nums">
                        {total.toLocaleString('es-PE')}
                    </p>
                </div>
                <div>
                    <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Promedio mensual</p>
                    <p className="text-[16px] font-semibold text-slate-700 tracking-tight tabular-nums">
                        {avg.toLocaleString('es-PE')}
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
                    aria-label="Gráfico de evolución de firmas"
                >
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

                    <path d={areaPath} fill="#1e40af" opacity={0.08} />
                    <path d={linePath} fill="none" stroke="#1e40af" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />

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

                {hover && (
                    <SignatureTooltip
                        x={(hover.x / width) * 100}
                        y={(hover.y / height) * 100}
                        month={hover.month}
                        signed={hover.signed}
                        previous={hover.index > 0 ? data[hover.index - 1].signed : null}
                    />
                )}
            </div>
        </div>
    );
}

function SignatureTooltip({
    x,
    y,
    month,
    signed,
    previous,
}: {
    x: number;
    y: number;
    month: string;
    signed: number;
    previous: number | null;
}) {
    const delta = previous !== null ? signed - previous : null;
    const pct = previous !== null && previous !== 0 ? ((signed - previous) / previous) * 100 : null;
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
                    {signed.toLocaleString('es-PE')} firmados
                </p>
                {pct !== null && (
                    <p className={`text-[11px] font-medium mt-0.5 ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {positive ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}% vs mes anterior
                    </p>
                )}
            </div>
            <div className="w-0 h-0 mx-auto border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-slate-200" />
        </div>
    );
}

/* ---------- Doc type chart ---------- */

function DocTypeChart({ data }: { data: { name: string; count: number; pct: number }[] }) {
    const max = Math.max(...data.map((d) => d.pct));

    return (
        <div className="space-y-3">
            {data.map((item) => (
                <div key={item.name}>
                    <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[12.5px] font-medium text-slate-700">{item.name}</span>
                        <span className="text-[12px] text-slate-500 tabular-nums">
                            <span className="font-semibold text-slate-900">{item.pct}%</span>
                            <span className="text-slate-400 ml-1">({item.count})</span>
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#1e40af] rounded-full transition-[width] duration-700 ease-out"
                            style={{ width: `${(item.pct / max) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------- Comparison item (you vs team) ---------- */

function ComparisonItem({ row }: { row: ComparisonRow }) {
    const isBetter =
        row.direction === 'higher' ? row.youValue > row.teamValue : row.youValue < row.teamValue;

    const diff =
        row.direction === 'higher'
            ? row.youValue - row.teamValue
            : row.teamValue - row.youValue;

    const diffPct =
        row.direction === 'higher'
            ? Math.round(((row.youValue - row.teamValue) / row.teamValue) * 100)
            : Math.round(((row.teamValue - row.youValue) / row.teamValue) * 100);

    // Bar visualization — relative to the larger of the two
    const maxValue = Math.max(row.youValue, row.teamValue);
    const youPct = (row.youValue / maxValue) * 100;
    const teamPct = (row.teamValue / maxValue) * 100;

    return (
        <li className="py-3 border-b border-slate-100 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-slate-700">{row.label}</span>
                <span className={`text-[11px] font-semibold inline-flex items-center gap-0.5 ${isBetter ? 'text-emerald-700' : 'text-slate-500'
                    }`}>
                    {isBetter && <BsArrowUp size={9} />}
                    {isBetter
                        ? `${diff > 0 ? '+' : ''}${diffPct}% mejor`
                        : 'Por debajo del promedio'}
                </span>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 w-12">Tú</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#1e40af] rounded-full transition-[width] duration-500"
                            style={{ width: `${youPct}%` }}
                        />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-900 tabular-nums w-14 text-right">{row.you}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400 w-12">Equipo</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-slate-300 rounded-full transition-[width] duration-500"
                            style={{ width: `${teamPct}%` }}
                        />
                    </div>
                    <span className="text-[12px] font-medium text-slate-500 tabular-nums w-14 text-right">{row.team}</span>
                </div>
            </div>
        </li>
    );
}
