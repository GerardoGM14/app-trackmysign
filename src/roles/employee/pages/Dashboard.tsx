import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
    BsClock,
    BsCheckCircle,
    BsFileEarmarkText,
    BsLightningCharge,
    BsArrowUp,
    BsArrowDown,
    BsArrowRight,
    BsFileEarmarkPdf,
    BsExclamationTriangle,
    BsSunFill,
    BsCloudSunFill,
    BsMoonStarsFill,
    BsPenFill,
    BsCheckCircleFill,
    BsEye,
    BsX,
    BsDownload,
} from 'react-icons/bs';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import SignatureModal from '../../../components/SignatureModal';

interface KPI {
    title: string;
    value: string;
    trend?: string;
    positive?: boolean;
    icon: React.ReactNode;
    sparkline: number[];
    description: string;
    isAlert?: boolean;
}

const KPIS: KPI[] = [
    {
        title: 'Pendientes de firmar',
        value: '3',
        icon: <BsExclamationTriangle size={13} />,
        sparkline: [1, 2, 1, 2, 3, 2, 1, 2, 3, 2, 3, 3],
        description: '1 vence en menos de 48 h',
        isAlert: true,
    },
    {
        title: 'Firmados este mes',
        value: '24',
        trend: '+6',
        positive: true,
        icon: <BsCheckCircle size={13} />,
        sparkline: [12, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 24],
        description: 'Tu mejor mes hasta ahora',
    },
    {
        title: 'Órdenes asignadas',
        value: '8',
        trend: '+2',
        positive: true,
        icon: <BsFileEarmarkText size={13} />,
        sparkline: [4, 5, 6, 7, 7, 8, 7, 8, 8, 9, 8, 8],
        description: 'En producción ahora',
    },
    {
        title: 'Tiempo de respuesta',
        value: '1.8 h',
        trend: '-22 min',
        positive: true,
        icon: <BsClock size={13} />,
        sparkline: [3.4, 3.2, 3.0, 2.8, 2.6, 2.5, 2.3, 2.1, 2.0, 1.9, 1.85, 1.8],
        description: 'Promedio para firmar',
    },
];

interface PendingDoc {
    id: string;
    title: string;
    sender: string;
    expiresIn: number; // hours
    type: 'Contrato' | 'NDA' | 'Anexo' | 'Acuerdo';
    status: 'pending' | 'signed';
    signature?: string; // dataURL once signed
    signedAt?: string;
}

const PENDING: PendingDoc[] = [
    { id: 'D-2026-041', title: 'NDA — Beta Industries', sender: 'Hans Weber', expiresIn: 36, type: 'NDA', status: 'pending' },
    { id: 'D-2026-039', title: 'Renovación contrato anual', sender: 'Anna Schmidt', expiresIn: 96, type: 'Contrato', status: 'pending' },
    { id: 'D-2026-037', title: 'Anexo vacaciones 2026', sender: 'María Torres', expiresIn: 240, type: 'Anexo', status: 'pending' },
];

interface ActivityItem {
    title: string;
    detail: string;
    time: string;
    type: 'sign' | 'create' | 'pending';
}

const ACTIVITY: ActivityItem[] = [
    { title: 'Firmaste un documento', detail: 'D-2026-040 — Acuerdo de colaboración Q2', time: 'hace 1 h', type: 'sign' },
    { title: 'Documento enviado para tu firma', detail: 'D-2026-041 — NDA Beta Industries', time: 'hace 5 h', type: 'pending' },
    { title: 'Creaste un documento', detail: 'D-2026-038 — Anexo modificatorio v2', time: 'ayer', type: 'create' },
    { title: 'Firmaste un documento', detail: 'D-2026-035 — Contrato laboral', time: 'ayer', type: 'sign' },
    { title: 'Documento enviado para tu firma', detail: 'D-2026-039 — Renovación contrato anual', time: 'hace 2 días', type: 'pending' },
];

const ACTIVITY_DOT: Record<ActivityItem['type'], string> = {
    sign: 'bg-emerald-500',
    create: 'bg-[#1e40af]',
    pending: 'bg-amber-500',
};

function getGreeting(): { text: string; icon: React.ReactNode; color: string } {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Buenos días', icon: <BsSunFill size={18} />, color: 'text-amber-500' };
    if (hour < 19) return { text: 'Buenas tardes', icon: <BsCloudSunFill size={18} />, color: 'text-orange-500' };
    return { text: 'Buenas noches', icon: <BsMoonStarsFill size={18} />, color: 'text-indigo-500' };
}

function formatExpiry(hours: number): { text: string; color: string } {
    if (hours <= 24) return { text: `Vence en ${hours} h`, color: 'text-rose-700' };
    if (hours <= 72) return { text: `Vence en ${Math.round(hours / 24)} días`, color: 'text-amber-700' };
    return { text: `Vence en ${Math.round(hours / 24)} días`, color: 'text-slate-500' };
}

export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [pending, setPending] = useState<PendingDoc[]>(PENDING);
    const [signingDoc, setSigningDoc] = useState<PendingDoc | null>(null);
    const [previewDoc, setPreviewDoc] = useState<PendingDoc | null>(null);

    const userName = user?.email?.split('@')[0] ?? 'empleado';
    const greeting = getGreeting();
    const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

    const lastUpdate = new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });

    const handleOpenSign = (doc: PendingDoc) => {
        setSigningDoc(doc);
    };

    const handleConfirmSign = (signatureDataUrl: string) => {
        if (!signingDoc) return;
        const signedAt = new Date().toLocaleString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        setPending((prev) =>
            prev.map((d) =>
                d.id === signingDoc.id
                    ? { ...d, status: 'signed', signature: signatureDataUrl, signedAt }
                    : d,
            ),
        );
        showToast(`Firmaste "${signingDoc.id}" correctamente.`, 'success');
        setSigningDoc(null);
    };

    const handleOpenInbox = (doc: PendingDoc) => {
        navigate('/inbox');
        showToast(`El detalle de "${doc.id}" estará disponible en Mis pendientes.`, 'info');
    };

    return (
        <div className="space-y-5">
            {/* Greeting header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <p className="text-[12px] font-medium text-slate-400 mb-1">
                        {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight flex items-center gap-2.5">
                        <span className={greeting.color}>{greeting.icon}</span>
                        {greeting.text}, <span>{displayName}</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        {pending.length > 0
                            ? `Tienes ${pending.length} documento${pending.length > 1 ? 's' : ''} esperando tu firma.`
                            : 'No tienes pendientes. ¡Buen trabajo!'}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                    <span className="text-[11px] text-slate-400 font-mono mr-1 hidden sm:inline">
                        Actualizado · {lastUpdate}
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate('/inbox')}
                        className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <BsLightningCharge size={12} />
                        Ir a pendientes
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
                {/* Pending docs */}
                <section className="xl:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
                        <div>
                            <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">Por firmar</h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                                Documentos esperándote, ordenados por urgencia.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/inbox')}
                            className="text-[12px] font-medium text-[#1e40af] hover:text-[#1e3a8a] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            Ver todos <BsArrowRight size={11} />
                        </button>
                    </div>

                    {pending.length === 0 ? (
                        <div className="px-6 py-12 flex flex-col items-center text-center">
                            <span className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                                <BsCheckCircle size={18} />
                            </span>
                            <p className="text-[13px] font-semibold text-slate-700">Bandeja al día</p>
                            <p className="text-[12px] text-slate-500 mt-1">No tienes documentos pendientes de firma.</p>
                        </div>
                    ) : (
                        <ul className="px-2 py-2">
                            {pending.map((doc) => {
                                const expiry = formatExpiry(doc.expiresIn);
                                const isUrgent = doc.expiresIn <= 24 && doc.status === 'pending';
                                const isSigned = doc.status === 'signed';

                                return (
                                    <li key={doc.id}>
                                        <div
                                            className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${isSigned
                                                    ? 'bg-emerald-50/40 border-l-2 border-emerald-500 -ml-0.5'
                                                    : isUrgent
                                                        ? 'border-l-2 border-rose-400 -ml-0.5 hover:bg-slate-50'
                                                        : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => (isSigned ? setPreviewDoc(doc) : handleOpenInbox(doc))}
                                                className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                                            >
                                                <span
                                                    className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${isSigned
                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                                            : 'bg-rose-50 border-rose-200 text-rose-600'
                                                        }`}
                                                >
                                                    <BsFileEarmarkPdf size={15} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-semibold text-slate-900 truncate">{doc.title}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[11px] text-slate-500">{doc.type}</span>
                                                        <span className="text-slate-300">·</span>
                                                        <span className="text-[11px] text-slate-500">de {doc.sender}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 hidden sm:block">
                                                    {isSigned ? (
                                                        <>
                                                            <p className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                                                                <BsCheckCircleFill size={10} />
                                                                Firmado
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{doc.signedAt}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className={`text-[11px] font-semibold ${expiry.color}`}>{expiry.text}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.id}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </button>

                                            {isSigned ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewDoc(doc)}
                                                    className="h-8 px-2.5 bg-white border border-slate-200 text-slate-700 text-[12px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                                                >
                                                    <BsEye size={11} />
                                                    Ver firma
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenSign(doc)}
                                                    className="h-8 px-2.5 bg-slate-950 text-white text-[12px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                                                >
                                                    <BsPenFill size={11} />
                                                    Firmar
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* Activity feed */}
                <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">Mi actividad</h3>
                        <span className="text-[11px] text-slate-400 font-mono">Últimos días</span>
                    </div>
                    <ul className="px-5 py-2 max-h-[320px] overflow-y-auto custom-scrollbar">
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
            </div>

            {/* Quick actions */}
            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200">
                    <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">Accesos rápidos</h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">Lo que más usas a la mano.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    <QuickAction
                        icon={<BsLightningCharge size={16} />}
                        title="Revisar pendientes"
                        description={`${pending.length} documento${pending.length === 1 ? '' : 's'} esperando tu firma.`}
                        onClick={() => navigate('/inbox')}
                    />
                    <QuickAction
                        icon={<BsFileEarmarkText size={16} />}
                        title="Mis documentos"
                        description="Lo que has creado y firmado."
                        onClick={() => navigate('/my-documents')}
                    />
                    <QuickAction
                        icon={<BsArrowUp size={16} />}
                        title="Mi actividad"
                        description="Métricas de tu desempeño."
                        onClick={() => navigate('/activity')}
                    />
                </div>
            </section>

            <AnimatePresence>
                {signingDoc && (
                    <SignatureModal
                        doc={signingDoc}
                        signerName={displayName}
                        onClose={() => setSigningDoc(null)}
                        onSign={handleConfirmSign}
                    />
                )}

                {previewDoc && previewDoc.signature && (
                    <SignaturePreviewModal
                        doc={previewDoc}
                        signerName={displayName}
                        onClose={() => setPreviewDoc(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function SignaturePreviewModal({
    doc,
    signerName,
    onClose,
}: {
    doc: PendingDoc;
    signerName: string;
    onClose: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleDownload = () => {
        if (!doc.signature) return;
        const link = document.createElement('a');
        link.href = doc.signature;
        link.download = `firma-${doc.id}.png`;
        link.click();
    };

    return (
        <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="preview-title"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 id="preview-title" className="text-[15px] font-semibold text-white tracking-tight">
                        Firma registrada
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="w-7 h-7 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <BsX size={18} />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-start gap-3">
                    <span className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                        <BsCheckCircleFill size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-slate-900 truncate">{doc.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span>{doc.type}</span>
                            <span className="text-slate-300">·</span>
                            <span>de {doc.sender}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono">{doc.id}</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                        Firma de {signerName}
                    </p>
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-md p-4 flex items-center justify-center min-h-[160px]">
                        <img
                            src={doc.signature}
                            alt={`Firma de ${signerName}`}
                            className="max-h-[140px] max-w-full object-contain"
                            draggable={false}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                            <BsCheckCircleFill size={10} className="text-emerald-600" />
                            Firmado el <span className="text-slate-700 font-medium">{doc.signedAt}</span>
                        </span>
                    </div>
                </div>

                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <BsDownload size={12} />
                        Descargar firma
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function KPICard({ kpi }: { kpi: KPI }) {
    const TrendIcon = kpi.positive ? BsArrowUp : BsArrowDown;
    const trendColor = kpi.positive ? 'text-emerald-700' : 'text-rose-700';
    const accentColor = kpi.isAlert ? '#b91c1c' : '#047857';

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 ${kpi.isAlert
                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                    >
                        {kpi.icon}
                    </span>
                    <span className="text-[12px] font-medium text-slate-500 truncate">{kpi.title}</span>
                </div>
                {kpi.trend && (
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium shrink-0 ${trendColor}`}>
                        <TrendIcon size={9} />
                        {kpi.trend}
                    </span>
                )}
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
                <p
                    className={`text-[28px] font-semibold tracking-[-0.02em] leading-none tabular-nums ${kpi.isAlert ? 'text-rose-700' : 'text-slate-900'
                        }`}
                >
                    {kpi.value}
                </p>
                <Sparkline values={kpi.sparkline} color={accentColor} />
            </div>

            <p className={`text-[11px] mt-2 ${kpi.isAlert ? 'text-rose-700 font-medium' : 'text-slate-400'}`}>
                {kpi.description}
            </p>
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

function QuickAction({
    icon,
    title,
    description,
    onClick,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="px-5 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-3 group"
        >
            <span className="w-9 h-9 rounded-md bg-[#1e40af]/10 border border-[#1e40af]/20 flex items-center justify-center text-[#1e40af] shrink-0">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-900">{title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
            </div>
            <BsArrowRight size={11} className="text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
        </button>
    );
}

