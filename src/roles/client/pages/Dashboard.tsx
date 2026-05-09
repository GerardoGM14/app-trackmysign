import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BsPatchCheck,
    BsKanban,
    BsCalculator,
    BsArrowRight,
    BsCheckCircle,
    BsClock,
    BsTruck,
    BsHourglassSplit,
    BsXCircle,
} from 'react-icons/bs';
import { useCustomerData } from '../../../features/customer/CustomerDataContext';
import { CUSTOMER_PROFILE, getPendingProofs } from '../../../features/customer/customerData';
import { STATUS_CONFIG as ORDER_STATUS, type Order } from '../../../features/orders/types';
import { STATUS_CONFIG as QUOTE_STATUS } from '../../../features/quotes/types';
import { formatPrice } from '../../../features/quotes/pricing';

export default function CustomerDashboard() {
    const navigate = useNavigate();
    const { quotes, orders } = useCustomerData();

    const pendingProofs = useMemo(() => getPendingProofs(orders), [orders]);
    const activeOrders = useMemo(() => orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled'), [orders]);
    const pendingQuotes = useMemo(() => quotes.filter((q) => q.status === 'sent'), [quotes]);

    const totalSpent = useMemo(
        () => orders.filter((o) => o.status === 'delivered').reduce((acc, o) => acc + o.total, 0),
        [orders],
    );

    return (
        <div className="space-y-6">
            <header>
                <p className="text-[12px] font-medium text-slate-500">{getGreeting()}, {CUSTOMER_PROFILE.name.split(' ')[0]}</p>
                <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight mt-1">
                    Tu portal de cliente
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                    Aquí puedes seguir tus cotizaciones, órdenes en producción y aprobar las pruebas que te enviemos.
                </p>
            </header>

            {pendingProofs.length > 0 && (
                <div className="bg-[#1e40af] rounded-lg p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <BsPatchCheck size={22} className="text-white shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[15px] font-semibold text-white">
                                Tienes {pendingProofs.length} prueba{pendingProofs.length !== 1 ? 's' : ''} esperando tu respuesta
                            </p>
                            <p className="text-[12.5px] text-white/80 mt-0.5">
                                Revisa los diseños y apruébalos para que continuemos con la producción.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/proofs')}
                        className="h-9 px-4 bg-white text-[#1e40af] text-[13px] font-semibold rounded-md hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                        Revisar pruebas
                        <BsArrowRight size={12} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Pruebas pendientes" value={pendingProofs.length} icon={<BsHourglassSplit size={14} />} alert={pendingProofs.length > 0} onClick={() => navigate('/proofs')} />
                <KpiCard label="Órdenes activas" value={activeOrders.length} icon={<BsTruck size={14} />} onClick={() => navigate('/orders')} />
                <KpiCard label="Cotizaciones por revisar" value={pendingQuotes.length} icon={<BsCalculator size={14} />} onClick={() => navigate('/quotes')} />
                <KpiCard label="Invertido en órdenes" value={formatPrice(totalSpent)} icon={<BsCheckCircle size={14} />} mono />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <section className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <header className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-[14px] font-semibold text-slate-900">Mis órdenes en curso</h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">Avance en producción de tus pedidos.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/orders')}
                            className="text-[12px] font-medium text-[#1e40af] hover:text-[#1e3a8a] transition-colors cursor-pointer flex items-center gap-1"
                        >
                            Ver todas
                            <BsArrowRight size={11} />
                        </button>
                    </header>
                    {activeOrders.length === 0 ? (
                        <EmptyBlock icon={<BsKanban size={18} />} title="No tienes órdenes activas." subtitle="Cuando un pedido esté en producción aparecerá aquí." />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {activeOrders.slice(0, 4).map((o) => (
                                <li key={o.id}>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/orders')}
                                        className="w-full px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer flex items-center gap-4 text-left"
                                    >
                                        <OrderProgress order={o} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12.5px] font-mono font-semibold text-slate-900">{o.id}</p>
                                            <p className="text-[12.5px] text-slate-700 truncate">
                                                {o.items[0]?.description}{o.items.length > 1 ? ` + ${o.items.length - 1} más` : ''}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${ORDER_STATUS[o.status].cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${ORDER_STATUS[o.status].dot}`} />
                                                    {ORDER_STATUS[o.status].text}
                                                </span>
                                                {o.dueDate && (
                                                    <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-500 font-mono">
                                                        <BsClock size={9} />
                                                        {o.dueDate}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums shrink-0">
                                            {formatPrice(o.total)}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <header className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-[14px] font-semibold text-slate-900">Cotizaciones recientes</h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">Últimas propuestas.</p>
                        </div>
                    </header>
                    {quotes.length === 0 ? (
                        <EmptyBlock icon={<BsCalculator size={18} />} title="Sin cotizaciones." subtitle="Tu historial aparecerá aquí." />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {quotes.slice(0, 4).map((q) => {
                                const sc = QUOTE_STATUS[q.status];
                                return (
                                    <li key={q.id}>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/quotes')}
                                            className="w-full px-5 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer text-left"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[11.5px] font-mono font-semibold text-slate-900">{q.id}</p>
                                                <p className="text-[12px] font-semibold text-slate-900 tabular-nums">{formatPrice(q.total)}</p>
                                            </div>
                                            <p className="text-[12px] text-slate-600 truncate mt-0.5">
                                                {q.items.length} ítem{q.items.length !== 1 ? 's' : ''} · {q.items[0]?.description}
                                            </p>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border mt-1.5 ${sc.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                {sc.text}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

function KpiCard({
    label,
    value,
    icon,
    alert,
    mono,
    onClick,
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    alert?: boolean;
    mono?: boolean;
    onClick?: () => void;
}) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            onClick={onClick}
            className={`text-left bg-white border rounded-lg px-4 py-3 transition-colors ${onClick ? 'cursor-pointer hover:border-slate-300' : ''} ${alert ? 'border-rose-200' : 'border-slate-200'
                }`}
        >
            <div className={`flex items-center gap-1.5 ${alert ? 'text-rose-600' : 'text-slate-400'}`}>
                {icon}
                <span className="text-[11px] font-medium uppercase tracking-wider">
                    {label}
                </span>
            </div>
            <p className={`text-[22px] font-semibold tracking-[-0.02em] leading-none mt-2 ${mono ? 'font-mono tabular-nums' : 'tabular-nums'} ${alert ? 'text-rose-700' : 'text-slate-900'
                }`}>
                {value}
            </p>
        </Tag>
    );
}

function OrderProgress({ order }: { order: Order }) {
    const steps: Order['status'][] = ['pending', 'in_design', 'in_production', 'ready', 'delivered'];
    const currentIdx = steps.indexOf(order.status);
    const pct = order.status === 'cancelled' ? 0 : ((currentIdx + 1) / steps.length) * 100;

    if (order.status === 'cancelled') {
        return (
            <span className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <BsXCircle size={16} className="text-rose-600" />
            </span>
        );
    }

    return (
        <div className="relative w-10 h-10 shrink-0">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="#1e40af"
                    strokeWidth="3"
                    strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-700 tabular-nums">
                {Math.round(pct)}%
            </span>
        </div>
    );
}

function EmptyBlock({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="px-6 py-10 flex flex-col items-center text-center">
            <span className="text-slate-400 mb-2">{icon}</span>
            <p className="text-[13px] font-medium text-slate-700">{title}</p>
            <p className="text-[12px] text-slate-500 mt-1 max-w-xs">{subtitle}</p>
        </div>
    );
}
