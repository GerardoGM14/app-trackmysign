import { useEffect } from 'react';
import { motion } from 'motion/react';
import {
    BsX,
    BsPencil,
    BsArrowRepeat,
    BsCheckCircle,
    BsXCircle,
    BsArrowRightCircle,
    BsCopy,
    BsCalendar3,
    BsPersonBadge,
    BsClock,
    BsBuilding,
    BsEnvelope,
    BsTelephone,
} from 'react-icons/bs';
import {
    type Quote,
    STATUS_CONFIG,
    PRODUCT_TYPE_LABEL,
    MATERIAL_LABEL,
} from './types';
import { formatPrice } from './pricing';

interface QuoteDetailDrawerProps {
    quote: Quote;
    onClose: () => void;
    onEdit: () => void;
    onSend: () => void;
    onApprove: () => void;
    onReject: () => void;
    onConvert: () => void;
    onDuplicate: () => void;
}

export default function QuoteDetailDrawer({
    quote,
    onClose,
    onEdit,
    onSend,
    onApprove,
    onReject,
    onConvert,
    onDuplicate,
}: QuoteDetailDrawerProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const status = STATUS_CONFIG[quote.status];
    const canEdit = quote.status === 'draft' || quote.status === 'sent';
    const canSend = quote.status === 'draft';
    const canApproveReject = quote.status === 'sent';
    const canConvert = quote.status === 'approved';

    return (
        <motion.div
            className="fixed inset-0 z-[110] bg-slate-950/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <motion.aside
                onClick={(e) => e.stopPropagation()}
                className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-slate-200 flex flex-col"
                role="dialog"
                aria-modal="true"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
                <header className="px-6 py-4 bg-[#1e40af] flex items-center justify-between shrink-0">
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">Detalle de cotización</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="w-7 h-7 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <BsX size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Identity */}
                    <div className="px-6 py-5 border-b border-slate-100">
                        <p className="text-[11px] font-mono text-slate-400 mb-1">{quote.id}</p>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h4 className="text-[16px] font-semibold text-slate-900 tracking-tight">
                                    {quote.customer.name}
                                </h4>
                                {quote.customer.company && (
                                    <p className="text-[12px] text-slate-500 mt-0.5">{quote.customer.company}</p>
                                )}
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                        {status.text}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Total</p>
                                <p className="text-[24px] font-semibold text-slate-900 tracking-[-0.02em] tabular-nums">
                                    {formatPrice(quote.total)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer info */}
                    <div className="px-6 py-4 border-b border-slate-100 space-y-3">
                        <DetailRow icon={<BsEnvelope size={12} />} label="Correo" value={quote.customer.email} mono />
                        {quote.customer.phone && (
                            <DetailRow icon={<BsTelephone size={12} />} label="Teléfono" value={quote.customer.phone} />
                        )}
                        {quote.customer.company && (
                            <DetailRow icon={<BsBuilding size={12} />} label="Empresa" value={quote.customer.company} />
                        )}
                    </div>

                    {/* Items */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Items cotizados ({quote.items.length})
                        </h5>
                        <ul className="space-y-2.5">
                            {quote.items.map((item, idx) => (
                                <li key={item.id} className="border border-slate-200 rounded-md bg-slate-50/40 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12px] font-semibold text-slate-900 truncate">
                                                #{idx + 1} · {item.description || PRODUCT_TYPE_LABEL[item.productType]}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {PRODUCT_TYPE_LABEL[item.productType]} · {MATERIAL_LABEL[item.material]}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                                {item.width}×{item.height} {item.unit} · {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10.5px] text-slate-400">P. unit.</p>
                                            <p className="text-[12px] font-mono text-slate-700 tabular-nums">{formatPrice(item.unitPrice)}</p>
                                            <p className="text-[10.5px] text-slate-400 mt-1">Total</p>
                                            <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{formatPrice(item.lineTotal)}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Totals */}
                        <div className="mt-4 pt-3 border-t border-slate-200 space-y-1 text-[12.5px]">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span className="tabular-nums">{formatPrice(quote.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>IGV ({Math.round(quote.taxRate * 100)}%)</span>
                                <span className="tabular-nums">{formatPrice(quote.tax)}</span>
                            </div>
                            <div className="flex justify-between pt-1.5 mt-1.5 border-t border-slate-100 text-slate-900 font-semibold">
                                <span>Total</span>
                                <span className="text-[15px] text-[#1e40af] tabular-nums">{formatPrice(quote.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {quote.notes && (
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Notas
                            </h5>
                            <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                                {quote.notes}
                            </p>
                        </div>
                    )}

                    {/* Rejection reason */}
                    {quote.rejectionReason && (
                        <div className="px-6 py-4 border-b border-slate-100 bg-rose-50/40">
                            <h5 className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider mb-2">
                                Motivo del rechazo
                            </h5>
                            <p className="text-[12.5px] text-rose-900 leading-relaxed">{quote.rejectionReason}</p>
                        </div>
                    )}

                    {/* Conversion link */}
                    {quote.convertedToOrderId && (
                        <div className="px-6 py-4 border-b border-slate-100 bg-[#1e40af]/[0.04]">
                            <h5 className="text-[11px] font-semibold text-[#1e40af] uppercase tracking-wider mb-1">
                                Convertida en orden
                            </h5>
                            <p className="text-[13px] font-mono font-semibold text-slate-900">
                                {quote.convertedToOrderId}
                            </p>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="px-6 py-4 border-b border-slate-100 space-y-3">
                        <DetailRow icon={<BsPersonBadge size={12} />} label="Creado por" value={quote.createdBy} />
                        <DetailRow icon={<BsCalendar3 size={12} />} label="Creado" value={quote.createdAt} mono />
                        {quote.sentAt && <DetailRow icon={<BsArrowRepeat size={12} />} label="Enviado" value={quote.sentAt} mono />}
                        {quote.respondedAt && (
                            <DetailRow icon={<BsCheckCircle size={12} />} label="Respondido" value={quote.respondedAt} mono />
                        )}
                        {quote.validUntil && (
                            <DetailRow icon={<BsClock size={12} />} label="Vence" value={quote.validUntil} mono />
                        )}
                        {quote.convertedAt && (
                            <DetailRow icon={<BsArrowRightCircle size={12} />} label="Convertida" value={quote.convertedAt} mono />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones</h5>
                        <div className="space-y-1.5">
                            {canEdit && (
                                <DrawerActionButton icon={<BsPencil size={13} />} label="Editar cotización" onClick={onEdit} />
                            )}
                            {canSend && (
                                <DrawerActionButton icon={<BsArrowRepeat size={13} />} label="Enviar al cliente" onClick={onSend} />
                            )}
                            {canApproveReject && (
                                <>
                                    <DrawerActionButton icon={<BsCheckCircle size={13} />} label="Marcar aprobada" onClick={onApprove} />
                                    <DrawerActionButton icon={<BsXCircle size={13} />} label="Marcar rechazada" onClick={onReject} />
                                </>
                            )}
                            {canConvert && (
                                <DrawerActionButton icon={<BsArrowRightCircle size={13} />} label="Convertir a orden" onClick={onConvert} />
                            )}
                            <DrawerActionButton icon={<BsCopy size={13} />} label="Duplicar como borrador" onClick={onDuplicate} />
                        </div>
                    </div>
                </div>
            </motion.aside>
        </motion.div>
    );
}

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-slate-400 shrink-0">{icon}</span>
            <div className="min-w-0 flex-1 flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider shrink-0">{label}</p>
                <p className={`text-[12.5px] text-slate-900 truncate ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
            </div>
        </div>
    );
}

function DrawerActionButton({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-2"
        >
            <span className="text-slate-400">{icon}</span>
            {label}
        </button>
    );
}
