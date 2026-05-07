import { useEffect, useMemo, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AnimatePresence, motion } from 'motion/react';
import {
    BsSearch,
    BsPencil,
    BsTrash,
    BsPause,
    BsPlay,
    BsX,
    BsCheck2,
    BsChevronDown,
    BsPlus,
    BsDownload,
    BsBuilding,
    BsThreeDots,
} from 'react-icons/bs';

import Pagination from '../../../components/Pagination';
import ExportOverlay from '../../../components/ExportOverlay';
import ConfirmModal from '../../../components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { validateEmail, validateRequired } from '../../../utils/validators';

interface Tenant {
    id: string;
    company: string;
    admin: string;
    email: string;
    plan: 'ENTERPRISE' | 'PROFESSIONAL';
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    users: number;
    storage: string;
    createdAt: string;
    lastLogin: string;
}

const INITIAL_TENANTS: Tenant[] = [
    { id: 'T-001', company: 'EuroPrint Hub', admin: 'Hans Weber', email: 'boss@europrint.de', plan: 'ENTERPRISE', status: 'ACTIVE', users: 84, storage: '128 GB', createdAt: '2024-01-15', lastLogin: 'hace 2 h' },
    { id: 'T-002', company: 'Global Signage Ltd', admin: 'Sarah Connor', email: 'admin@globalsign.co.uk', plan: 'PROFESSIONAL', status: 'ACTIVE', users: 42, storage: '64 GB', createdAt: '2024-02-20', lastLogin: 'hace 1 día' },
    { id: 'T-003', company: 'Imprenta Madrid', admin: 'Carlos Ruiz', email: 'info@madridpress.es', plan: 'PROFESSIONAL', status: 'SUSPENDED', users: 12, storage: '16 GB', createdAt: '2024-03-10', lastLogin: 'hace 2 sem' },
    { id: 'T-004', company: 'TechGraphics Inc', admin: 'Emily Zhang', email: 'support@techgraph.com', plan: 'ENTERPRISE', status: 'ACTIVE', users: 156, storage: '256 GB', createdAt: '2023-11-05', lastLogin: 'hace 30 min' },
    { id: 'T-005', company: 'Oceanic Brands', admin: 'Marco Rossi', email: 'mkt@oceanic.it', plan: 'PROFESSIONAL', status: 'PENDING', users: 0, storage: '0 GB', createdAt: '2024-06-01', lastLogin: 'Nunca' },
    { id: 'T-006', company: 'Nordic Signs AS', admin: 'Olaf Nilsen', email: 'olaf@nordicsigns.no', plan: 'PROFESSIONAL', status: 'ACTIVE', users: 8, storage: '8 GB', createdAt: '2024-04-18', lastLogin: 'hace 3 días' },
    { id: 'T-007', company: 'PrintForce GmbH', admin: 'Klaus Bauer', email: 'klaus@printforce.de', plan: 'PROFESSIONAL', status: 'ACTIVE', users: 35, storage: '48 GB', createdAt: '2024-01-28', lastLogin: 'hace 5 h' },
    { id: 'T-008', company: 'DesignWorks AU', admin: 'Mia Thompson', email: 'mia@designworks.com.au', plan: 'ENTERPRISE', status: 'ACTIVE', users: 92, storage: '180 GB', createdAt: '2023-09-12', lastLogin: 'hace 1 h' },
];

const STATUS_LABEL: Record<Tenant['status'], { text: string; cls: string; dot: string }> = {
    ACTIVE: { text: 'Activo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    SUSPENDED: { text: 'Suspendido', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    PENDING: { text: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

const PLAN_LABEL: Record<Tenant['plan'], string> = {
    ENTERPRISE: 'Enterprise',
    PROFESSIONAL: 'Professional',
};

const PLAN_OPTIONS = [
    { value: 'ALL', label: 'Todos los planes' },
    { value: 'ENTERPRISE', label: 'Enterprise' },
    { value: 'PROFESSIONAL', label: 'Professional' },
] as const;

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'Todos los estados', dot: '' },
    { value: 'ACTIVE', label: 'Activo', dot: 'bg-emerald-500' },
    { value: 'SUSPENDED', label: 'Suspendido', dot: 'bg-rose-500' },
    { value: 'PENDING', label: 'Pendiente', dot: 'bg-amber-500' },
] as const;

type ConfirmAction =
    | { kind: 'delete'; tenant: Tenant }
    | { kind: 'toggle'; tenant: Tenant }
    | null;

export default function Tenants() {
    const { showToast } = useToast();

    const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [creatingTenant, setCreatingTenant] = useState(false);
    const [confirm, setConfirm] = useState<ConfirmAction>(null);
    const [exporting, setExporting] = useState(false);

    const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);

    const planDropdownRef = useRef<HTMLDivElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (planDropdownRef.current && !planDropdownRef.current.contains(e.target as Node))
                setPlanDropdownOpen(false);
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node))
                setStatusDropdownOpen(false);
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node))
                setActionMenuFor(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredTenants = useMemo(() => {
        const q = search.toLowerCase().trim();
        return tenants.filter((t) => {
            const matchSearch =
                !q ||
                t.company.toLowerCase().includes(q) ||
                t.email.toLowerCase().includes(q) ||
                t.admin.toLowerCase().includes(q);
            const matchPlan = planFilter === 'ALL' || t.plan === planFilter;
            const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
            return matchSearch && matchPlan && matchStatus;
        });
    }, [tenants, search, planFilter, statusFilter]);

    useEffect(() => setCurrentPage(1), [search, planFilter, statusFilter]);

    const paginatedTenants = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredTenants.slice(start, start + rowsPerPage);
    }, [filteredTenants, currentPage, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredTenants.length / rowsPerPage));

    const stats = useMemo(() => {
        return {
            total: tenants.length,
            active: tenants.filter((t) => t.status === 'ACTIVE').length,
            suspended: tenants.filter((t) => t.status === 'SUSPENDED').length,
            pending: tenants.filter((t) => t.status === 'PENDING').length,
        };
    }, [tenants]);

    const filtersActive = search.trim() !== '' || planFilter !== 'ALL' || statusFilter !== 'ALL';

    const clearFilters = () => {
        setSearch('');
        setPlanFilter('ALL');
        setStatusFilter('ALL');
    };

    const performToggle = (id: string) => {
        const target = tenants.find((t) => t.id === id);
        if (!target) return;
        const next = target.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
        showToast(
            next === 'ACTIVE'
                ? `Empresa "${target.company}" reactivada.`
                : `Empresa "${target.company}" suspendida.`,
            next === 'ACTIVE' ? 'success' : 'warning',
        );
    };

    const performDelete = (id: string) => {
        const target = tenants.find((t) => t.id === id);
        if (!target) return;
        setTenants((prev) => prev.filter((t) => t.id !== id));
        showToast(`Empresa "${target.company}" eliminada.`, 'success');
    };

    const handleCreate = (data: Omit<Tenant, 'id' | 'createdAt' | 'lastLogin' | 'storage' | 'users'>) => {
        const id = `T-${String(tenants.length + 1).padStart(3, '0')}`;
        const newTenant: Tenant = {
            ...data,
            id,
            createdAt: new Date().toISOString().split('T')[0],
            lastLogin: 'Nunca',
            storage: '0 GB',
            users: 0,
        };
        setTenants((prev) => [newTenant, ...prev]);
        showToast(`Empresa "${data.company}" creada correctamente.`, 'success');
    };

    const handleUpdate = (updated: Tenant) => {
        setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        showToast(`Empresa "${updated.company}" actualizada.`, 'success');
    };

    const exportToExcel = async () => {
        setExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Empresas');
            ws.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Empresa', key: 'company', width: 28 },
                { header: 'Administrador', key: 'admin', width: 22 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Plan', key: 'plan', width: 16 },
                { header: 'Estado', key: 'status', width: 14 },
                { header: 'Usuarios', key: 'users', width: 10 },
                { header: 'Almacenamiento', key: 'storage', width: 14 },
                { header: 'Último ingreso', key: 'lastLogin', width: 16 },
            ];

            const headerRow = ws.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });
            headerRow.height = 22;

            filteredTenants.forEach((t) => {
                ws.addRow({
                    id: t.id,
                    company: t.company,
                    admin: t.admin,
                    email: t.email,
                    plan: PLAN_LABEL[t.plan],
                    status: STATUS_LABEL[t.status].text,
                    users: t.users,
                    storage: t.storage,
                    lastLogin: t.lastLogin,
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `empresas_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            showToast('No fue posible exportar el archivo.', 'error');
            setExporting(false);
        }
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Archivo de empresas exportado correctamente.', 'success');
    };

    const planFilterLabel =
        PLAN_OPTIONS.find((o) => o.value === planFilter)?.label ?? 'Todos los planes';
    const statusFilterLabel =
        STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'Todos los estados';

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Empresas
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Administra todas las organizaciones suscritas a la plataforma.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                        <button
                            type="button"
                            onClick={exportToExcel}
                            disabled={filteredTenants.length === 0}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <BsDownload size={12} />
                            Exportar
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreatingTenant(true)}
                            className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsPlus size={15} />
                            Nueva empresa
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Total" value={stats.total} dot="bg-[#1e40af]" />
                    <StatCard label="Activas" value={stats.active} dot="bg-emerald-500" />
                    <StatCard label="Suspendidas" value={stats.suspended} dot="bg-rose-500" />
                    <StatCard label="Pendientes" value={stats.pending} dot="bg-amber-500" />
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col lg:flex-row gap-2.5">
                    <div className="relative flex-1">
                        <BsSearch
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={13}
                        />
                        <input
                            type="text"
                            placeholder="Buscar por empresa, administrador o correo..."
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

                    <div className="flex gap-2">
                        {/* Plan dropdown */}
                        <div className="relative" ref={planDropdownRef}>
                            <FilterButton
                                label={planFilterLabel}
                                active={planFilter !== 'ALL'}
                                open={planDropdownOpen}
                                onToggle={() => {
                                    setPlanDropdownOpen(!planDropdownOpen);
                                    setStatusDropdownOpen(false);
                                }}
                            />
                            {planDropdownOpen && (
                                <DropdownMenu>
                                    {PLAN_OPTIONS.map((opt) => (
                                        <DropdownItem
                                            key={opt.value}
                                            label={opt.label}
                                            selected={planFilter === opt.value}
                                            onClick={() => {
                                                setPlanFilter(opt.value);
                                                setPlanDropdownOpen(false);
                                            }}
                                        />
                                    ))}
                                </DropdownMenu>
                            )}
                        </div>

                        {/* Status dropdown */}
                        <div className="relative" ref={statusDropdownRef}>
                            <FilterButton
                                label={statusFilterLabel}
                                active={statusFilter !== 'ALL'}
                                open={statusDropdownOpen}
                                onToggle={() => {
                                    setStatusDropdownOpen(!statusDropdownOpen);
                                    setPlanDropdownOpen(false);
                                }}
                            />
                            {statusDropdownOpen && (
                                <DropdownMenu>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <DropdownItem
                                            key={opt.value}
                                            label={opt.label}
                                            dot={opt.dot}
                                            selected={statusFilter === opt.value}
                                            onClick={() => {
                                                setStatusFilter(opt.value);
                                                setStatusDropdownOpen(false);
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

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50/60 border-b border-slate-200">
                                    <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Empresa</th>
                                    <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Administrador</th>
                                    <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider text-right">Usuarios</th>
                                    <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Almacenamiento</th>
                                    <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Último ingreso</th>
                                    <th className="px-4 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTenants.map((tenant) => {
                                    const status = STATUS_LABEL[tenant.status];
                                    const initials = tenant.company
                                        .split(' ')
                                        .map((w) => w[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase();
                                    const isMenuOpen = actionMenuFor === tenant.id;

                                    return (
                                        <tr
                                            key={tenant.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                        >
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 shrink-0">
                                                        {initials}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-semibold text-slate-900 truncate">{tenant.company}</p>
                                                        <p className="text-[11px] text-slate-400 font-mono">{tenant.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <p className="text-[13px] text-slate-700">{tenant.admin}</p>
                                                <p className="text-[11px] text-slate-500 font-mono">{tenant.email}</p>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-[12px] font-medium text-slate-700">
                                                    {PLAN_LABEL[tenant.plan]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <span className="text-[12px] font-mono tabular-nums text-slate-700">{tenant.users}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-[12px] font-mono tabular-nums text-slate-600">{tenant.storage}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-[12px] text-slate-500">{tenant.lastLogin}</span>
                                            </td>
                                            <td className="px-2 py-2.5 relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setActionMenuFor(isMenuOpen ? null : tenant.id)}
                                                    aria-label={`Acciones de ${tenant.company}`}
                                                    className="w-7 h-7 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                                                >
                                                    <BsThreeDots size={13} />
                                                </button>
                                                {isMenuOpen && (
                                                    <div ref={actionMenuRef} className="absolute right-2 top-full mt-1 w-44 bg-white border border-slate-200 rounded-md overflow-hidden z-10">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActionMenuFor(null);
                                                                setEditingTenant(tenant);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                                                        >
                                                            <BsPencil size={12} className="text-slate-400" />
                                                            Editar empresa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActionMenuFor(null);
                                                                setConfirm({ kind: 'toggle', tenant });
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                                                        >
                                                            {tenant.status === 'ACTIVE' ? (
                                                                <>
                                                                    <BsPause size={12} className="text-slate-400" /> Suspender
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <BsPlay size={12} className="text-slate-400" /> Reactivar
                                                                </>
                                                            )}
                                                        </button>
                                                        <div className="border-t border-slate-100" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActionMenuFor(null);
                                                                setConfirm({ kind: 'delete', tenant });
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        >
                                                            <BsTrash size={12} />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredTenants.length === 0 && (
                            <div className="px-6 py-16 flex flex-col items-center text-center">
                                <span className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                                    <BsBuilding size={16} />
                                </span>
                                <p className="text-[13px] font-medium text-slate-700">No se encontraron empresas.</p>
                                <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
                                    {filtersActive
                                        ? 'Prueba ajustando los filtros o limpia la búsqueda.'
                                        : 'Crea la primera empresa con el botón superior.'}
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

                    {filteredTenants.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            rowsPerPage={rowsPerPage}
                            totalEntries={filteredTenants.length}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={(rows) => {
                                setRowsPerPage(rows);
                                setCurrentPage(1);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {editingTenant && (
                    <TenantFormModal
                        mode="edit"
                        initial={editingTenant}
                        onClose={() => setEditingTenant(null)}
                        onSave={(data) => {
                            handleUpdate({ ...editingTenant, ...data });
                            setEditingTenant(null);
                        }}
                    />
                )}

                {creatingTenant && (
                    <TenantFormModal
                        mode="create"
                        onClose={() => setCreatingTenant(false)}
                        onSave={(data) => {
                            handleCreate(data);
                            setCreatingTenant(false);
                        }}
                    />
                )}

                {confirm?.kind === 'delete' && (
                    <ConfirmModal
                        title="Eliminar empresa"
                        description={`Esta acción eliminará permanentemente "${confirm.tenant.company}" y todos sus datos asociados. No se puede deshacer.`}
                        confirmLabel="Confirmar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performDelete(confirm.tenant.id);
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'toggle' && (
                    <ConfirmModal
                        title={confirm.tenant.status === 'ACTIVE' ? 'Suspender empresa' : 'Reactivar empresa'}
                        description={
                            confirm.tenant.status === 'ACTIVE'
                                ? `"${confirm.tenant.company}" no podrá acceder a la plataforma hasta que vuelvas a reactivarla.`
                                : `"${confirm.tenant.company}" podrá volver a operar normalmente en la plataforma.`
                        }
                        confirmLabel={confirm.tenant.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
                        variant={confirm.tenant.status === 'ACTIVE' ? 'warning' : 'primary'}
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performToggle(confirm.tenant.id);
                            setConfirm(null);
                        }}
                    />
                )}

                {exporting && (
                    <ExportOverlay
                        label="Exportando empresas"
                        description={`Estamos preparando un archivo con ${filteredTenants.length} empresas. No cierres esta ventana.`}
                        onComplete={handleExportComplete}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- StatCard ---------- */

function StatCard({ label, value, dot }: { label: string; value: number; dot: string }) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-[22px] font-semibold text-slate-900 tracking-[-0.02em] leading-none mt-2 tabular-nums">
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
}: {
    label: string;
    active: boolean;
    open: boolean;
    onToggle: () => void;
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
            <span className="truncate">{label}</span>
            <BsChevronDown
                size={10}
                className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
        </button>
    );
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute top-full left-0 mt-1 min-w-full bg-white border border-slate-200 rounded-md py-1 z-40">
            {children}
        </div>
    );
}

function DropdownItem({
    label,
    dot,
    selected,
    onClick,
}: {
    label: string;
    dot?: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] transition-colors cursor-pointer ${selected
                    ? 'bg-[#1e40af]/10 text-[#1e40af] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
        >
            {dot !== undefined && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
            )}
            <span className="flex-1 text-left">{label}</span>
            {selected && <BsCheck2 size={12} />}
        </button>
    );
}

/* ---------- Tenant form modal (create + edit) ---------- */

interface TenantFormData {
    company: string;
    admin: string;
    email: string;
    plan: Tenant['plan'];
    status: Tenant['status'];
}

function TenantFormModal({
    mode,
    initial,
    onClose,
    onSave,
}: {
    mode: 'create' | 'edit';
    initial?: Tenant;
    onClose: () => void;
    onSave: (data: TenantFormData) => void;
}) {
    const { showToast } = useToast();
    const [form, setForm] = useState<TenantFormData>({
        company: initial?.company ?? '',
        admin: initial?.admin ?? '',
        email: initial?.email ?? '',
        plan: initial?.plan ?? 'PROFESSIONAL',
        status: initial?.status ?? 'PENDING',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof TenantFormData, string>>>({});

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const update = <K extends keyof TenantFormData>(key: K, value: TenantFormData[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = (): boolean => {
        const next: Partial<Record<keyof TenantFormData, string>> = {};
        next.company = validateRequired(form.company, 'El nombre de la empresa', 2);
        next.admin = validateRequired(form.admin, 'El nombre del administrador', 2);
        next.email = validateEmail(form.email);
        const filtered = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
        setErrors(filtered);
        if (Object.keys(filtered).length > 0) {
            showToast('Revisa los campos marcados.', 'warning');
        }
        return Object.keys(filtered).length === 0;
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSave({
            ...form,
            company: form.company.trim(),
            admin: form.admin.trim(),
            email: form.email.trim().toLowerCase(),
        });
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
                className="w-full max-w-md bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">
                        {mode === 'create' ? 'Nueva empresa' : 'Editar empresa'}
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

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar" noValidate>
                    <div className="px-6 py-5 space-y-4">
                        <FormField
                            id="company"
                            label="Nombre de la empresa"
                            placeholder="Ej. Acme S.A."
                            value={form.company}
                            onChange={(v) => update('company', v)}
                            error={errors.company}
                        />
                        <FormField
                            id="admin"
                            label="Administrador"
                            placeholder="Ej. Ana Pérez"
                            value={form.admin}
                            onChange={(v) => update('admin', v)}
                            error={errors.admin}
                        />
                        <FormField
                            id="email"
                            label="Correo del administrador"
                            type="email"
                            placeholder="admin@empresa.com"
                            value={form.email}
                            onChange={(v) => update('email', v)}
                            error={errors.email}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="plan" className="block text-[13px] font-medium text-slate-700 mb-1.5">Plan</label>
                                <select
                                    id="plan"
                                    value={form.plan}
                                    onChange={(e) => update('plan', e.target.value as Tenant['plan'])}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
                                >
                                    <option value="PROFESSIONAL">Professional</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-[13px] font-medium text-slate-700 mb-1.5">Estado</label>
                                <select
                                    id="status"
                                    value={form.status}
                                    onChange={(e) => update('status', e.target.value as Tenant['status'])}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
                                >
                                    <option value="ACTIVE">Activo</option>
                                    <option value="SUSPENDED">Suspendido</option>
                                    <option value="PENDING">Pendiente</option>
                                </select>
                            </div>
                        </div>
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
                            className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsCheck2 size={13} />
                            {mode === 'create' ? 'Crear empresa' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

function FormField({
    id,
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">{label}</label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-invalid={!!error}
                className={`w-full h-10 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all ${error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                    }`}
            />
            {error && <p className="text-[12px] text-rose-600 mt-1.5">{error}</p>}
        </div>
    );
}
