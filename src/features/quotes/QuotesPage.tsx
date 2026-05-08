import { useEffect, useMemo, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AnimatePresence } from 'motion/react';
import {
    BsSearch,
    BsX,
    BsCheck2,
    BsChevronDown,
    BsChevronUp,
    BsPlus,
    BsDownload,
    BsThreeDots,
    BsPencil,
    BsTrash,
    BsCalculator,
    BsArrowRepeat,
    BsCopy,
    BsArrowRightCircle,
    BsCheckCircle,
    BsXCircle,
    BsCalendar3,
} from 'react-icons/bs';

import Pagination from '../../components/Pagination';
import ExportOverlay from '../../components/ExportOverlay';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';

import { INITIAL_QUOTES } from './mockData';
import { STATUS_CONFIG, type Quote, type QuoteStatus } from './types';
import { formatPrice } from './pricing';
import QuoteFormModal from './QuoteFormModal';
import QuoteDetailDrawer from './QuoteDetailDrawer';

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'Todos los estados', dot: '' },
    { value: 'draft', label: 'Borrador', dot: 'bg-slate-400' },
    { value: 'sent', label: 'Enviada', dot: 'bg-sky-500' },
    { value: 'approved', label: 'Aprobada', dot: 'bg-emerald-500' },
    { value: 'rejected', label: 'Rechazada', dot: 'bg-rose-500' },
    { value: 'expired', label: 'Expirada', dot: 'bg-amber-500' },
    { value: 'converted', label: 'Convertida', dot: 'bg-[#1e40af]' },
] as const;

const DATE_RANGES = [
    { value: 'ALL', label: 'Cualquier fecha' },
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 90 días' },
    { value: '365', label: 'Último año' },
] as const;

type SortKey = 'id' | 'customer' | 'status' | 'total' | 'createdAt';
type SortDir = 'asc' | 'desc';

type ConfirmAction =
    | { kind: 'delete'; quote: Quote }
    | { kind: 'send'; quote: Quote }
    | { kind: 'approve'; quote: Quote }
    | { kind: 'reject'; quote: Quote }
    | { kind: 'convert'; quote: Quote }
    | { kind: 'bulk-delete'; ids: string[] }
    | null;

interface QuotesPageProps {
    /** Sección donde está montada para navegar (ej. '/quotes') */
    basePath?: string;
}

export default function QuotesPage(_props: QuotesPageProps = {}) {
    const { showToast } = useToast();

    const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateRange, setDateRange] = useState<string>('ALL');

    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [creatingQuote, setCreatingQuote] = useState(false);
    const [detailQuote, setDetailQuote] = useState<Quote | null>(null);
    const [confirm, setConfirm] = useState<ConfirmAction>(null);
    const [exporting, setExporting] = useState(false);

    const [statusOpen, setStatusOpen] = useState(false);
    const [dateOpen, setDateOpen] = useState(false);
    const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);

    const statusRef = useRef<HTMLDivElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
            if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setActionMenuFor(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredQuotes = useMemo(() => {
        const q = search.toLowerCase().trim();
        const cutoff = dateRange === 'ALL' ? null : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000;

        const filtered = quotes.filter((quote) => {
            const matchSearch =
                !q ||
                quote.id.toLowerCase().includes(q) ||
                quote.customer.name.toLowerCase().includes(q) ||
                quote.customer.email.toLowerCase().includes(q) ||
                (quote.customer.company?.toLowerCase().includes(q) ?? false);
            const matchStatus = statusFilter === 'ALL' || quote.status === statusFilter;
            const matchDate = !cutoff || new Date(quote.createdAt).getTime() >= cutoff;
            return matchSearch && matchStatus && matchDate;
        });

        return [...filtered].sort((a, b) => {
            let va: string | number;
            let vb: string | number;
            if (sortKey === 'createdAt') {
                va = new Date(a.createdAt).getTime();
                vb = new Date(b.createdAt).getTime();
            } else if (sortKey === 'total') {
                va = a.total;
                vb = b.total;
            } else if (sortKey === 'customer') {
                va = a.customer.name.toLowerCase();
                vb = b.customer.name.toLowerCase();
            } else if (sortKey === 'status') {
                va = a.status;
                vb = b.status;
            } else {
                va = a.id;
                vb = b.id;
            }
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [quotes, search, statusFilter, dateRange, sortKey, sortDir]);

    useEffect(() => setCurrentPage(1), [search, statusFilter, dateRange]);

    useEffect(() => {
        const validIds = new Set(filteredQuotes.map((q) => q.id));
        setSelectedIds((prev) => {
            const next = new Set<string>();
            prev.forEach((id) => validIds.has(id) && next.add(id));
            return next.size === prev.size ? prev : next;
        });
    }, [filteredQuotes]);

    const paginatedQuotes = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredQuotes.slice(start, start + rowsPerPage);
    }, [filteredQuotes, currentPage, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / rowsPerPage));

    const stats = useMemo(() => {
        const totalAmount = quotes
            .filter((q) => q.status === 'sent' || q.status === 'approved')
            .reduce((sum, q) => sum + q.total, 0);
        return {
            total: quotes.length,
            sent: quotes.filter((q) => q.status === 'sent').length,
            approved: quotes.filter((q) => q.status === 'approved').length,
            totalAmount,
        };
    }, [quotes]);

    const filtersActive = search.trim() !== '' || statusFilter !== 'ALL' || dateRange !== 'ALL';

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('ALL');
        setDateRange('ALL');
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else {
            setSortKey(key);
            setSortDir(key === 'total' || key === 'createdAt' ? 'desc' : 'asc');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAllPage = (allChecked: boolean, pageIds: string[]) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allChecked) pageIds.forEach((id) => next.delete(id));
            else pageIds.forEach((id) => next.add(id));
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    /* ---------- Mutations ---------- */

    const performDelete = (id: string) => {
        const target = quotes.find((q) => q.id === id);
        if (!target) return;
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        showToast(`Cotización "${target.id}" eliminada.`, 'success');
    };

    const performBulkDelete = (ids: string[]) => {
        setQuotes((prev) => prev.filter((q) => !ids.includes(q.id)));
        clearSelection();
        showToast(`${ids.length} cotizaciones eliminadas.`, 'success');
    };

    const updateStatus = (id: string, next: QuoteStatus, extra: Partial<Quote> = {}) => {
        setQuotes((prev) =>
            prev.map((q) =>
                q.id === id ? { ...q, status: next, ...extra } : q,
            ),
        );
    };

    const performSend = (quote: Quote) => {
        updateStatus(quote.id, 'sent', {
            sentAt: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        });
        showToast(`Cotización "${quote.id}" enviada a ${quote.customer.email}.`, 'success');
    };

    const performApprove = (quote: Quote) => {
        updateStatus(quote.id, 'approved', { respondedAt: new Date().toISOString().split('T')[0] });
        showToast(`Cotización "${quote.id}" marcada como aprobada.`, 'success');
    };

    const performReject = (quote: Quote) => {
        updateStatus(quote.id, 'rejected', {
            respondedAt: new Date().toISOString().split('T')[0],
            rejectionReason: 'Marcada como rechazada manualmente.',
        });
        showToast(`Cotización "${quote.id}" marcada como rechazada.`, 'warning');
    };

    const performConvert = (quote: Quote) => {
        const orderId = `OR-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
        updateStatus(quote.id, 'converted', {
            convertedAt: new Date().toISOString().split('T')[0],
            convertedToOrderId: orderId,
        });
        showToast(`Cotización convertida a orden "${orderId}".`, 'success');
    };

    const handleDuplicate = (quote: Quote) => {
        const id = `COT-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
        const duplicated: Quote = {
            ...quote,
            id,
            status: 'draft',
            createdAt: new Date().toISOString().split('T')[0],
            sentAt: undefined,
            respondedAt: undefined,
            convertedAt: undefined,
            convertedToOrderId: undefined,
            validUntil: undefined,
            rejectionReason: undefined,
        };
        setQuotes((prev) => [duplicated, ...prev]);
        showToast(`Borrador "${duplicated.id}" creado a partir de "${quote.id}".`, 'success');
    };

    const handleCreate = (quote: Quote) => {
        setQuotes((prev) => [quote, ...prev]);
        showToast(`Cotización "${quote.id}" creada correctamente.`, 'success');
    };

    const handleUpdate = (quote: Quote) => {
        setQuotes((prev) => prev.map((q) => (q.id === quote.id ? quote : q)));
        showToast(`Cotización "${quote.id}" actualizada.`, 'success');
    };

    /* ---------- Excel export ---------- */

    const exportToExcel = async () => {
        setExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Cotizaciones');
            ws.columns = [
                { header: 'ID', key: 'id', width: 14 },
                { header: 'Cliente', key: 'customer', width: 24 },
                { header: 'Empresa', key: 'company', width: 22 },
                { header: 'Email', key: 'email', width: 28 },
                { header: 'Estado', key: 'status', width: 14 },
                { header: 'Items', key: 'items', width: 8 },
                { header: 'Subtotal', key: 'subtotal', width: 14 },
                { header: 'IGV', key: 'tax', width: 12 },
                { header: 'Total', key: 'total', width: 14 },
                { header: 'Creado por', key: 'createdBy', width: 20 },
                { header: 'Creado', key: 'createdAt', width: 14 },
                { header: 'Vence', key: 'validUntil', width: 14 },
            ];

            const headerRow = ws.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });
            headerRow.height = 22;

            filteredQuotes.forEach((q) => {
                ws.addRow({
                    id: q.id,
                    customer: q.customer.name,
                    company: q.customer.company ?? '',
                    email: q.customer.email,
                    status: STATUS_CONFIG[q.status].text,
                    items: q.items.length,
                    subtotal: q.subtotal,
                    tax: q.tax,
                    total: q.total,
                    createdBy: q.createdBy,
                    createdAt: q.createdAt,
                    validUntil: q.validUntil ?? '',
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            showToast('No fue posible exportar el archivo.', 'error');
            setExporting(false);
        }
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Archivo de cotizaciones exportado correctamente.', 'success');
    };

    const statusFilterLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'Todos los estados';
    const dateFilterLabel = DATE_RANGES.find((o) => o.value === dateRange)?.label ?? 'Cualquier fecha';

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Cotizaciones
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Gestiona las cotizaciones enviadas a clientes y conviértelas en órdenes de producción.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                        <button
                            type="button"
                            onClick={exportToExcel}
                            disabled={filteredQuotes.length === 0}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <BsDownload size={12} />
                            Exportar
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreatingQuote(true)}
                            className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsPlus size={15} />
                            Nueva cotización
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Total" value={stats.total.toString()} dot="bg-[#1e40af]" />
                    <StatCard label="Enviadas" value={stats.sent.toString()} dot="bg-sky-500" />
                    <StatCard label="Aprobadas" value={stats.approved.toString()} dot="bg-emerald-500" />
                    <StatCard label="Monto en juego" value={formatPrice(stats.totalAmount)} dot="bg-amber-500" small />
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col lg:flex-row gap-2.5">
                    <div className="relative flex-1 min-w-[220px]">
                        <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                            type="text"
                            placeholder="Buscar por ID, cliente o empresa..."
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
                        <div className="relative" ref={statusRef}>
                            <FilterButton
                                label={statusFilterLabel}
                                active={statusFilter !== 'ALL'}
                                open={statusOpen}
                                onToggle={() => {
                                    setStatusOpen(!statusOpen);
                                    setDateOpen(false);
                                }}
                            />
                            {statusOpen && (
                                <DropdownMenu>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <DropdownItem
                                            key={opt.value}
                                            label={opt.label}
                                            dot={opt.dot}
                                            selected={statusFilter === opt.value}
                                            onClick={() => {
                                                setStatusFilter(opt.value);
                                                setStatusOpen(false);
                                            }}
                                        />
                                    ))}
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="relative" ref={dateRef}>
                            <FilterButton
                                label={dateFilterLabel}
                                active={dateRange !== 'ALL'}
                                open={dateOpen}
                                icon={<BsCalendar3 size={11} />}
                                onToggle={() => {
                                    setDateOpen(!dateOpen);
                                    setStatusOpen(false);
                                }}
                            />
                            {dateOpen && (
                                <DropdownMenu>
                                    {DATE_RANGES.map((opt) => (
                                        <DropdownItem
                                            key={opt.value}
                                            label={opt.label}
                                            selected={dateRange === opt.value}
                                            onClick={() => {
                                                setDateRange(opt.value);
                                                setDateOpen(false);
                                            }}
                                        />
                                    ))}
                                </DropdownMenu>
                            )}
                        </div>

                        {filtersActive && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="h-9 px-3 text-[12px] font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk actions bar */}
                <AnimatePresence>
                    {selectedIds.size > 0 && (
                        <div className="bg-[#1e40af] text-white border border-[#1e3a8a] rounded-lg px-4 py-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-[13px]">
                                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded bg-white/15 font-semibold tabular-nums">
                                    {selectedIds.size}
                                </span>
                                <span className="font-medium">
                                    {selectedIds.size === 1 ? 'cotización seleccionada' : 'cotizaciones seleccionadas'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setConfirm({ kind: 'bulk-delete', ids: Array.from(selectedIds) })}
                                    className="h-7 px-2.5 text-[12px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 text-rose-100 hover:bg-rose-500/30"
                                >
                                    <BsTrash size={12} />
                                    Eliminar
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    aria-label="Cancelar selección"
                                    className="ml-1 w-7 h-7 rounded hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                                >
                                    <BsX size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        {(() => {
                            const pageIds = paginatedQuotes.map((q) => q.id);
                            const allPageChecked = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
                            const somePageChecked = !allPageChecked && pageIds.some((id) => selectedIds.has(id));

                            return (
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/60 border-b border-slate-200">
                                            <th className="pl-4 pr-2 py-2 w-9">
                                                <Checkbox
                                                    checked={allPageChecked}
                                                    indeterminate={somePageChecked}
                                                    onChange={() => toggleSelectAllPage(allPageChecked, pageIds)}
                                                    aria-label="Seleccionar todos"
                                                />
                                            </th>
                                            <SortableTh label="ID" sortKey="id" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <SortableTh label="Cliente" sortKey="customer" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                                            <SortableTh label="Total" sortKey="total" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} align="right" />
                                            <SortableTh label="Estado" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <SortableTh label="Creado" sortKey="createdAt" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedQuotes.map((quote) => {
                                            const status = STATUS_CONFIG[quote.status];
                                            const isMenuOpen = actionMenuFor === quote.id;
                                            const isSelected = selectedIds.has(quote.id);

                                            return (
                                                <tr
                                                    key={quote.id}
                                                    onClick={() => setDetailQuote(quote)}
                                                    className={`border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer ${isSelected ? 'bg-[#1e40af]/[0.03]' : 'hover:bg-slate-50/60'
                                                        }`}
                                                >
                                                    <td className="pl-4 pr-2 py-2.5 w-9" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(quote.id)}
                                                            aria-label={`Seleccionar ${quote.id}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <p className="text-[13px] font-mono font-semibold text-slate-900">{quote.id}</p>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <p className="text-[13px] font-semibold text-slate-900 truncate">{quote.customer.name}</p>
                                                        <p className="text-[11px] text-slate-500 truncate">
                                                            {quote.customer.company ?? quote.customer.email}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] text-slate-600">
                                                            {quote.items.length} {quote.items.length === 1 ? 'item' : 'items'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        <span className="text-[13px] font-semibold text-slate-900 font-mono tabular-nums">
                                                            {formatPrice(quote.total)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                            {status.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] text-slate-500 tabular-nums">{quote.createdAt}</span>
                                                    </td>
                                                    <td className="px-2 py-2.5 relative" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActionMenuFor(isMenuOpen ? null : quote.id)}
                                                            aria-label={`Acciones de ${quote.id}`}
                                                            className="w-7 h-7 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                                                        >
                                                            <BsThreeDots size={13} />
                                                        </button>
                                                        {isMenuOpen && (
                                                            <div ref={actionMenuRef} className="absolute right-2 top-full mt-1 w-52 bg-white border border-slate-200 rounded-md overflow-hidden z-10">
                                                                <ActionMenuItem
                                                                    icon={<BsCalculator size={12} />}
                                                                    label="Ver detalle"
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        setDetailQuote(quote);
                                                                    }}
                                                                />
                                                                {(quote.status === 'draft' || quote.status === 'sent') && (
                                                                    <ActionMenuItem
                                                                        icon={<BsPencil size={12} />}
                                                                        label="Editar"
                                                                        onClick={() => {
                                                                            setActionMenuFor(null);
                                                                            setEditingQuote(quote);
                                                                        }}
                                                                    />
                                                                )}
                                                                {quote.status === 'draft' && (
                                                                    <ActionMenuItem
                                                                        icon={<BsArrowRepeat size={12} />}
                                                                        label="Enviar al cliente"
                                                                        onClick={() => {
                                                                            setActionMenuFor(null);
                                                                            setConfirm({ kind: 'send', quote });
                                                                        }}
                                                                    />
                                                                )}
                                                                {quote.status === 'sent' && (
                                                                    <>
                                                                        <ActionMenuItem
                                                                            icon={<BsCheckCircle size={12} />}
                                                                            label="Marcar aprobada"
                                                                            onClick={() => {
                                                                                setActionMenuFor(null);
                                                                                setConfirm({ kind: 'approve', quote });
                                                                            }}
                                                                        />
                                                                        <ActionMenuItem
                                                                            icon={<BsXCircle size={12} />}
                                                                            label="Marcar rechazada"
                                                                            onClick={() => {
                                                                                setActionMenuFor(null);
                                                                                setConfirm({ kind: 'reject', quote });
                                                                            }}
                                                                        />
                                                                    </>
                                                                )}
                                                                {quote.status === 'approved' && (
                                                                    <ActionMenuItem
                                                                        icon={<BsArrowRightCircle size={12} />}
                                                                        label="Convertir a orden"
                                                                        onClick={() => {
                                                                            setActionMenuFor(null);
                                                                            setConfirm({ kind: 'convert', quote });
                                                                        }}
                                                                    />
                                                                )}
                                                                <ActionMenuItem
                                                                    icon={<BsCopy size={12} />}
                                                                    label="Duplicar"
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        handleDuplicate(quote);
                                                                    }}
                                                                />
                                                                {quote.status === 'draft' && (
                                                                    <>
                                                                        <div className="border-t border-slate-100" />
                                                                        <ActionMenuItem
                                                                            icon={<BsTrash size={12} />}
                                                                            label="Eliminar"
                                                                            danger
                                                                            onClick={() => {
                                                                                setActionMenuFor(null);
                                                                                setConfirm({ kind: 'delete', quote });
                                                                            }}
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            );
                        })()}

                        {filteredQuotes.length === 0 && (
                            <div className="px-6 py-16 flex flex-col items-center text-center">
                                <BsCalculator size={20} className="text-slate-400 mb-3" />
                                <p className="text-[13px] font-medium text-slate-700">No se encontraron cotizaciones.</p>
                                <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
                                    {filtersActive
                                        ? 'Prueba ajustando los filtros o limpia la búsqueda.'
                                        : 'Crea la primera cotización con el botón superior.'}
                                </p>
                                {filtersActive && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-4 h-8 px-3 bg-white border border-slate-200 text-slate-700 text-[12px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {filteredQuotes.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            rowsPerPage={rowsPerPage}
                            totalEntries={filteredQuotes.length}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={(rows) => {
                                setRowsPerPage(rows);
                                setCurrentPage(1);
                            }}
                        />
                    )}
                </div>
            </div>

            <AnimatePresence>
                {detailQuote && (
                    <QuoteDetailDrawer
                        quote={detailQuote}
                        onClose={() => setDetailQuote(null)}
                        onEdit={() => {
                            setEditingQuote(detailQuote);
                            setDetailQuote(null);
                        }}
                        onSend={() => {
                            setConfirm({ kind: 'send', quote: detailQuote });
                            setDetailQuote(null);
                        }}
                        onApprove={() => {
                            setConfirm({ kind: 'approve', quote: detailQuote });
                            setDetailQuote(null);
                        }}
                        onReject={() => {
                            setConfirm({ kind: 'reject', quote: detailQuote });
                            setDetailQuote(null);
                        }}
                        onConvert={() => {
                            setConfirm({ kind: 'convert', quote: detailQuote });
                            setDetailQuote(null);
                        }}
                        onDuplicate={() => {
                            handleDuplicate(detailQuote);
                            setDetailQuote(null);
                        }}
                    />
                )}

                {(creatingQuote || editingQuote) && (
                    <QuoteFormModal
                        mode={creatingQuote ? 'create' : 'edit'}
                        initial={editingQuote}
                        onClose={() => {
                            setCreatingQuote(false);
                            setEditingQuote(null);
                        }}
                        onSave={(quote) => {
                            if (editingQuote) handleUpdate(quote);
                            else handleCreate(quote);
                            setCreatingQuote(false);
                            setEditingQuote(null);
                        }}
                    />
                )}

                {confirm?.kind === 'delete' && (
                    <ConfirmModal
                        title="Eliminar cotización"
                        description={`Esta acción eliminará permanentemente "${confirm.quote.id}". No se puede deshacer.`}
                        confirmLabel="Confirmar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performDelete(confirm.quote.id);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'send' && (
                    <ConfirmModal
                        title="Enviar cotización al cliente"
                        description={`Se enviará "${confirm.quote.id}" por correo a ${confirm.quote.customer.email}. La cotización tendrá una validez de 14 días.`}
                        confirmLabel="Enviar"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performSend(confirm.quote);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'approve' && (
                    <ConfirmModal
                        title="Marcar como aprobada"
                        description={`Se registrará "${confirm.quote.id}" como aprobada por el cliente. Después podrás convertirla en orden de producción.`}
                        confirmLabel="Aprobar"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performApprove(confirm.quote);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'reject' && (
                    <ConfirmModal
                        title="Marcar como rechazada"
                        description={`Se registrará "${confirm.quote.id}" como rechazada por el cliente.`}
                        confirmLabel="Rechazar"
                        variant="warning"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performReject(confirm.quote);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'convert' && (
                    <ConfirmModal
                        title="Convertir a orden de producción"
                        description={`Se generará una nueva orden a partir de "${confirm.quote.id}" y pasará al flujo de producción.`}
                        confirmLabel="Convertir"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performConvert(confirm.quote);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'bulk-delete' && (
                    <ConfirmModal
                        title={`Eliminar ${confirm.ids.length} cotizaciones`}
                        description="Esta acción eliminará permanentemente las cotizaciones seleccionadas. No se puede deshacer."
                        confirmLabel="Confirmar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performBulkDelete(confirm.ids);
                            setConfirm(null);
                        }}
                    />
                )}

                {exporting && (
                    <ExportOverlay
                        label="Exportando cotizaciones"
                        description={`Estamos preparando un archivo con ${filteredQuotes.length} cotización(es).`}
                        onComplete={handleExportComplete}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Stat ---------- */

function StatCard({ label, value, dot, small }: { label: string; value: string; dot: string; small?: boolean }) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className={`${small ? 'text-[16px]' : 'text-[22px]'} font-semibold text-slate-900 tracking-[-0.02em] leading-none mt-2 tabular-nums`}>
                {value}
            </p>
        </div>
    );
}

/* ---------- Filters / dropdowns / sortable / checkbox ---------- */

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

function ActionMenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium transition-colors cursor-pointer ${danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            <span className={danger ? '' : 'text-slate-400'}>{icon}</span>
            {label}
        </button>
    );
}

function Checkbox({
    checked,
    indeterminate = false,
    onChange,
    'aria-label': ariaLabel,
}: {
    checked: boolean;
    indeterminate?: boolean;
    onChange: () => void;
    'aria-label'?: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);
    return (
        <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            aria-label={ariaLabel}
            style={{ accentColor: '#1e40af' }}
            className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer"
        />
    );
}

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

