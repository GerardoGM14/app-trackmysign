import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    BsKanban,
    BsClock,
    BsCheckCircleFill,
    BsXCircle,
    BsChevronDown,
    BsChevronUp,
    BsFileEarmarkPdf,
    BsImage,
    BsArrowRight,
    BsHourglassSplit,
} from 'react-icons/bs';
import { useCustomerData } from '../../../features/customer/CustomerDataContext';
import {
    type Order,
    type OrderStatus,
    STATUS_CONFIG,
} from '../../../features/orders/types';
import { PRODUCT_TYPE_LABEL, MATERIAL_LABEL } from '../../../features/quotes/types';
import { formatPrice } from '../../../features/quotes/pricing';

const TRACKING_STEPS: { status: OrderStatus; text: string; description: string }[] = [
    { status: 'pending', text: 'Recibida', description: 'Hemos recibido tu pedido y entrará en cola.' },
    { status: 'in_design', text: 'En diseño', description: 'Nuestro equipo está preparando los archivos de arte.' },
    { status: 'in_production', text: 'En producción', description: 'Estamos imprimiendo y montando tu pedido.' },
    { status: 'ready', text: 'Lista', description: 'Tu pedido está listo para entrega o retiro.' },
    { status: 'delivered', text: 'Entregada', description: 'Hemos completado la entrega.' },
];

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'En curso' },
    { value: 'delivered', label: 'Entregadas' },
    { value: 'cancelled', label: 'Canceladas' },
];

export default function CustomerOrders() {
    const navigate = useNavigate();
    const { orders } = useCustomerData();

    const [tab, setTab] = useState<FilterTab>('active');
    const [expanded, setExpanded] = useState<string | null>(null);

    const filtered = useMemo(() => {
        if (tab === 'all') return orders;
        if (tab === 'delivered') return orders.filter((o) => o.status === 'delivered');
        if (tab === 'cancelled') return orders.filter((o) => o.status === 'cancelled');
        return orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
    }, [orders, tab]);

    return (
        <div className="space-y-5">
            <header>
                <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                    Mis órdenes
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                    Sigue el estado de tus pedidos en producción.
                </p>
            </header>

            <div className="inline-flex h-9 bg-slate-100 border border-slate-200 rounded-md p-0.5 self-start">
                {FILTER_TABS.map((t) => (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => setTab(t.value)}
                        className={`px-3 text-[12px] font-medium rounded transition-colors cursor-pointer ${tab === t.value
                                ? 'bg-white text-slate-900 border border-slate-200'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg px-6 py-16 flex flex-col items-center text-center">
                    <BsKanban size={20} className="text-slate-400 mb-3" />
                    <p className="text-[13px] font-medium text-slate-700">No hay órdenes en esta vista.</p>
                    <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
                        Cambia de pestaña para ver órdenes en otros estados.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((o) => (
                        <OrderCard
                            key={o.id}
                            order={o}
                            expanded={expanded === o.id}
                            onToggle={() => setExpanded((prev) => (prev === o.id ? null : o.id))}
                            onGoToProofs={() => navigate('/proofs')}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function OrderCard({
    order,
    expanded,
    onToggle,
    onGoToProofs,
}: {
    order: Order;
    expanded: boolean;
    onToggle: () => void;
    onGoToProofs: () => void;
}) {
    const sc = STATUS_CONFIG[order.status];
    const pendingProofs = order.proofs.filter((p) => p.status === 'pending');

    return (
        <article className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full px-5 py-4 hover:bg-slate-50/40 transition-colors cursor-pointer text-left flex items-center gap-4"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] font-mono font-semibold text-slate-900">{order.id}</p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${sc.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.text}
                        </span>
                        {pendingProofs.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border bg-amber-50 text-amber-700 border-amber-200">
                                <BsHourglassSplit size={9} />
                                {pendingProofs.length} prueba{pendingProofs.length !== 1 ? 's' : ''} por revisar
                            </span>
                        )}
                    </div>
                    <p className="text-[13.5px] font-semibold text-slate-900 mt-1.5 truncate">
                        {order.items[0]?.description}{order.items.length > 1 ? ` · +${order.items.length - 1}` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11.5px] text-slate-500 flex-wrap">
                        <span>Asignado a {order.assignedTo ?? '—'}</span>
                        {order.dueDate && (
                            <span className="inline-flex items-center gap-1 font-mono">
                                <BsClock size={9} />
                                Entrega {order.dueDate}
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Total</p>
                    <p className="text-[20px] font-semibold text-slate-900 tracking-[-0.02em] tabular-nums">
                        {formatPrice(order.total)}
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
                        <div className="px-5 py-4 bg-slate-50/40 space-y-5">
                            <Tracking order={order} />

                            <div>
                                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                                    Productos
                                </h4>
                                <ul className="space-y-2">
                                    {order.items.map((it, i) => (
                                        <li key={it.id} className="bg-white border border-slate-200 rounded-md p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[12.5px] font-semibold text-slate-900">
                                                        #{i + 1} · {it.description}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        {PRODUCT_TYPE_LABEL[it.productType]} · {MATERIAL_LABEL[it.material]} · {it.width}×{it.height} {it.unit} · {it.quantity}u
                                                    </p>
                                                </div>
                                                <p className="text-[13px] font-semibold text-slate-900 tabular-nums shrink-0">
                                                    {formatPrice(it.lineTotal)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {order.proofs.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                                            <BsImage size={11} />
                                            Pruebas ({order.proofs.length})
                                        </h4>
                                        {pendingProofs.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={onGoToProofs}
                                                className="text-[11.5px] font-medium text-[#1e40af] hover:text-[#1e3a8a] cursor-pointer flex items-center gap-1"
                                            >
                                                Revisar pendientes
                                                <BsArrowRight size={10} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {order.proofs.map((p) => (
                                            <div key={p.id} className="bg-white border border-slate-200 rounded-md overflow-hidden">
                                                <img src={p.imageUrl} alt="Prueba" className="w-full aspect-video object-cover" />
                                                <div className="px-2 py-1.5 flex items-center justify-between">
                                                    <ProofPill status={p.status} />
                                                    <span className="text-[10px] font-mono text-slate-400">{p.sentAt}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[12.5px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <BsFileEarmarkPdf size={12} />
                                Descargar resumen PDF
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
}

function Tracking({ order }: { order: Order }) {
    const isCancelled = order.status === 'cancelled';
    const currentIdx = isCancelled ? -1 : TRACKING_STEPS.findIndex((s) => s.status === order.status);

    if (isCancelled) {
        return (
            <div className="bg-rose-50/60 border border-rose-200 rounded-md p-4 flex items-start gap-3">
                <BsXCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-rose-900">Esta orden fue cancelada</p>
                    {order.cancelReason && (
                        <p className="text-[12px] text-rose-700 mt-0.5">{order.cancelReason}</p>
                    )}
                    {order.cancelledAt && (
                        <p className="text-[10.5px] text-rose-600 mt-1 font-mono">El {order.cancelledAt}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Seguimiento
            </h4>
            <ol className="relative">
                {TRACKING_STEPS.map((step, i) => {
                    const done = i <= currentIdx;
                    const current = i === currentIdx;
                    const historyEntry = order.history.find((h) => h.to === step.status);
                    return (
                        <li key={step.status} className="flex gap-3 pb-4 last:pb-0">
                            <div className="flex flex-col items-center shrink-0">
                                <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${done
                                            ? current
                                                ? 'bg-[#1e40af] text-white ring-4 ring-[#1e40af]/15'
                                                : 'bg-[#1e40af] text-white'
                                            : 'bg-white border border-slate-300 text-slate-400'
                                        }`}
                                >
                                    {done && !current ? <BsCheckCircleFill size={10} /> : i + 1}
                                </span>
                                {i !== TRACKING_STEPS.length - 1 && (
                                    <span className={`w-px flex-1 mt-1 ${i < currentIdx ? 'bg-[#1e40af]' : 'bg-slate-200'}`} />
                                )}
                            </div>
                            <div className="min-w-0 flex-1 -mt-0.5 pb-2">
                                <p className={`text-[13px] font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {step.text}
                                </p>
                                <p className={`text-[11.5px] mt-0.5 leading-snug ${done ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {step.description}
                                </p>
                                {historyEntry && (
                                    <p className="text-[10.5px] text-slate-400 mt-1 font-mono">
                                        {historyEntry.at.split('T')[0]} · por {historyEntry.by}
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function ProofPill({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
    const cfg = {
        pending: { text: 'Por revisar', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
        approved: { text: 'Aprobada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        rejected: { text: 'Rechazada', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    }[status];
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.cls}`}>
            {cfg.text}
        </span>
    );
}
