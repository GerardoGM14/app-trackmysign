import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
    BsSearch,
    BsX,
    BsPenFill,
    BsCheckCircle,
    BsClock,
    BsFileEarmarkPdf,
    BsXCircle,
    BsCalendar3,
    BsPersonBadge,
    BsArrowRepeat,
    BsCheck2,
} from 'react-icons/bs';

import SignatureModal from '../../../components/SignatureModal';
import ConfirmModal from '../../../components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

/* ---------- Domain ---------- */

type DocType = 'Contrato' | 'NDA' | 'Anexo' | 'Acuerdo' | 'Otro';

interface PendingDoc {
    id: string;
    title: string;
    sender: string;
    senderEmail: string;
    type: DocType;
    sentAt: string;
    expiresAt: string; // ISO date
    fileSizeKB: number;
    /** Filled when user signs */
    signature?: string;
    signedAt?: string;
    rejected?: boolean;
    rejectionReason?: string;
}

const ME_NAME = 'Anna Schmidt';

const INITIAL_DOCS: PendingDoc[] = [
    {
        id: 'D-2026-041',
        title: 'NDA — Beta Industries',
        sender: 'Hans Weber',
        senderEmail: 'hans@miempresa.com',
        type: 'NDA',
        sentAt: '2026-05-04',
        expiresAt: addDays(0.5),
        fileSizeKB: 184,
    },
    {
        id: 'D-2026-039',
        title: 'Renovación contrato anual',
        sender: 'Hans Weber',
        senderEmail: 'hans@miempresa.com',
        type: 'Contrato',
        sentAt: '2026-05-01',
        expiresAt: addDays(2),
        fileSizeKB: 421,
    },
    {
        id: 'D-2026-037',
        title: 'Anexo vacaciones 2026',
        sender: 'María Torres',
        senderEmail: 'maria@miempresa.com',
        type: 'Anexo',
        sentAt: '2026-04-28',
        expiresAt: addDays(8),
        fileSizeKB: 96,
    },
];

function addDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
}

function hoursUntil(iso: string): number {
    return (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
}

function formatExpiry(iso: string): { text: string; tone: 'critical' | 'warning' | 'neutral' } {
    const hours = hoursUntil(iso);
    if (hours < 0) {
        const daysAgo = Math.abs(Math.round(hours / 24));
        return { text: `Venció hace ${daysAgo} día${daysAgo === 1 ? '' : 's'}`, tone: 'critical' };
    }
    if (hours <= 24) {
        const h = Math.max(1, Math.round(hours));
        return { text: `Vence en ${h} h`, tone: 'critical' };
    }
    if (hours <= 72) {
        const days = Math.round(hours / 24);
        return { text: `Vence en ${days} día${days === 1 ? '' : 's'}`, tone: 'warning' };
    }
    const days = Math.round(hours / 24);
    return { text: `Vence en ${days} días`, tone: 'neutral' };
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

type UrgencyTab = 'all' | 'today' | 'week' | 'expired';

const URGENCY_TABS: { value: UrgencyTab; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'expired', label: 'Vencidos' },
];

export default function Inbox() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const myName = user?.email?.split('@')[0] ?? ME_NAME;

    const [docs, setDocs] = useState<PendingDoc[]>(INITIAL_DOCS);
    const [tab, setTab] = useState<UrgencyTab>('all');
    const [search, setSearch] = useState('');

    const [signingDoc, setSigningDoc] = useState<PendingDoc | null>(null);
    const [previewDoc, setPreviewDoc] = useState<PendingDoc | null>(null);
    const [rejectingDoc, setRejectingDoc] = useState<PendingDoc | null>(null);
    const [confirmReject, setConfirmReject] = useState<{ doc: PendingDoc; reason: string } | null>(null);

    // Counts (always over the original pending — completed don't count)
    const counts = useMemo(() => {
        const pending = docs.filter((d) => !d.signature && !d.rejected);
        return {
            all: pending.length,
            today: pending.filter((d) => hoursUntil(d.expiresAt) <= 24 && hoursUntil(d.expiresAt) >= 0).length,
            week: pending.filter((d) => hoursUntil(d.expiresAt) > 24 && hoursUntil(d.expiresAt) <= 168).length,
            expired: pending.filter((d) => hoursUntil(d.expiresAt) < 0).length,
        };
    }, [docs]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return docs
            .filter((d) => !d.signature && !d.rejected) // Only pending
            .filter((d) => {
                const h = hoursUntil(d.expiresAt);
                if (tab === 'today' && (h < 0 || h > 24)) return false;
                if (tab === 'week' && (h <= 24 || h > 168)) return false;
                if (tab === 'expired' && h >= 0) return false;
                return true;
            })
            .filter((d) => {
                if (!q) return true;
                return (
                    d.title.toLowerCase().includes(q) ||
                    d.id.toLowerCase().includes(q) ||
                    d.sender.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => hoursUntil(a.expiresAt) - hoursUntil(b.expiresAt));
    }, [docs, tab, search]);

    const completed = useMemo(() => docs.filter((d) => d.signature || d.rejected), [docs]);
    const totalPending = counts.all;
    const expiresToday = counts.today;

    /* Handlers */

    const handleConfirmSign = (signatureDataUrl: string) => {
        if (!signingDoc) return;
        const signedAt = new Date().toLocaleString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        setDocs((prev) =>
            prev.map((d) =>
                d.id === signingDoc.id ? { ...d, signature: signatureDataUrl, signedAt } : d,
            ),
        );
        showToast(`Firmaste "${signingDoc.id}" correctamente.`, 'success');
        setSigningDoc(null);
    };

    const handleConfirmReject = () => {
        if (!confirmReject) return;
        setDocs((prev) =>
            prev.map((d) =>
                d.id === confirmReject.doc.id
                    ? { ...d, rejected: true, rejectionReason: confirmReject.reason }
                    : d,
            ),
        );
        showToast(`Documento "${confirmReject.doc.id}" rechazado.`, 'warning');
        setConfirmReject(null);
        setRejectingDoc(null);
    };

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header>
                    <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                        Mis pendientes
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        {totalPending === 0
                            ? 'No tienes documentos esperando tu firma.'
                            : `${totalPending} documento${totalPending === 1 ? '' : 's'} esperando tu firma${expiresToday > 0 ? ` · ${expiresToday} vence${expiresToday === 1 ? '' : 'n'} hoy` : ''
                            }.`}
                    </p>
                </header>

                {/* Critical alert banner */}
                {expiresToday > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 flex items-center gap-3">
                        <BsClock className="text-rose-600 shrink-0" size={14} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-rose-900">
                                {expiresToday === 1
                                    ? 'Tienes 1 documento que vence hoy'
                                    : `Tienes ${expiresToday} documentos que vencen hoy`}
                            </p>
                            <p className="text-[11px] text-rose-700 mt-0.5">
                                Fírmalos antes de que expiren para no bloquear el flujo.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setTab('today')}
                            className="h-8 px-2.5 bg-white border border-rose-300 text-rose-700 text-[12px] font-medium rounded-md hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                        >
                            Ver
                        </button>
                    </div>
                )}

                {/* Tabs + search */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col lg:flex-row gap-3">
                    <div className="inline-flex h-9 bg-slate-100 border border-slate-200 rounded-md p-0.5 self-start lg:self-auto">
                        {URGENCY_TABS.map((t) => {
                            const count = counts[t.value];
                            const isActive = tab === t.value;
                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setTab(t.value)}
                                    className={`px-3 text-[12px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${isActive
                                            ? 'bg-white text-slate-900 border border-slate-200'
                                            : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    {t.label}
                                    {count > 0 && (
                                        <span
                                            className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded text-[10px] font-semibold tabular-nums ${isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-600'
                                                }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative flex-1 min-w-[220px]">
                        <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                            type="text"
                            placeholder="Buscar por título, ID o remitente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 pl-9 pr-9 bg-white border border-slate-200 rounded-md text-[13px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <BsX size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Pending list */}
                {filtered.length === 0 ? (
                    <EmptyState hasSearch={search.trim() !== ''} totalPending={totalPending} onClearSearch={() => setSearch('')} />
                ) : (
                    <ul className="space-y-2.5">
                        {filtered.map((doc) => (
                            <PendingCard
                                key={doc.id}
                                doc={doc}
                                onSign={() => setSigningDoc(doc)}
                                onReject={() => setRejectingDoc(doc)}
                            />
                        ))}
                    </ul>
                )}

                {/* Recently completed */}
                {completed.length > 0 && (
                    <section className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[13px] font-semibold text-slate-700">Recién resueltos</h2>
                            <span className="text-[11px] text-slate-400 font-mono">{completed.length} item{completed.length === 1 ? '' : 's'}</span>
                        </div>
                        <ul className="space-y-2">
                            {completed.map((doc) => (
                                <CompletedRow
                                    key={doc.id}
                                    doc={doc}
                                    onPreview={() => setPreviewDoc(doc)}
                                />
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            <AnimatePresence>
                {signingDoc && (
                    <SignatureModal
                        doc={{
                            id: signingDoc.id,
                            title: signingDoc.title,
                            sender: signingDoc.sender,
                            type: signingDoc.type,
                        }}
                        signerName={myName.charAt(0).toUpperCase() + myName.slice(1)}
                        onClose={() => setSigningDoc(null)}
                        onSign={handleConfirmSign}
                    />
                )}

                {previewDoc && previewDoc.signature && (
                    <SignaturePreviewModal
                        doc={previewDoc}
                        signerName={myName.charAt(0).toUpperCase() + myName.slice(1)}
                        onClose={() => setPreviewDoc(null)}
                    />
                )}

                {rejectingDoc && (
                    <RejectModal
                        doc={rejectingDoc}
                        onClose={() => setRejectingDoc(null)}
                        onSubmit={(reason) => {
                            setConfirmReject({ doc: rejectingDoc, reason });
                        }}
                    />
                )}

                {confirmReject && (
                    <ConfirmModal
                        title="Rechazar documento"
                        description={`Confirmas que rechazas "${confirmReject.doc.id}". El remitente será notificado del rechazo y del motivo indicado.`}
                        confirmLabel="Rechazar"
                        variant="danger"
                        onCancel={() => setConfirmReject(null)}
                        onConfirm={handleConfirmReject}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Pending card ---------- */

function PendingCard({
    doc,
    onSign,
    onReject,
}: {
    doc: PendingDoc;
    onSign: () => void;
    onReject: () => void;
}) {
    const expiry = formatExpiry(doc.expiresAt);

    const accentBorder =
        expiry.tone === 'critical' ? 'border-l-rose-500'
            : expiry.tone === 'warning' ? 'border-l-amber-500'
                : 'border-l-slate-300';

    const expiryColor =
        expiry.tone === 'critical' ? 'text-rose-700'
            : expiry.tone === 'warning' ? 'text-amber-700'
                : 'text-slate-500';

    return (
        <li>
            <article className={`bg-white border border-slate-200 border-l-4 ${accentBorder} rounded-lg overflow-hidden hover:border-slate-300 transition-colors`}>
                <div className="px-5 py-4 flex flex-col sm:flex-row gap-4">
                    {/* Left — content */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <BsFileEarmarkPdf size={28} className="text-slate-400 shrink-0 mt-0.5" />

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
                                    {doc.title}
                                </h3>
                                <span className="text-[11px] text-slate-400 font-mono">{doc.id}</span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap mt-2 text-[12px] text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <BsPersonBadge size={11} className="text-slate-400" />
                                    de <span className="text-slate-700 font-medium">{doc.sender}</span>
                                </span>
                                <span className="text-slate-300">·</span>
                                <span>{doc.type}</span>
                                <span className="text-slate-300">·</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <BsCalendar3 size={10} className="text-slate-400" />
                                    Recibido {formatDate(doc.sentAt)}
                                </span>
                            </div>

                            <div className={`flex items-center gap-1.5 mt-2 text-[12px] font-medium ${expiryColor}`}>
                                <BsClock size={11} />
                                {expiry.text}
                            </div>
                        </div>
                    </div>

                    {/* Right — actions */}
                    <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-stretch sm:min-w-[160px]">
                        <button
                            type="button"
                            onClick={onSign}
                            className="h-9 px-4 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <BsPenFill size={12} />
                            Firmar
                        </button>
                        <button
                            type="button"
                            onClick={onReject}
                            className="h-9 px-4 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <BsXCircle size={12} />
                            Rechazar
                        </button>
                    </div>
                </div>
            </article>
        </li>
    );
}

/* ---------- Completed row ---------- */

function CompletedRow({ doc, onPreview }: { doc: PendingDoc; onPreview: () => void }) {
    const isSigned = !!doc.signature;
    const Icon = isSigned ? BsCheckCircle : BsXCircle;
    const iconColor = isSigned ? 'text-emerald-600' : 'text-rose-600';
    const labelText = isSigned ? `Firmado · ${doc.signedAt}` : 'Rechazado';

    return (
        <li>
            <div className="bg-white border border-slate-200 rounded-md px-4 py-2.5 flex items-center gap-3 hover:border-slate-300 transition-colors">
                <Icon size={16} className={`${iconColor} shrink-0`} />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{doc.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">{doc.id}</span> · {labelText}
                    </p>
                </div>
                {isSigned && (
                    <button
                        type="button"
                        onClick={onPreview}
                        className="h-7 px-2.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer shrink-0"
                    >
                        Ver firma
                    </button>
                )}
            </div>
        </li>
    );
}

/* ---------- Empty state ---------- */

function EmptyState({
    hasSearch,
    totalPending,
    onClearSearch,
}: {
    hasSearch: boolean;
    totalPending: number;
    onClearSearch: () => void;
}) {
    if (totalPending === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg px-6 py-16 flex flex-col items-center text-center">
                <BsCheckCircle size={32} className="text-emerald-600 mb-3" />
                <p className="text-[15px] font-semibold text-slate-900">Bandeja al día</p>
                <p className="text-[13px] text-slate-500 mt-1.5 max-w-md leading-relaxed">
                    No tienes documentos esperando tu firma. Buen trabajo.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-lg px-6 py-12 flex flex-col items-center text-center">
            <BsSearch size={20} className="text-slate-400 mb-3" />
            <p className="text-[14px] font-semibold text-slate-900">Sin resultados en este filtro</p>
            <p className="text-[12px] text-slate-500 mt-1.5 max-w-md">
                No hay documentos que coincidan con tu búsqueda actual.
            </p>
            {hasSearch && (
                <button
                    type="button"
                    onClick={onClearSearch}
                    className="mt-4 h-8 px-3 bg-white border border-slate-200 text-slate-700 text-[12px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                >
                    Limpiar búsqueda
                </button>
            )}
        </div>
    );
}

/* ---------- Reject modal ---------- */

function RejectModal({
    doc,
    onClose,
    onSubmit,
}: {
    doc: PendingDoc;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}) {
    const { showToast } = useToast();
    const [reason, setReason] = useState('');

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (reason.trim().length < 5) {
            showToast('Debes indicar un motivo (mín. 5 caracteres).', 'warning');
            return;
        }
        onSubmit(reason.trim());
    };

    return (
        <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/50"
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
                aria-labelledby="reject-title"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 id="reject-title" className="text-[15px] font-semibold text-white tracking-tight">
                        Rechazar documento
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

                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-start gap-2.5">
                        <BsFileEarmarkPdf size={20} className="text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">{doc.title}</p>
                            <p className="text-[11px] text-slate-500 font-mono truncate">{doc.id}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5">
                        <label htmlFor="reason" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                            Motivo del rechazo
                        </label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            placeholder="Explica brevemente por qué rechazas este documento..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all resize-none"
                            autoFocus
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            El remitente recibirá un correo con tu motivo. Esta acción no se puede deshacer.
                        </p>
                    </div>

                    <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="h-9 px-3 bg-rose-600 text-white text-[13px] font-medium rounded-md hover:bg-rose-700 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsXCircle size={13} />
                            Rechazar documento
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

/* ---------- Signature preview modal ---------- */

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
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">Firma registrada</h3>
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
                    <BsCheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-slate-900 truncate">{doc.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.id}</p>
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
                    {doc.signedAt && (
                        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500">
                            <BsCheck2 size={11} className="text-emerald-600" />
                            Firmado el <span className="text-slate-700 font-medium">{doc.signedAt}</span>
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <BsArrowRepeat size={12} />
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
