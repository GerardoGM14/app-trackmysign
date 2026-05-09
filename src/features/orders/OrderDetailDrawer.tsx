import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
    BsX,
    BsClock,
    BsPersonCheck,
    BsXCircle,
    BsDownload,
    BsExclamationTriangle,
    BsBuilding,
    BsEnvelope,
    BsTelephone,
    BsBoxArrowUpRight,
    BsSend,
    BsImage,
    BsCheckCircle,
    BsHourglassSplit,
} from 'react-icons/bs';
import {
    type Order,
    type OrderStatus,
    type Priority,
    STATUS_CONFIG,
    PRIORITY_CONFIG,
    KANBAN_STATUSES,
} from './types';
import { PRODUCT_TYPE_LABEL, MATERIAL_LABEL } from '../quotes/types';
import { formatPrice } from '../quotes/pricing';

interface OrderDetailDrawerProps {
    order: Order;
    employees: string[];
    onClose: () => void;
    onChangeStatus: (status: OrderStatus, note?: string) => void;
    onChangePriority: (priority: Priority) => void;
    onAssign: (employee: string | undefined) => void;
    onSaveNotes: (notes: string) => void;
    onCancel: (reason: string) => void;
    onDownload: () => void;
    onSendProof: () => void;
}

export default function OrderDetailDrawer({
    order,
    employees,
    onClose,
    onChangeStatus,
    onChangePriority,
    onAssign,
    onSaveNotes,
    onCancel,
    onDownload,
    onSendProof,
}: OrderDetailDrawerProps) {
    const [notes, setNotes] = useState(order.productionNotes ?? '');
    const [cancelMode, setCancelMode] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const status = STATUS_CONFIG[order.status];
    const priority = PRIORITY_CONFIG[order.priority];
    const isCancelled = order.status === 'cancelled';
    const isDelivered = order.status === 'delivered';
    const canEdit = !isCancelled && !isDelivered;

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
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">
                        Detalle de orden
                    </h3>
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
                        <p className="text-[11px] font-mono text-slate-400 mb-1">{order.id}</p>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h4 className="text-[16px] font-semibold text-slate-900 tracking-tight">
                                    {order.customer.name}
                                </h4>
                                {order.customer.company && (
                                    <p className="text-[12px] text-slate-500 mt-0.5">{order.customer.company}</p>
                                )}
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                        {status.text}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${priority.cls} bg-slate-50 border border-slate-200`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                                        {priority.text}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Total</p>
                                <p className="text-[22px] font-semibold text-slate-900 tracking-[-0.02em] tabular-nums">
                                    {formatPrice(order.total)}
                                </p>
                            </div>
                        </div>

                        {order.fromQuoteId && (
                            <p className="text-[11px] text-slate-500 mt-3 inline-flex items-center gap-1">
                                <BsBoxArrowUpRight size={9} className="text-slate-400" />
                                Convertida desde <span className="font-mono text-slate-700 ml-1">{order.fromQuoteId}</span>
                            </p>
                        )}
                    </div>

                    {/* Status changer */}
                    {canEdit && (
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Cambiar estado
                            </h5>
                            <div className="grid grid-cols-5 gap-1">
                                {KANBAN_STATUSES.map((s) => {
                                    const sc = STATUS_CONFIG[s];
                                    const isCurrent = order.status === s;
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => !isCurrent && onChangeStatus(s)}
                                            disabled={isCurrent}
                                            className={`text-[10px] font-medium px-1 py-2 rounded border transition-colors cursor-pointer ${isCurrent
                                                    ? `${sc.cls} cursor-default`
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            title={sc.text}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} inline-block mr-1`} />
                                            {sc.text}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Priority + assignee */}
                    {canEdit && (
                        <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="priority" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Prioridad
                                </label>
                                <select
                                    id="priority"
                                    value={order.priority}
                                    onChange={(e) => onChangePriority(e.target.value as Priority)}
                                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-md text-[12.5px] text-slate-900 outline-none focus:border-[#1e40af] cursor-pointer"
                                >
                                    {(['low', 'normal', 'high', 'urgent'] as Priority[]).map((p) => (
                                        <option key={p} value={p}>{PRIORITY_CONFIG[p].text}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="assignee" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Asignado
                                </label>
                                <select
                                    id="assignee"
                                    value={order.assignedTo ?? ''}
                                    onChange={(e) => onAssign(e.target.value || undefined)}
                                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-md text-[12.5px] text-slate-900 outline-none focus:border-[#1e40af] cursor-pointer"
                                >
                                    <option value="">Sin asignar</option>
                                    {employees.map((emp) => (
                                        <option key={emp} value={emp}>{emp}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Customer info */}
                    <div className="px-6 py-4 border-b border-slate-100 space-y-3">
                        <DetailRow icon={<BsEnvelope size={12} />} label="Correo" value={order.customer.email} mono />
                        {order.customer.phone && (
                            <DetailRow icon={<BsTelephone size={12} />} label="Teléfono" value={order.customer.phone} />
                        )}
                        {order.customer.company && (
                            <DetailRow icon={<BsBuilding size={12} />} label="Empresa" value={order.customer.company} />
                        )}
                        {order.dueDate && (
                            <DetailRow icon={<BsClock size={12} />} label="Fecha límite" value={order.dueDate} mono />
                        )}
                        {order.assignedTo && (
                            <DetailRow icon={<BsPersonCheck size={12} />} label="Asignado" value={order.assignedTo} />
                        )}
                    </div>

                    {/* Items */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Items ({order.items.length})
                        </h5>
                        <ul className="space-y-2">
                            {order.items.map((item, idx) => (
                                <li key={item.id} className="border border-slate-200 rounded-md bg-slate-50/40 p-3">
                                    <p className="text-[12px] font-semibold text-slate-900">
                                        #{idx + 1} · {item.description || PRODUCT_TYPE_LABEL[item.productType]}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {PRODUCT_TYPE_LABEL[item.productType]} · {MATERIAL_LABEL[item.material]}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[11px] text-slate-500 font-mono">
                                            {item.width}×{item.height} {item.unit} · {item.quantity}u
                                        </p>
                                        <p className="text-[12px] font-semibold text-slate-900 tabular-nums">
                                            {formatPrice(item.lineTotal)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Proofs */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                                <BsImage size={11} />
                                Pruebas enviadas ({order.proofs.length})
                            </h5>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={onSendProof}
                                    className="h-7 px-2.5 bg-[#1e40af] text-white text-[11.5px] font-medium rounded hover:bg-[#1e3a8a] transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <BsSend size={10} />
                                    Enviar prueba
                                </button>
                            )}
                        </div>
                        {order.proofs.length === 0 ? (
                            <p className="text-[12px] text-slate-400 italic">
                                Aún no se han enviado pruebas al cliente.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {[...order.proofs].reverse().map((proof) => (
                                    <li key={proof.id} className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/40">
                                        <div className="flex gap-3 p-2.5">
                                            <img
                                                src={proof.imageUrl}
                                                alt="Prueba"
                                                className="w-16 h-16 object-cover rounded border border-slate-200 shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <ProofStatusPill status={proof.status} />
                                                    <span className="text-[10.5px] font-mono text-slate-400">{proof.sentAt}</span>
                                                </div>
                                                {proof.notes && (
                                                    <p className="text-[11.5px] text-slate-600 mt-1.5 leading-snug line-clamp-2">
                                                        "{proof.notes}"
                                                    </p>
                                                )}
                                                {proof.status === 'rejected' && proof.rejectionReason && (
                                                    <p className="text-[11.5px] text-rose-700 mt-1.5 leading-snug">
                                                        Motivo: {proof.rejectionReason}
                                                    </p>
                                                )}
                                                {proof.status === 'approved' && proof.respondedAt && (
                                                    <p className="text-[10.5px] text-emerald-700 mt-1 font-mono">
                                                        Aprobada el {proof.respondedAt}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Production notes */}
                    {canEdit && (
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Notas de producción
                            </h5>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Indicaciones para el equipo de producción..."
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-[12.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all resize-none"
                            />
                            {notes !== (order.productionNotes ?? '') && (
                                <button
                                    type="button"
                                    onClick={() => onSaveNotes(notes)}
                                    className="mt-2 h-8 px-3 bg-slate-950 text-white text-[12px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Guardar notas
                                </button>
                            )}
                        </div>
                    )}

                    {/* Cancellation reason */}
                    {isCancelled && order.cancelReason && (
                        <div className="px-6 py-4 border-b border-slate-100 bg-rose-50/40">
                            <h5 className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider mb-1 inline-flex items-center gap-1">
                                <BsXCircle size={11} />
                                Cancelada
                            </h5>
                            <p className="text-[12.5px] text-rose-900 leading-relaxed mt-1">{order.cancelReason}</p>
                            {order.cancelledAt && (
                                <p className="text-[11px] text-rose-700 mt-1 font-mono">El {order.cancelledAt}</p>
                            )}
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Historial
                        </h5>
                        <ul className="relative">
                            {[...order.history].reverse().map((change, i, arr) => {
                                const sc = STATUS_CONFIG[change.to];
                                return (
                                    <li key={i} className="flex gap-3 pb-3">
                                        <div className="flex flex-col items-center shrink-0">
                                            <span className={`w-2 h-2 rounded-full ${sc.dot} mt-1`} />
                                            {i !== arr.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" />}
                                        </div>
                                        <div className="min-w-0 flex-1 -mt-0.5">
                                            <p className="text-[12.5px] font-medium text-slate-900">
                                                {sc.text}
                                                <span className="text-slate-500 font-normal ml-1">por {change.by}</span>
                                            </p>
                                            <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">{change.at}</p>
                                            {change.note && (
                                                <p className="text-[11.5px] text-slate-600 mt-1 italic leading-snug">"{change.note}"</p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Acciones
                        </h5>
                        <div className="space-y-1.5">
                            <DrawerActionButton icon={<BsDownload size={13} />} label="Descargar PDF" onClick={onDownload} />
                            {canEdit && !cancelMode && (
                                <DrawerActionButton
                                    icon={<BsXCircle size={13} />}
                                    label="Cancelar orden"
                                    onClick={() => setCancelMode(true)}
                                    danger
                                />
                            )}
                        </div>

                        {cancelMode && (
                            <div className="mt-3 p-3 border border-rose-200 rounded-md bg-rose-50/40">
                                <div className="flex items-center gap-2 mb-2 text-rose-700">
                                    <BsExclamationTriangle size={12} />
                                    <span className="text-[12px] font-semibold">Confirmar cancelación</span>
                                </div>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    rows={2}
                                    placeholder="Motivo de la cancelación..."
                                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-md text-[12.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 transition-all resize-none"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCancelMode(false);
                                            setCancelReason('');
                                        }}
                                        className="h-8 px-3 bg-white border border-slate-200 text-slate-700 text-[12px] font-medium rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (cancelReason.trim().length < 5) return;
                                            onCancel(cancelReason.trim());
                                        }}
                                        disabled={cancelReason.trim().length < 5}
                                        className="h-8 px-3 bg-rose-600 text-white text-[12px] font-medium rounded-md hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancelar orden
                                    </button>
                                </div>
                            </div>
                        )}
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

function ProofStatusPill({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
    const cfg = {
        pending: { text: 'Esperando respuesta', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <BsHourglassSplit size={9} /> },
        approved: { text: 'Aprobada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <BsCheckCircle size={9} /> },
        rejected: { text: 'Rechazada', cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: <BsXCircle size={9} /> },
    }[status];
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${cfg.cls}`}>
            {cfg.icon}
            {cfg.text}
        </span>
    );
}

function DrawerActionButton({
    icon,
    label,
    onClick,
    danger,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full h-9 px-3 border rounded-md text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${danger
                    ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
        >
            <span className={danger ? '' : 'text-slate-400'}>{icon}</span>
            {label}
        </button>
    );
}

