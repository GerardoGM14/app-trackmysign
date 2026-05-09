import { useEffect, useMemo, useRef, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { AnimatePresence } from 'motion/react';
import {
    BsSearch,
    BsX,
    BsCheck2,
    BsChevronDown,
    BsKanban,
    BsListUl,
    BsDownload,
    BsThreeDots,
    BsPersonCheck,
    BsClock,
    BsExclamationTriangle,
} from 'react-icons/bs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import ExportOverlay from '../../components/ExportOverlay';
import { useToast } from '../../context/ToastContext';

import {
    type Order,
    type OrderStatus,
    type Priority,
    STATUS_CONFIG,
    PRIORITY_CONFIG,
    KANBAN_STATUSES,
} from './types';
import { INITIAL_ORDERS, getDueUrgency } from './mockData';
import { formatPrice } from '../quotes/pricing';
import KanbanCard from './KanbanCard';
import KanbanColumn from './KanbanColumn';
import OrderDetailDrawer from './OrderDetailDrawer';
import ProofUploader from './ProofUploader';

interface OrdersPageProps {
    /** Si se setea, filtra por esta persona (para vista del Employee) */
    currentEmployee?: string;
    /** Lista completa de empleados disponibles para asignar */
    employees?: string[];
}

type ViewMode = 'kanban' | 'list';

const PRIORITY_OPTIONS = [
    { value: 'ALL', label: 'Cualquier prioridad', dot: '' },
    { value: 'urgent', label: 'Urgente', dot: 'bg-rose-500' },
    { value: 'high', label: 'Alta', dot: 'bg-amber-500' },
    { value: 'normal', label: 'Normal', dot: 'bg-slate-400' },
    { value: 'low', label: 'Baja', dot: 'bg-slate-300' },
] as const;

const DEFAULT_EMPLOYEES = ['Hans Weber', 'Anna Schmidt', 'Diego Ramos', 'Lucía Vargas'];

export default function OrdersPage({ currentEmployee, employees = DEFAULT_EMPLOYEES }: OrdersPageProps) {
    const { showToast } = useToast();

    const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
    const [view, setView] = useState<ViewMode>('kanban');
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [assigneeFilter, setAssigneeFilter] = useState<string>(currentEmployee ?? 'ALL');
    /** Para Employee: muestra solo sus órdenes por defecto, con switch para ver todas */
    const [scopeMine, setScopeMine] = useState<boolean>(!!currentEmployee);

    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [draggingOrder, setDraggingOrder] = useState<Order | null>(null);
    const [exporting, setExporting] = useState(false);
    const [proofingOrder, setProofingOrder] = useState<Order | null>(null);

    const [priorityOpen, setPriorityOpen] = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);

    const priorityRef = useRef<HTMLDivElement>(null);
    const assigneeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setPriorityOpen(false);
            if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) setAssigneeOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    /* ---------- Filtering ---------- */

    const filteredOrders = useMemo(() => {
        const q = search.toLowerCase().trim();
        return orders.filter((o) => {
            // Scope (employee): filter by assigned to them
            if (scopeMine && currentEmployee && o.assignedTo !== currentEmployee) return false;
            if (assigneeFilter !== 'ALL' && o.assignedTo !== assigneeFilter) return false;
            if (priorityFilter !== 'ALL' && o.priority !== priorityFilter) return false;

            if (q) {
                const matches =
                    o.id.toLowerCase().includes(q) ||
                    o.customer.name.toLowerCase().includes(q) ||
                    o.customer.email.toLowerCase().includes(q) ||
                    (o.customer.company?.toLowerCase().includes(q) ?? false) ||
                    o.items.some((it) => it.description.toLowerCase().includes(q));
                if (!matches) return false;
            }
            return true;
        });
    }, [orders, search, priorityFilter, assigneeFilter, scopeMine, currentEmployee]);

    /* ---------- Stats ---------- */

    const stats = useMemo(() => {
        const all = filteredOrders.filter((o) => o.status !== 'cancelled');
        const overdue = all.filter((o) => {
            const u = getDueUrgency(o.dueDate);
            return u.tone === 'overdue';
        }).length;
        return {
            total: all.length,
            inProduction: all.filter((o) => o.status === 'in_production').length,
            ready: all.filter((o) => o.status === 'ready').length,
            overdue,
        };
    }, [filteredOrders]);

    /* ---------- Kanban grouping ---------- */

    const ordersByStatus = useMemo(() => {
        const groups: Record<OrderStatus, Order[]> = {
            pending: [],
            in_design: [],
            in_production: [],
            ready: [],
            delivered: [],
            cancelled: [],
        };
        filteredOrders.forEach((o) => {
            groups[o.status].push(o);
        });
        // Within each column, sort by priority desc then due date asc
        const priorityRank: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
        Object.keys(groups).forEach((k) => {
            groups[k as OrderStatus].sort((a, b) => {
                const pr = priorityRank[a.priority] - priorityRank[b.priority];
                if (pr !== 0) return pr;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
        });
        return groups;
    }, [filteredOrders]);

    /* ---------- Drag & drop ---------- */

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        const order = event.active.data.current?.order as Order | undefined;
        setDraggingOrder(order ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingOrder(null);
        const { active, over } = event;
        if (!over) return;

        const orderId = active.id as string;
        const newStatus = over.id as OrderStatus;
        const order = orders.find((o) => o.id === orderId);
        if (!order || order.status === newStatus) return;

        applyStatusChange(orderId, newStatus, currentEmployee ?? 'Hans Weber');
        const sc = STATUS_CONFIG[newStatus];
        showToast(`"${order.id}" movida a ${sc.text}.`, 'success');
    };

    /* ---------- Mutations ---------- */

    const applyStatusChange = (id: string, to: OrderStatus, by: string, note?: string) => {
        setOrders((prev) =>
            prev.map((o) => {
                if (o.id !== id) return o;
                const at = new Date().toISOString();
                const next: Order = {
                    ...o,
                    status: to,
                    history: [...o.history, { from: o.status, to, at, by, note }],
                    deliveredAt: to === 'delivered' ? at.split('T')[0] : o.deliveredAt,
                };
                return next;
            }),
        );
    };

    const handleChangeStatus = (status: OrderStatus, note?: string) => {
        if (!detailOrder) return;
        applyStatusChange(detailOrder.id, status, currentEmployee ?? 'Hans Weber', note);
        setDetailOrder((prev) => prev ? { ...prev, status } : prev);
        const sc = STATUS_CONFIG[status];
        showToast(`Estado cambiado a ${sc.text}.`, 'success');
    };

    const handleChangePriority = (priority: Priority) => {
        if (!detailOrder) return;
        setOrders((prev) => prev.map((o) => (o.id === detailOrder.id ? { ...o, priority } : o)));
        setDetailOrder((prev) => prev ? { ...prev, priority } : prev);
        showToast(`Prioridad actualizada a ${PRIORITY_CONFIG[priority].text}.`, 'info');
    };

    const handleAssign = (employee: string | undefined) => {
        if (!detailOrder) return;
        setOrders((prev) => prev.map((o) => (o.id === detailOrder.id ? { ...o, assignedTo: employee } : o)));
        setDetailOrder((prev) => prev ? { ...prev, assignedTo: employee } : prev);
        showToast(employee ? `Asignado a ${employee}.` : 'Asignación quitada.', 'info');
    };

    const handleSaveNotes = (notes: string) => {
        if (!detailOrder) return;
        const final = notes.trim() || undefined;
        setOrders((prev) => prev.map((o) => (o.id === detailOrder.id ? { ...o, productionNotes: final } : o)));
        setDetailOrder((prev) => prev ? { ...prev, productionNotes: final } : prev);
        showToast('Notas guardadas.', 'success');
    };

    const handleCancel = (reason: string) => {
        if (!detailOrder) return;
        const at = new Date().toISOString();
        setOrders((prev) =>
            prev.map((o) =>
                o.id === detailOrder.id
                    ? {
                        ...o,
                        status: 'cancelled' as OrderStatus,
                        cancelReason: reason,
                        cancelledAt: at.split('T')[0],
                        history: [...o.history, { from: o.status, to: 'cancelled' as OrderStatus, at, by: currentEmployee ?? 'Hans Weber', note: reason }],
                    }
                    : o,
            ),
        );
        showToast(`Orden "${detailOrder.id}" cancelada.`, 'warning');
        setDetailOrder(null);
    };

    const handleDownload = (order: Order) => {
        showToast(`Descargando ${order.id}.pdf...`, 'info');
    };

    const handleSubmitProof = (data: { imageUrl: string; notes: string }) => {
        if (!proofingOrder) return;
        const at = new Date().toISOString();
        const proofId = `pf-${Date.now()}`;
        const newProof = {
            id: proofId,
            imageUrl: data.imageUrl,
            sentAt: at.split('T')[0],
            status: 'pending' as const,
            notes: data.notes || undefined,
        };
        const by = currentEmployee ?? 'Hans Weber';
        setOrders((prev) =>
            prev.map((o) =>
                o.id === proofingOrder.id
                    ? {
                        ...o,
                        proofs: [...o.proofs, newProof],
                        history: [...o.history, { from: o.status, to: o.status, at, by, note: 'Prueba enviada al cliente' }],
                    }
                    : o,
            ),
        );
        setDetailOrder((prev) =>
            prev && prev.id === proofingOrder.id
                ? { ...prev, proofs: [...prev.proofs, newProof] }
                : prev,
        );
        setProofingOrder(null);
        showToast(`Prueba enviada a ${proofingOrder.customer.email}.`, 'success');
    };

    /* ---------- Excel export ---------- */

    const exportToExcel = async () => {
        setExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Órdenes');
            ws.columns = [
                { header: 'ID', key: 'id', width: 14 },
                { header: 'Cliente', key: 'customer', width: 24 },
                { header: 'Empresa', key: 'company', width: 22 },
                { header: 'Estado', key: 'status', width: 14 },
                { header: 'Prioridad', key: 'priority', width: 12 },
                { header: 'Items', key: 'items', width: 8 },
                { header: 'Total', key: 'total', width: 14 },
                { header: 'Asignado', key: 'assignedTo', width: 18 },
                { header: 'Vence', key: 'dueDate', width: 14 },
                { header: 'Creada', key: 'createdAt', width: 14 },
            ];
            const headerRow = ws.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });
            headerRow.height = 22;

            filteredOrders.forEach((o) => {
                ws.addRow({
                    id: o.id,
                    customer: o.customer.name,
                    company: o.customer.company ?? '',
                    status: STATUS_CONFIG[o.status].text,
                    priority: PRIORITY_CONFIG[o.priority].text,
                    items: o.items.length,
                    total: o.total,
                    assignedTo: o.assignedTo ?? '—',
                    dueDate: o.dueDate ?? '',
                    createdAt: o.createdAt,
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `ordenes_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            showToast('No fue posible exportar el archivo.', 'error');
            setExporting(false);
        }
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Archivo de órdenes exportado correctamente.', 'success');
    };

    const priorityFilterLabel = PRIORITY_OPTIONS.find((o) => o.value === priorityFilter)?.label ?? 'Cualquier prioridad';
    const assigneeFilterLabel = assigneeFilter === 'ALL' ? 'Todos los responsables' : assigneeFilter;

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Órdenes de producción
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            {currentEmployee
                                ? 'Tus órdenes asignadas y el estado del taller en general.'
                                : 'Flujo de producción en tiempo real. Arrastra las tarjetas para cambiar de estado.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                        {/* View toggle */}
                        <div className="inline-flex h-9 bg-slate-100 border border-slate-200 rounded-md p-0.5">
                            <button
                                type="button"
                                onClick={() => setView('kanban')}
                                aria-label="Vista Kanban"
                                className={`px-2.5 text-[12px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${view === 'kanban'
                                        ? 'bg-white text-slate-900 border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <BsKanban size={11} />
                                Kanban
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                aria-label="Vista lista"
                                className={`px-2.5 text-[12px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${view === 'list'
                                        ? 'bg-white text-slate-900 border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <BsListUl size={11} />
                                Lista
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={exportToExcel}
                            disabled={filteredOrders.length === 0}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <BsDownload size={12} />
                            Exportar
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Activas" value={stats.total} dot="bg-[#1e40af]" />
                    <StatCard label="En producción" value={stats.inProduction} dot="bg-amber-500" />
                    <StatCard label="Listas" value={stats.ready} dot="bg-sky-500" />
                    <StatCard label="Atrasadas" value={stats.overdue} dot="bg-rose-500" alert={stats.overdue > 0} />
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col lg:flex-row gap-2.5">
                    {currentEmployee && (
                        <div className="inline-flex h-9 bg-slate-100 border border-slate-200 rounded-md p-0.5 self-start lg:self-auto">
                            <button
                                type="button"
                                onClick={() => setScopeMine(true)}
                                className={`px-3 text-[12px] font-medium rounded transition-colors cursor-pointer ${scopeMine
                                        ? 'bg-white text-slate-900 border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                Mías
                            </button>
                            <button
                                type="button"
                                onClick={() => setScopeMine(false)}
                                className={`px-3 text-[12px] font-medium rounded transition-colors cursor-pointer ${!scopeMine
                                        ? 'bg-white text-slate-900 border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                Todas
                            </button>
                        </div>
                    )}

                    <div className="relative flex-1 min-w-[200px]">
                        <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                            type="text"
                            placeholder="Buscar por ID, cliente, descripción..."
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

                    <div className="flex gap-2 flex-wrap">
                        {!currentEmployee && (
                            <div className="relative" ref={assigneeRef}>
                                <FilterButton
                                    label={assigneeFilterLabel}
                                    active={assigneeFilter !== 'ALL'}
                                    open={assigneeOpen}
                                    icon={<BsPersonCheck size={11} />}
                                    onToggle={() => {
                                        setAssigneeOpen(!assigneeOpen);
                                        setPriorityOpen(false);
                                    }}
                                />
                                {assigneeOpen && (
                                    <DropdownMenu>
                                        <DropdownItem
                                            label="Todos los responsables"
                                            selected={assigneeFilter === 'ALL'}
                                            onClick={() => {
                                                setAssigneeFilter('ALL');
                                                setAssigneeOpen(false);
                                            }}
                                        />
                                        <DropdownItem
                                            label="Sin asignar"
                                            selected={assigneeFilter === 'NONE'}
                                            onClick={() => {
                                                setAssigneeFilter('NONE');
                                                setAssigneeOpen(false);
                                            }}
                                        />
                                        {employees.map((emp) => (
                                            <DropdownItem
                                                key={emp}
                                                label={emp}
                                                selected={assigneeFilter === emp}
                                                onClick={() => {
                                                    setAssigneeFilter(emp);
                                                    setAssigneeOpen(false);
                                                }}
                                            />
                                        ))}
                                    </DropdownMenu>
                                )}
                            </div>
                        )}

                        <div className="relative" ref={priorityRef}>
                            <FilterButton
                                label={priorityFilterLabel}
                                active={priorityFilter !== 'ALL'}
                                open={priorityOpen}
                                onToggle={() => {
                                    setPriorityOpen(!priorityOpen);
                                    setAssigneeOpen(false);
                                }}
                            />
                            {priorityOpen && (
                                <DropdownMenu>
                                    {PRIORITY_OPTIONS.map((opt) => (
                                        <DropdownItem
                                            key={opt.value}
                                            label={opt.label}
                                            dot={opt.dot}
                                            selected={priorityFilter === opt.value}
                                            onClick={() => {
                                                setPriorityFilter(opt.value);
                                                setPriorityOpen(false);
                                            }}
                                        />
                                    ))}
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body: Kanban or List */}
                {view === 'kanban' ? (
                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                            {KANBAN_STATUSES.map((status) => (
                                <KanbanColumn
                                    key={status}
                                    status={status}
                                    orders={ordersByStatus[status]}
                                    onCardClick={(order) => setDetailOrder(order)}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {draggingOrder && (
                                <KanbanCard order={draggingOrder} onClick={() => { }} isOverlay />
                            )}
                        </DragOverlay>
                    </DndContext>
                ) : (
                    <ListView
                        orders={filteredOrders}
                        onClickOrder={(o) => setDetailOrder(o)}
                    />
                )}
            </div>

            <AnimatePresence>
                {detailOrder && (
                    <OrderDetailDrawer
                        order={detailOrder}
                        employees={employees}
                        onClose={() => setDetailOrder(null)}
                        onChangeStatus={handleChangeStatus}
                        onChangePriority={handleChangePriority}
                        onAssign={handleAssign}
                        onSaveNotes={handleSaveNotes}
                        onCancel={handleCancel}
                        onDownload={() => handleDownload(detailOrder)}
                        onSendProof={() => setProofingOrder(detailOrder)}
                    />
                )}
                {proofingOrder && (
                    <ProofUploader
                        orderId={proofingOrder.id}
                        customerEmail={proofingOrder.customer.email}
                        onClose={() => setProofingOrder(null)}
                        onSubmit={handleSubmitProof}
                    />
                )}
                {exporting && (
                    <ExportOverlay
                        label="Exportando órdenes"
                        description={`Estamos preparando un archivo con ${filteredOrders.length} orden(es).`}
                        onComplete={handleExportComplete}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- List view (compact table) ---------- */

function ListView({ orders, onClickOrder }: { orders: Order[]; onClickOrder: (o: Order) => void }) {
    if (orders.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg px-6 py-16 flex flex-col items-center text-center">
                <BsKanban size={20} className="text-slate-400 mb-3" />
                <p className="text-[13px] font-medium text-slate-700">No hay órdenes que mostrar.</p>
                <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
                    Ajusta los filtros para ver más órdenes.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50/60 border-b border-slate-200">
                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Cliente / Descripción</th>
                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Asignado</th>
                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Vence</th>
                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider text-right">Total</th>
                            <th className="px-4 py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => {
                            const sc = STATUS_CONFIG[o.status];
                            const pc = PRIORITY_CONFIG[o.priority];
                            const urgency = getDueUrgency(o.dueDate);
                            const dueColor =
                                urgency.tone === 'overdue' ? 'text-rose-700 font-semibold'
                                    : urgency.tone === 'urgent' ? 'text-rose-700'
                                        : urgency.tone === 'soon' ? 'text-amber-700'
                                            : 'text-slate-500';
                            return (
                                <tr
                                    key={o.id}
                                    onClick={() => onClickOrder(o)}
                                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-2.5">
                                        <p className="text-[12px] font-mono font-semibold text-slate-900">{o.id}</p>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <p className="text-[13px] font-semibold text-slate-900 truncate max-w-[260px]">{o.customer.company ?? o.customer.name}</p>
                                        <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                                            {o.items[0]?.description}{o.items.length > 1 ? ` + ${o.items.length - 1}` : ''}
                                        </p>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sc.cls}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                            {sc.text}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${pc.cls}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                                            {pc.text}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {o.assignedTo ? (
                                            <span className="text-[12px] text-slate-700">{o.assignedTo}</span>
                                        ) : (
                                            <span className="text-[12px] text-slate-400 italic">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {o.dueDate ? (
                                            <span className={`inline-flex items-center gap-1 text-[12px] ${dueColor} tabular-nums`}>
                                                {urgency.tone === 'overdue' ? <BsExclamationTriangle size={10} /> : <BsClock size={10} />}
                                                {o.dueDate}
                                            </span>
                                        ) : (
                                            <span className="text-[12px] text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <span className="text-[13px] font-semibold text-slate-900 tabular-nums font-mono">
                                            {formatPrice(o.total)}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2.5">
                                        <BsThreeDots size={13} className="text-slate-300" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ---------- Stat card ---------- */

function StatCard({ label, value, dot, alert }: { label: string; value: number; dot: string; alert?: boolean }) {
    return (
        <div className={`bg-white border rounded-lg px-4 py-3 transition-colors ${alert ? 'border-rose-200' : 'border-slate-200 hover:border-slate-300'
            }`}>
            <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-[22px] font-semibold tracking-[-0.02em] leading-none mt-2 tabular-nums ${alert ? 'text-rose-700' : 'text-slate-900'
                }`}>
                {value}
            </p>
        </div>
    );
}

/* ---------- Filter UI ---------- */

function FilterButton({
    label,
    active,
    open,
    onToggle,
    icon,
}: {
    label: string;
    active: boolean;
    open: boolean;
    onToggle: () => void;
    icon?: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`h-9 pl-3 pr-2 bg-white border rounded-md text-[12.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 min-w-[150px] justify-between ${open
                    ? 'border-[#1e40af] text-slate-900'
                    : active
                        ? 'border-[#1e40af]/40 bg-[#1e40af]/5 text-slate-900'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
        >
            <span className="flex items-center gap-1.5 min-w-0">
                {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
                <span className="truncate">{label}</span>
            </span>
            <BsChevronDown size={10} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
    );
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute top-full left-0 mt-1 min-w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-200 rounded-md py-1 z-40">
            {children}
        </div>
    );
}

function DropdownItem({ label, dot, selected, onClick }: { label: string; dot?: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] transition-colors cursor-pointer whitespace-nowrap ${selected
                    ? 'bg-[#1e40af]/10 text-[#1e40af] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
        >
            {dot !== undefined && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
            <span className="flex-1 text-left">{label}</span>
            {selected && <BsCheck2 size={12} />}
        </button>
    );
}

