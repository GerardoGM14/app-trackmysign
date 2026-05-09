import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    BsCalculator,
    BsCheckCircleFill,
    BsXCircleFill,
    BsFileEarmarkPdf,
    BsChevronDown,
    BsChevronUp,
    BsInfoCircle,
} from 'react-icons/bs';
import { useCustomerData } from '../../../features/customer/CustomerDataContext';
import { useToast } from '../../../context/ToastContext';
import ConfirmModal from '../../../components/ConfirmModal';
import {
    type Quote,
    STATUS_CONFIG,
    PRODUCT_TYPE_LABEL,
    MATERIAL_LABEL,
} from '../../../features/quotes/types';
import { formatPrice } from '../../../features/quotes/pricing';

export default function CustomerQuotes() {
    const { quotes, approveQuote, rejectQuote } = useCustomerData();
    const { showToast } = useToast();

    const [expanded, setExpanded] = useState<string | null>(quotes.find((q) => q.status === 'sent')?.id ?? null);
    const [approveTarget, setApproveTarget] = useState<Quote | null>(null);
    const [rejectTarget, setRejectTarget] = useState<Quote | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = () => {
        if (!approveTarget) return;
        approveQuote(approveTarget.id);
        showToast(`Cotización ${approveTarget.id} aprobada. Pronto te contactaremos.`, 'success');
        setApproveTarget(null);
    };

    const handleReject = () => {
        if (!rejectTarget || rejectReason.trim().length < 5) return;
        rejectQuote(rejectTarget.id, rejectReason.trim());
        showToast(`Cotización ${rejectTarget.id} rechazada.`, 'info');
        setRejectTarget(null);
        setRejectReason('');
    };

    return (
        <>
            <div className="space-y-5">
                <header>
                    <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                        Mis cotizaciones
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Revisa las propuestas que el taller te ha enviado y apruébalas para iniciar la producción.
                    </p>
                </header>

                {quotes.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-lg px-6 py-16 flex flex-col items-center text-center">
                        <BsCalculator size={20} className="text-slate-400 mb-3" />
                        <p className="text-[13px] font-medium text-slate-700">Aún no tienes cotizaciones.</p>
                        <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
                            Cuando solicites una nueva propuesta aparecerá aquí.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {quotes.map((q) => (
                            <QuoteCard
                                key={q.id}
                                quote={q}
                                expanded={expanded === q.id}
                                onToggle={() => setExpanded((prev) => (prev === q.id ? null : q.id))}
                                onApprove={() => setApproveTarget(q)}
                                onReject={() => setRejectTarget(q)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {approveTarget && (
                    <ConfirmModal
                        title="Aprobar cotización"
                        description={`Vas a aprobar ${approveTarget.id} por ${formatPrice(approveTarget.total)}. Iniciaremos el proceso de producción inmediatamente.`}
                        confirmLabel="Aprobar"
                        variant="primary"
                        onCancel={() => setApproveTarget(null)}
                        onConfirm={handleApprove}
                    />
                )}
                {rejectTarget && (
                    <RejectModal
                        quote={rejectTarget}
                        reason={rejectReason}
                        setReason={setRejectReason}
                        onCancel={() => {
                            setRejectTarget(null);
                            setRejectReason('');
                        }}
                        onConfirm={handleReject}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

function QuoteCard({
    quote,
    expanded,
    onToggle,
    onApprove,
    onReject,
}: {
    quote: Quote;
    expanded: boolean;
    onToggle: () => void;
    onApprove: () => void;
    onReject: () => void;
}) {
    const sc = STATUS_CONFIG[quote.status];
    const canRespond = quote.status === 'sent';

    return (
        <article className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full px-5 py-4 hover:bg-slate-50/40 transition-colors cursor-pointer text-left flex items-center gap-4"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] font-mono font-semibold text-slate-900">{quote.id}</p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${sc.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.text}
                        </span>
                    </div>
                    <p className="text-[13.5px] font-semibold text-slate-900 mt-1.5 truncate">
                        {quote.items[0]?.description}{quote.items.length > 1 ? ` · +${quote.items.length - 1}` : ''}
                    </p>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                        Enviada por {quote.createdBy} · {quote.sentAt ?? quote.createdAt}
                        {quote.validUntil && quote.status === 'sent' && (
                            <> · Válida hasta <span className="font-mono">{quote.validUntil}</span></>
                        )}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Total</p>
                    <p className="text-[20px] font-semibold text-slate-900 tracking-[-0.02em] tabular-nums">
                        {formatPrice(quote.total)}
                    </p>
                </div>
                <span className="text-slate-400 shrink-0">
                    {expanded ? <BsChevronUp size={14} /> : <BsChevronDown size={14} />}
                </span>
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden border-t border-slate-100"
                    >
                        <div className="px-5 py-4 bg-slate-50/40">
                            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                                Detalle
                            </h4>
                            <ul className="space-y-2 mb-4">
                                {quote.items.map((it, i) => (
                                    <li key={it.id} className="bg-white border border-slate-200 rounded-md p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12.5px] font-semibold text-slate-900">
                                                    #{i + 1} · {it.description}
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    {PRODUCT_TYPE_LABEL[it.productType]} · {MATERIAL_LABEL[it.material]}
                                                </p>
                                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                    {it.width}×{it.height} {it.unit} · {it.quantity}u
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Línea</p>
                                                <p className="text-[13px] font-semibold text-slate-900 tabular-nums">
                                                    {formatPrice(it.lineTotal)}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="bg-white border border-slate-200 rounded-md p-3 space-y-1">
                                <Row label="Subtotal" value={formatPrice(quote.subtotal)} />
                                <Row label={`IGV (${(quote.taxRate * 100).toFixed(0)}%)`} value={formatPrice(quote.tax)} />
                                <div className="border-t border-slate-200 pt-1 mt-1">
                                    <Row label="Total" value={formatPrice(quote.total)} bold />
                                </div>
                            </div>

                            {quote.notes && (
                                <div className="mt-3 p-3 bg-[#1e40af]/5 border border-[#1e40af]/15 rounded-md flex gap-2">
                                    <BsInfoCircle size={12} className="text-[#1e40af] shrink-0 mt-0.5" />
                                    <p className="text-[11.5px] text-slate-700 leading-relaxed">{quote.notes}</p>
                                </div>
                            )}

                            {quote.status === 'rejected' && quote.rejectionReason && (
                                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-md">
                                    <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider mb-1">Tu motivo</p>
                                    <p className="text-[12px] text-rose-900 leading-relaxed">{quote.rejectionReason}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => { /* mock */ }}
                                    className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[12.5px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <BsFileEarmarkPdf size={12} />
                                    Descargar PDF
                                </button>
                                {canRespond && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={onReject}
                                            className="h-9 px-3 bg-white border border-rose-200 text-rose-600 text-[12.5px] font-medium rounded-md hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <BsXCircleFill size={12} />
                                            Rechazar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onApprove}
                                            className="h-9 px-3 bg-[#1e40af] text-white text-[12.5px] font-medium rounded-md hover:bg-[#1e3a8a] transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <BsCheckCircleFill size={12} />
                                            Aprobar cotización
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between text-[12.5px]">
            <span className={bold ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span>
            <span className={`tabular-nums font-mono ${bold ? 'text-[15px] font-semibold text-slate-900' : 'text-slate-700'}`}>{value}</span>
        </div>
    );
}

function RejectModal({
    quote,
    reason,
    setReason,
    onCancel,
    onConfirm,
}: {
    quote: Quote;
    reason: string;
    setReason: (s: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/50"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white border border-slate-200 rounded-lg overflow-hidden"
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-semibold text-slate-900">Rechazar {quote.id}</h3>
                    <p className="text-[12px] text-slate-500 mt-1">
                        Cuéntanos brevemente el motivo. Esto nos ayuda a ajustar futuras propuestas.
                    </p>
                </div>
                <div className="px-6 py-4">
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="Ej. el presupuesto se sale del rango previsto este mes..."
                        autoFocus
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all resize-none"
                        maxLength={300}
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">{reason.length} / 300 · mínimo 5 caracteres</p>
                </div>
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={reason.trim().length < 5}
                        className="h-9 px-3 bg-rose-600 text-white text-[13px] font-medium rounded-md hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <BsXCircleFill size={12} />
                        Rechazar cotización
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
