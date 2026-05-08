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
    BsCheckCircle,
    BsClock,
    BsBullseye,
    BsPersonCheck,
    BsChevronUp,
    BsChevronDown,
    BsExclamationTriangle,
    BsFileEarmarkText,
} from 'react-icons/bs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import ExportOverlay from '../../../components/ExportOverlay';
import { useToast } from '../../../context/ToastContext';
import { usePlan } from '../../../hooks/usePlan';

/* ---------- Mock data ---------- */

interface KPI {
    title: string;
    value: string;
    trend: string;
    positive: boolean;
    description: string;
    icon: React.ReactNode;
    sparkline: number[];
}

const PRIMARY_KPIS: KPI[] = [
    {
        title: 'Documentos firmados',
        value: '184',
        trend: '+18%',
        positive: true,
        description: 'En el periodo',
        icon: <BsCheckCircle size={13} />,
        sparkline: [98, 110, 124, 132, 141, 150, 158, 162, 170, 175, 180, 184],
    },
    {
        title: 'Tiempo de firma promedio',
        value: '2.4 días',
        trend: '-12 h',
        positive: true,
        description: 'Desde envío hasta firma',
        icon: <BsClock size={13} />,
        sparkline: [4.1, 3.9, 3.8, 3.5, 3.4, 3.2, 3.0, 2.9, 2.7, 2.6, 2.5, 2.4],
    },
    {
        title: 'Tasa de finalización',
        value: '92%',
        trend: '+4%',
        positive: true,
        description: 'Firmados vs enviados',
        icon: <BsBullseye size={13} />,
        sparkline: [78, 80, 81, 83, 84, 86, 87, 88, 89, 90, 91, 92],
    },
    {
        title: 'Documentos por empleado',
        value: '7.6',
        trend: '+0.8',
        positive: true,
        description: 'Productividad promedio',
        icon: <BsPersonCheck size={13} />,
        sparkline: [5.2, 5.5, 5.8, 6.0, 6.2, 6.5, 6.8, 7.0, 7.2, 7.3, 7.5, 7.6],
    },
];

const SIGNATURE_EVOLUTION = [
    { month: 'Jul', signed: 12 },
    { month: 'Ago', signed: 16 },
    { month: 'Sep', signed: 19 },
    { month: 'Oct', signed: 18 },
    { month: 'Nov', signed: 22 },
    { month: 'Dic', signed: 25 },
    { month: 'Ene', signed: 28 },
    { month: 'Feb', signed: 30 },
    { month: 'Mar', signed: 32 },
    { month: 'Abr', signed: 35 },
    { month: 'May', signed: 38 },
    { month: 'Jun', signed: 42 },
];

const DOC_TYPE_DISTRIBUTION = [
    { name: 'Contrato', count: 82, pct: 45 },
    { name: 'NDA', count: 55, pct: 30 },
    { name: 'Acuerdo', count: 27, pct: 15 },
    { name: 'Anexo', count: 14, pct: 7 },
    { name: 'Otro', count: 6, pct: 3 },
];

const TOP_SIGNERS = [
    { name: 'Acme Corp', email: 'legal@acme.com', count: 28 },
    { name: 'Beta Industries', email: 'docs@beta.io', count: 22 },
    { name: 'TechGraphics Inc', email: 'support@techgraph.com', count: 18 },
    { name: 'Global Partners', email: 'admin@globalpartners.com', count: 14 },
    { name: 'Nordic Holdings', email: 'olaf@nordic.no', count: 11 },
];

const PIPELINE = [
    { label: 'Borradores', value: 6, dot: 'bg-slate-400' },
    { label: 'Enviados', value: 12, dot: 'bg-sky-500' },
    { label: 'Pendientes', value: 18, dot: 'bg-amber-500' },
    { label: 'Firmados (mes)', value: 42, dot: 'bg-emerald-500' },
];

const DEPARTMENTS_USAGE = [
    { name: 'Operaciones', count: 68 },
    { name: 'Comercial', count: 52 },
    { name: 'Recursos Humanos', count: 31 },
    { name: 'Tecnología', count: 22 },
    { name: 'Finanzas', count: 11 },
];

interface TeamRow {
    name: string;
    role: 'admin' | 'employee';
    department: string;
    created: number;
    pending: number;
    completionRate: number;
}

const TEAM_PRODUCTIVITY: TeamRow[] = [
    { name: 'Hans Weber', role: 'admin', department: 'Dirección', created: 42, pending: 4, completionRate: 96 },
    { name: 'Anna Schmidt', role: 'employee', department: 'Operaciones', created: 35, pending: 6, completionRate: 91 },
    { name: 'Diego Ramos', role: 'employee', department: 'Tecnología', created: 22, pending: 3, completionRate: 88 },
    { name: 'Lucía Vargas', role: 'employee', department: 'Operaciones', created: 28, pending: 5, completionRate: 90 },
    { name: 'Patricia Rojas', role: 'employee', department: 'Comercial', created: 14, pending: 2, completionRate: 86 },
    { name: 'María Torres', role: 'employee', department: 'Recursos Humanos', created: 18, pending: 3, completionRate: 89 },
];

const PERIODS = ['7d', '30d', '90d', '12m'] as const;
type Period = (typeof PERIODS)[number];
const PERIOD_POINTS: Record<Period, number> = { '7d': 4, '30d': 6, '90d': 9, '12m': 12 };

type SortKey = 'name' | 'department' | 'created' | 'pending' | 'completionRate';
type SortDir = 'asc' | 'desc';

export default function Reports() {
    const { showToast } = useToast();
    const { plan, planName, isFeatureEnabled } = usePlan();
    const [period, setPeriod] = useState<Period>('12m');
    const [exporting, setExporting] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('completionRate');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const hasAdvanced = isFeatureEnabled('advanced_analytics');

    const evolutionData = useMemo(
        () => SIGNATURE_EVOLUTION.slice(-PERIOD_POINTS[period]),
        [period],
    );

    const sortedTeam = useMemo(() => {
        return [...TEAM_PRODUCTIVITY].sort((a, b) => {
            let va: string | number;
            let vb: string | number;
            if (sortKey === 'name') {
                va = a.name.toLowerCase();
                vb = b.name.toLowerCase();
            } else if (sortKey === 'department') {
                va = a.department.toLowerCase();
                vb = b.department.toLowerCase();
            } else {
                va = a[sortKey];
                vb = b[sortKey];
            }
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

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
                { header: 'Indicador', key: 'title', width: 32 },
                { header: 'Valor', key: 'value', width: 14 },
                { header: 'Tendencia', key: 'trend', width: 14 },
            ];
            PRIMARY_KPIS.forEach((k) =>
                kpiSheet.addRow({ title: k.title, value: k.value, trend: k.trend }),
            );

            const evoSheet = workbook.addWorksheet('Evolución de firmas');
            evoSheet.columns = [
                { header: 'Mes', key: 'month', width: 12 },
                { header: 'Firmados', key: 'signed', width: 12 },
            ];
            evolutionData.forEach((d) => evoSheet.addRow(d));

            const teamSheet = workbook.addWorksheet('Productividad del equipo');
            teamSheet.columns = [
                { header: 'Empleado', key: 'name', width: 24 },
                { header: 'Departamento', key: 'department', width: 22 },
                { header: 'Documentos creados', key: 'created', width: 18 },
                { header: 'Pendientes', key: 'pending', width: 14 },
                { header: 'Finalización (%)', key: 'completionRate', width: 16 },
            ];
            sortedTeam.forEach((t) => teamSheet.addRow(t));

            const typesSheet = workbook.addWorksheet('Tipos de documento');
            typesSheet.columns = [
                { header: 'Tipo', key: 'name', width: 18 },
                { header: 'Cantidad', key: 'count', width: 14 },
                { header: 'Porcentaje', key: 'pct', width: 14 },
            ];
            DOC_TYPE_DISTRIBUTION.forEach((d) => typesSheet.addRow(d));

            [kpiSheet, evoSheet, teamSheet, typesSheet].forEach((sheet) => {
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
            saveAs(blob, `reportes_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                            Reportes
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Analítica detallada de la actividad de tu empresa.
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

                {/* Plan limitation banner */}
                {!hasAdvanced && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
                        <span className="shrink-0 text-amber-600">
                            <BsExclamationTriangle size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-amber-900">
                                Estás usando reportes básicos del plan {planName}.
                            </p>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                                Mejora a Enterprise para acceder a analítica avanzada, segmentación por departamento e
                                historial ilimitado.
                            </p>
                        </div>
                    </div>
                )}

                {/* Primary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PRIMARY_KPIS.map((kpi) => (
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
                                    Evolución de firmas
                                </h2>
                                <p className="text-[12px] text-slate-500 mt-0.5">
                                    Documentos firmados en los últimos {PERIOD_POINTS[period]} meses.
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

                    {/* Doc type distribution */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200">
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                Tipos de documento
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">Distribución actual.</p>
                        </div>
                        <div className="p-5">
                            <DocTypeChart data={DOC_TYPE_DISTRIBUTION} />
                        </div>
                    </section>
                </div>

                {/* Team productivity */}
                <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                Productividad del equipo
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                                Documentos creados, pendientes y tasa de finalización por empleado.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => showToast('Vista completa próximamente.', 'info')}
                            className="text-[12px] font-medium text-[#1e40af] hover:text-[#1e3a8a] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            Ver todos <BsArrowRight size={11} />
                        </button>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50/60 border-b border-slate-200">
                                    <SortableTh label="Empleado" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                    <SortableTh label="Departamento" sortKey="department" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                    <SortableTh label="Creados" sortKey="created" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                                    <SortableTh label="Pendientes" sortKey="pending" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                                    <SortableTh label="Finalización" sortKey="completionRate" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTeam.map((t) => (
                                    <TeamRow key={t.name} row={t} onClick={() => showToast(`El detalle de ${t.name} está disponible en Empleados.`, 'info')} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Bottom row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {/* Pipeline */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200">
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                Pipeline actual
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                                Estado actual de tus documentos.
                            </p>
                        </div>
                        <ul className="px-5 py-3">
                            {PIPELINE.map((item) => (
                                <li key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                                        <span className="text-[13px] text-slate-700">{item.label}</span>
                                    </div>
                                    <span className="text-[15px] font-semibold text-slate-900 tabular-nums">{item.value}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Departments usage (amCharts) */}
                    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200">
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                Documentos por departamento
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                                Distribución del uso interno.
                            </p>
                        </div>
                        <div className="p-5">
                            <DepartmentsChart data={DEPARTMENTS_USAGE} />
                        </div>
                    </section>
                </div>

                {/* Top signers */}
                <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200">
                        <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                            Firmantes externos más activos
                        </h2>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                            Clientes y partners con mayor cantidad de documentos firmados.
                        </p>
                    </div>
                    <ul className="px-5 py-3">
                        {TOP_SIGNERS.map((s, i) => (
                            <li key={s.email} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-b-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-600 shrink-0 tabular-nums">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-slate-900 truncate">{s.name}</p>
                                        <p className="text-[11px] text-slate-500 font-mono truncate">{s.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <BsFileEarmarkText size={11} className="text-slate-400" />
                                    <span className="text-[13px] font-semibold text-slate-900 tabular-nums">{s.count}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Footer note */}
                <p className="text-[11px] text-slate-400 text-center">
                    Datos basados en tu plan {planName}. {plan.historyDays === -1
                        ? 'Historial ilimitado.'
                        : `Últimos ${plan.historyDays} días disponibles.`}
                </p>
            </div>

            <AnimatePresence>
                {exporting && (
                    <ExportOverlay
                        label="Exportando reportes"
                        description="Estamos preparando un archivo con todos los indicadores."
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
                    <span className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                        {kpi.icon}
                    </span>
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

/* ---------- Signature evolution chart (interactive SVG) ---------- */

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
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#1e40af"
                        strokeWidth={1.75}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

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

/* ---------- Doc type chart (horizontal bars) ---------- */

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

/* ---------- Departments chart (amCharts) ---------- */

function DepartmentsChart({ data }: { data: { name: string; count: number }[] }) {
    const chartRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);
        root.setThemes([am5themes_Animated.new(root)]);

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
                layout: root.verticalLayout,
            }),
        );

        const yRenderer = am5xy.AxisRendererY.new(root, {
            inversed: true,
            cellStartLocation: 0.2,
            cellEndLocation: 0.8,
        });
        yRenderer.grid.template.set('forceHidden', true);
        yRenderer.labels.template.setAll({
            fontSize: 11,
            fontFamily: 'Inter',
            fill: am5.color('#475569'),
        });

        const yAxis = chart.yAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: 'name',
                renderer: yRenderer,
            }),
        );
        yAxis.data.setAll(data);

        const xRenderer = am5xy.AxisRendererX.new(root, { strokeOpacity: 0 });
        xRenderer.grid.template.setAll({
            stroke: am5.color('#f1f5f9'),
            strokeOpacity: 1,
        });
        xRenderer.labels.template.setAll({
            fontSize: 10,
            fontFamily: 'Inter',
            fill: am5.color('#94a3b8'),
        });

        const xAxis = chart.xAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: xRenderer,
                min: 0,
            }),
        );

        const series = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                xAxis,
                yAxis,
                valueXField: 'count',
                categoryYField: 'name',
                tooltip: am5.Tooltip.new(root, {
                    labelText: '[bold]{name}[/]\n{valueX} documentos',
                }),
            }),
        );

        series.columns.template.setAll({
            cornerRadiusTR: 3,
            cornerRadiusBR: 3,
            fill: am5.color('#1e40af'),
            stroke: am5.color('#1e40af'),
            fillOpacity: 0.85,
            strokeWidth: 0,
            height: am5.percent(70),
        });

        series.columns.template.states.create('hover', { fillOpacity: 1 });

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
        series.appear(800);
        chart.appear(800, 100);

        return () => {
            root.dispose();
        };
    }, [data]);

    return <div ref={chartRef} className="w-full h-[200px]" />;
}

/* ---------- Sortable table header ---------- */

function SortableTh({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
    align = 'left',
}: {
    label: string;
    sortKey: SortKey;
    currentSort: SortKey;
    currentDir: SortDir;
    onSort: (key: SortKey) => void;
    align?: 'left' | 'right';
}) {
    const isActive = currentSort === sortKey;
    return (
        <th className={`px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider ${align === 'right' ? 'text-right' : ''}`}>
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${isActive ? 'text-slate-900' : 'hover:text-slate-700'
                    }`}
                aria-sort={isActive ? (currentDir === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
                {label}
                {isActive ? (
                    currentDir === 'asc' ? <BsChevronUp size={9} /> : <BsChevronDown size={9} />
                ) : (
                    <span className="opacity-30">
                        <BsChevronDown size={9} />
                    </span>
                )}
            </button>
        </th>
    );
}

/* ---------- Team row ---------- */

function TeamRow({ row, onClick }: { row: TeamRow; onClick: () => void }) {
    const completionColor =
        row.completionRate >= 90 ? 'bg-emerald-500'
            : row.completionRate >= 75 ? 'bg-amber-500'
                : 'bg-rose-500';

    return (
        <tr
            onClick={onClick}
            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors cursor-pointer"
        >
            <td className="px-4 py-2.5">
                <p className="text-[13px] font-semibold text-slate-900">{row.name}</p>
                <p className="text-[11px] text-slate-500 capitalize">
                    {row.role === 'admin' ? 'Administrador' : 'Empleado'}
                </p>
            </td>
            <td className="px-4 py-2.5">
                <span className="text-[12px] text-slate-700">{row.department}</span>
            </td>
            <td className="px-4 py-2.5 text-right">
                <span className="text-[13px] font-mono tabular-nums text-slate-700">{row.created}</span>
            </td>
            <td className="px-4 py-2.5 text-right">
                <span className="text-[13px] font-mono tabular-nums text-slate-700">{row.pending}</span>
            </td>
            <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${completionColor} rounded-full transition-[width] duration-500`}
                            style={{ width: `${row.completionRate}%` }}
                        />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-900 tabular-nums w-8 text-right">
                        {row.completionRate}%
                    </span>
                </div>
            </td>
        </tr>
    );
}
