import { useEffect, useMemo, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AnimatePresence, motion } from 'motion/react';
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
    BsKey,
    BsPersonDash,
    BsPersonCheck,
    BsPersonVcard,
    BsBuilding,
    BsClock,
    BsEnvelope,
    BsShieldLock,
    BsArrowRepeat,
} from 'react-icons/bs';

import Pagination from '../../../components/Pagination';
import ExportOverlay from '../../../components/ExportOverlay';
import ConfirmModal from '../../../components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { validateEmail, validateRequired } from '../../../utils/validators';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'employee' | 'client';
    tenant: string;
    status: 'active' | 'inactive';
    lastAccess: string;
    createdAt: string;
}

const INITIAL_USERS: UserData[] = [
    { id: 'U-001', name: 'Hans Weber', email: 'boss@europrint.de', role: 'admin', tenant: 'EuroPrint Hub', status: 'active', lastAccess: 'hace 2 h', createdAt: '2024-01-15' },
    { id: 'U-002', name: 'Anna Schmidt', email: 'anna@europrint.de', role: 'employee', tenant: 'EuroPrint Hub', status: 'active', lastAccess: 'hace 1 día', createdAt: '2024-02-10' },
    { id: 'U-003', name: 'Sarah Connor', email: 'admin@globalsign.co.uk', role: 'admin', tenant: 'Global Signage Ltd', status: 'active', lastAccess: 'hace 3 h', createdAt: '2024-02-20' },
    { id: 'U-004', name: 'Carlos Ruiz', email: 'info@madridpress.es', role: 'admin', tenant: 'Imprenta Madrid', status: 'inactive', lastAccess: 'hace 2 sem', createdAt: '2024-03-10' },
    { id: 'U-005', name: 'Emily Zhang', email: 'support@techgraph.com', role: 'admin', tenant: 'TechGraphics Inc', status: 'active', lastAccess: 'hace 30 min', createdAt: '2023-11-05' },
    { id: 'U-006', name: 'James Park', email: 'james@techgraph.com', role: 'employee', tenant: 'TechGraphics Inc', status: 'active', lastAccess: 'hace 1 h', createdAt: '2024-01-20' },
    { id: 'U-007', name: 'Maria Silva', email: 'maria@techgraph.com', role: 'employee', tenant: 'TechGraphics Inc', status: 'active', lastAccess: 'hace 5 h', createdAt: '2024-03-15' },
    { id: 'U-008', name: 'Marco Rossi', email: 'mkt@oceanic.it', role: 'admin', tenant: 'Oceanic Brands', status: 'active', lastAccess: 'hace 4 días', createdAt: '2024-06-01' },
    { id: 'U-009', name: 'Olaf Nilsen', email: 'olaf@nordicsigns.no', role: 'admin', tenant: 'Nordic Signs AS', status: 'active', lastAccess: 'hace 3 días', createdAt: '2024-04-18' },
    { id: 'U-010', name: 'Klaus Bauer', email: 'klaus@printforce.de', role: 'admin', tenant: 'PrintForce GmbH', status: 'active', lastAccess: 'hace 5 h', createdAt: '2024-01-28' },
    { id: 'U-011', name: 'Mia Thompson', email: 'mia@designworks.com.au', role: 'admin', tenant: 'DesignWorks AU', status: 'active', lastAccess: 'hace 1 h', createdAt: '2023-09-12' },
    { id: 'U-012', name: 'John Doe', email: 'john@customer.com', role: 'client', tenant: 'EuroPrint Hub', status: 'inactive', lastAccess: 'hace 1 mes', createdAt: '2024-05-22' },
];

const COMPANIES_LIST = [
    'EuroPrint Hub',
    'Global Signage Ltd',
    'Imprenta Madrid',
    'TechGraphics Inc',
    'Oceanic Brands',
    'Nordic Signs AS',
    'PrintForce GmbH',
    'DesignWorks AU',
];

const ROLE_LABEL: Record<UserData['role'], string> = {
    admin: 'Administrador',
    employee: 'Empleado',
    client: 'Cliente',
};

const STATUS_LABEL: Record<UserData['status'], { text: string; cls: string; dot: string }> = {
    active: { text: 'Activo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    inactive: { text: 'Inactivo', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

const ROLE_OPTIONS = [
    { value: 'ALL', label: 'Todos los roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'employee', label: 'Empleado' },
    { value: 'client', label: 'Cliente' },
] as const;

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'Todos los estados', dot: '' },
    { value: 'active', label: 'Activo', dot: 'bg-emerald-500' },
    { value: 'inactive', label: 'Inactivo', dot: 'bg-slate-400' },
] as const;

type ConfirmAction =
    | { kind: 'delete'; user: UserData }
    | { kind: 'toggle'; user: UserData }
    | { kind: 'reset'; user: UserData }
    | { kind: 'bulk-delete'; ids: string[] }
    | { kind: 'bulk-deactivate'; ids: string[] }
    | { kind: 'bulk-activate'; ids: string[] }
    | null;

type SortKey = 'name' | 'role' | 'tenant' | 'status' | 'lastAccess';
type SortDir = 'asc' | 'desc';

const ACCESS_WEIGHT: Record<string, number> = {
    'hace 30 min': 30,
    'hace 1 h': 60,
    'hace 2 h': 120,
    'hace 3 h': 180,
    'hace 5 h': 300,
    'hace 1 día': 1440,
    'hace 3 días': 4320,
    'hace 4 días': 5760,
    'hace 5 días': 7200,
    'hace 1 sem': 10080,
    'hace 2 sem': 20160,
    'hace 1 mes': 43200,
    Nunca: Number.MAX_SAFE_INTEGER,
};

function sortValue(user: UserData, key: SortKey): string | number {
    if (key === 'lastAccess') return ACCESS_WEIGHT[user.lastAccess] ?? Number.MAX_SAFE_INTEGER;
    if (key === 'role') return ROLE_LABEL[user.role];
    if (key === 'status') return user.status;
    if (key === 'name') return user.name.toLowerCase();
    return user.tenant.toLowerCase();
}

const getAvatarUrl = (name: string) =>
    `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;

export default function Users() {
    const { showToast } = useToast();

    const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [companyFilter, setCompanyFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [creatingUser, setCreatingUser] = useState(false);
    const [detailUser, setDetailUser] = useState<UserData | null>(null);
    const [confirm, setConfirm] = useState<ConfirmAction>(null);
    const [exporting, setExporting] = useState(false);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);

    const roleDropdownRef = useRef<HTMLDivElement>(null);
    const companyDropdownRef = useRef<HTMLDivElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node))
                setRoleDropdownOpen(false);
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node))
                setCompanyDropdownOpen(false);
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node))
                setStatusDropdownOpen(false);
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node))
                setActionMenuFor(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredUsers = useMemo(() => {
        const q = search.toLowerCase().trim();
        const filtered = users.filter((u) => {
            const matchSearch =
                !q ||
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.tenant.toLowerCase().includes(q);
            const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
            const matchCompany = companyFilter === 'ALL' || u.tenant === companyFilter;
            const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
            return matchSearch && matchRole && matchCompany && matchStatus;
        });

        const sorted = [...filtered].sort((a, b) => {
            const va = sortValue(a, sortKey);
            const vb = sortValue(b, sortKey);
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [users, search, roleFilter, companyFilter, statusFilter, sortKey, sortDir]);

    useEffect(() => setCurrentPage(1), [search, roleFilter, companyFilter, statusFilter]);

    // Drop selections that no longer exist after filtering or deletion
    useEffect(() => {
        const validIds = new Set(filteredUsers.map((u) => u.id));
        setSelectedIds((prev) => {
            const next = new Set<string>();
            prev.forEach((id) => validIds.has(id) && next.add(id));
            return next.size === prev.size ? prev : next;
        });
    }, [filteredUsers]);

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredUsers.slice(start, start + rowsPerPage);
    }, [filteredUsers, currentPage, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

    const stats = useMemo(
        () => ({
            total: users.length,
            admins: users.filter((u) => u.role === 'admin').length,
            employees: users.filter((u) => u.role === 'employee').length,
            active: users.filter((u) => u.status === 'active').length,
        }),
        [users],
    );

    const filtersActive =
        search.trim() !== '' || roleFilter !== 'ALL' || companyFilter !== 'ALL' || statusFilter !== 'ALL';

    const clearFilters = () => {
        setSearch('');
        setRoleFilter('ALL');
        setCompanyFilter('ALL');
        setStatusFilter('ALL');
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
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

    const performBulkDelete = (ids: string[]) => {
        setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
        clearSelection();
        showToast(`${ids.length} usuarios eliminados.`, 'success');
    };

    const performBulkSetStatus = (ids: string[], status: UserData['status']) => {
        setUsers((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, status } : u)));
        clearSelection();
        showToast(
            status === 'active'
                ? `${ids.length} usuarios reactivados.`
                : `${ids.length} usuarios desactivados.`,
            status === 'active' ? 'success' : 'warning',
        );
    };

    const performToggle = (id: string) => {
        const target = users.find((u) => u.id === id);
        if (!target) return;
        const next = target.status === 'active' ? 'inactive' : 'active';
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: next } : u)));
        showToast(
            next === 'active'
                ? `Usuario "${target.name}" reactivado.`
                : `Usuario "${target.name}" desactivado.`,
            next === 'active' ? 'success' : 'warning',
        );
    };

    const performDelete = (id: string) => {
        const target = users.find((u) => u.id === id);
        if (!target) return;
        setUsers((prev) => prev.filter((u) => u.id !== id));
        showToast(`Usuario "${target.name}" eliminado.`, 'success');
    };

    const performResetPassword = (user: UserData) => {
        showToast(`Se envió un correo a ${user.email} para restablecer la contraseña.`, 'success');
    };

    const handleCreate = (data: Omit<UserData, 'id' | 'createdAt' | 'lastAccess' | 'status'>) => {
        const id = `U-${String(users.length + 1).padStart(3, '0')}`;
        const newUser: UserData = {
            ...data,
            id,
            status: 'active',
            lastAccess: 'Nunca',
            createdAt: new Date().toISOString().split('T')[0],
        };
        setUsers((prev) => [newUser, ...prev]);
        showToast(`Usuario "${data.name}" creado correctamente.`, 'success');
    };

    const handleUpdate = (updated: UserData) => {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showToast(`Usuario "${updated.name}" actualizado.`, 'success');
    };

    const exportToExcel = async () => {
        setExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Usuarios');
            ws.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nombre', key: 'name', width: 24 },
                { header: 'Correo', key: 'email', width: 30 },
                { header: 'Rol', key: 'role', width: 16 },
                { header: 'Empresa', key: 'tenant', width: 24 },
                { header: 'Estado', key: 'status', width: 12 },
                { header: 'Último acceso', key: 'lastAccess', width: 16 },
                { header: 'Creado', key: 'createdAt', width: 14 },
            ];

            const headerRow = ws.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });
            headerRow.height = 22;

            filteredUsers.forEach((u) => {
                ws.addRow({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: ROLE_LABEL[u.role],
                    tenant: u.tenant,
                    status: STATUS_LABEL[u.status].text,
                    lastAccess: u.lastAccess,
                    createdAt: u.createdAt,
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            showToast('No fue posible exportar el archivo.', 'error');
            setExporting(false);
        }
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Archivo de usuarios exportado correctamente.', 'success');
    };

    const roleFilterLabel = ROLE_OPTIONS.find((o) => o.value === roleFilter)?.label ?? 'Todos los roles';
    const statusFilterLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'Todos los estados';
    const companyFilterLabel = companyFilter === 'ALL' ? 'Todas las empresas' : companyFilter;

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Usuarios
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Administra todos los usuarios de la plataforma a través de cualquier empresa.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                        <button
                            type="button"
                            onClick={exportToExcel}
                            disabled={filteredUsers.length === 0}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <BsDownload size={12} />
                            Exportar
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreatingUser(true)}
                            className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsPlus size={15} />
                            Nuevo usuario
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Total" value={stats.total} dot="bg-[#1e40af]" />
                    <StatCard label="Administradores" value={stats.admins} dot="bg-violet-500" />
                    <StatCard label="Empleados" value={stats.employees} dot="bg-sky-500" />
                    <StatCard label="Activos" value={stats.active} dot="bg-emerald-500" />
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
                            placeholder="Buscar por nombre, correo o empresa..."
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
                        <div className="relative" ref={roleDropdownRef}>
                            <FilterButton
                                label={roleFilterLabel}
                                active={roleFilter !== 'ALL'}
                                open={roleDropdownOpen}
                                onToggle={() => {
                                    setRoleDropdownOpen(!roleDropdownOpen);
                                    setCompanyDropdownOpen(false);
                                    setStatusDropdownOpen(false);
                                }}
                            />
                            {roleDropdownOpen && (
                                <DropdownMenu>
                                    {ROLE_OPTIONS.map((opt) => (
                                        <DropdownItem
                                            key={opt.value}
                                            label={opt.label}
                                            selected={roleFilter === opt.value}
                                            onClick={() => {
                                                setRoleFilter(opt.value);
                                                setRoleDropdownOpen(false);
                                            }}
                                        />
                                    ))}
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="relative" ref={companyDropdownRef}>
                            <FilterButton
                                label={companyFilterLabel}
                                active={companyFilter !== 'ALL'}
                                open={companyDropdownOpen}
                                onToggle={() => {
                                    setCompanyDropdownOpen(!companyDropdownOpen);
                                    setRoleDropdownOpen(false);
                                    setStatusDropdownOpen(false);
                                }}
                            />
                            {companyDropdownOpen && (
                                <DropdownMenu>
                                    <DropdownItem
                                        label="Todas las empresas"
                                        selected={companyFilter === 'ALL'}
                                        onClick={() => {
                                            setCompanyFilter('ALL');
                                            setCompanyDropdownOpen(false);
                                        }}
                                    />
                                    {COMPANIES_LIST.map((c) => (
                                        <DropdownItem
                                            key={c}
                                            label={c}
                                            selected={companyFilter === c}
                                            onClick={() => {
                                                setCompanyFilter(c);
                                                setCompanyDropdownOpen(false);
                                            }}
                                        />
                                    ))}
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="relative" ref={statusDropdownRef}>
                            <FilterButton
                                label={statusFilterLabel}
                                active={statusFilter !== 'ALL'}
                                open={statusDropdownOpen}
                                onToggle={() => {
                                    setStatusDropdownOpen(!statusDropdownOpen);
                                    setRoleDropdownOpen(false);
                                    setCompanyDropdownOpen(false);
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

                {/* Bulk action bar — animates in when there's a selection */}
                <AnimatePresence>
                    {selectedIds.size > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="bg-[#1e40af] text-white border border-[#1e3a8a] rounded-lg px-4 py-2 flex items-center justify-between gap-3"
                            role="region"
                            aria-label="Acciones masivas"
                        >
                            <div className="flex items-center gap-2 text-[13px]">
                                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded bg-white/15 font-semibold tabular-nums">
                                    {selectedIds.size}
                                </span>
                                <span className="font-medium">
                                    {selectedIds.size === 1 ? 'usuario seleccionado' : 'usuarios seleccionados'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BulkActionButton
                                    icon={<BsPersonCheck size={12} />}
                                    label="Activar"
                                    onClick={() =>
                                        setConfirm({ kind: 'bulk-activate', ids: Array.from(selectedIds) })
                                    }
                                />
                                <BulkActionButton
                                    icon={<BsPersonDash size={12} />}
                                    label="Desactivar"
                                    onClick={() =>
                                        setConfirm({ kind: 'bulk-deactivate', ids: Array.from(selectedIds) })
                                    }
                                />
                                <BulkActionButton
                                    icon={<BsTrash size={12} />}
                                    label="Eliminar"
                                    danger
                                    onClick={() =>
                                        setConfirm({ kind: 'bulk-delete', ids: Array.from(selectedIds) })
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    aria-label="Cancelar selección"
                                    className="ml-1 w-7 h-7 rounded hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                                >
                                    <BsX size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        {(() => {
                            const pageIds = paginatedUsers.map((u) => u.id);
                            const allPageChecked =
                                pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
                            const somePageChecked =
                                !allPageChecked && pageIds.some((id) => selectedIds.has(id));

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
                                            <SortableTh
                                                label="Usuario"
                                                sortKey="name"
                                                currentSort={sortKey}
                                                currentDir={sortDir}
                                                onSort={toggleSort}
                                            />
                                            <SortableTh
                                                label="Rol"
                                                sortKey="role"
                                                currentSort={sortKey}
                                                currentDir={sortDir}
                                                onSort={toggleSort}
                                            />
                                            <SortableTh
                                                label="Empresa"
                                                sortKey="tenant"
                                                currentSort={sortKey}
                                                currentDir={sortDir}
                                                onSort={toggleSort}
                                            />
                                            <SortableTh
                                                label="Estado"
                                                sortKey="status"
                                                currentSort={sortKey}
                                                currentDir={sortDir}
                                                onSort={toggleSort}
                                            />
                                            <SortableTh
                                                label="Último acceso"
                                                sortKey="lastAccess"
                                                currentSort={sortKey}
                                                currentDir={sortDir}
                                                onSort={toggleSort}
                                            />
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedUsers.map((user) => {
                                            const status = STATUS_LABEL[user.status];
                                            const isMenuOpen = actionMenuFor === user.id;
                                            const isSelected = selectedIds.has(user.id);

                                            return (
                                                <tr
                                                    key={user.id}
                                                    onClick={() => setDetailUser(user)}
                                                    className={`border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer ${isSelected ? 'bg-[#1e40af]/[0.03]' : 'hover:bg-slate-50/60'
                                                        }`}
                                                >
                                                    <td
                                                        className="pl-4 pr-2 py-2.5 w-9"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(user.id)}
                                                            aria-label={`Seleccionar ${user.name}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <img
                                                                src={getAvatarUrl(user.name)}
                                                                alt=""
                                                                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-[13px] font-semibold text-slate-900 truncate">{user.name}</p>
                                                                <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] font-medium text-slate-700">
                                                            {ROLE_LABEL[user.role]}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] text-slate-700">{user.tenant}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                            {status.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] text-slate-500">{user.lastAccess}</span>
                                                    </td>
                                                    <td
                                                        className="px-2 py-2.5 relative"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => setActionMenuFor(isMenuOpen ? null : user.id)}
                                                            aria-label={`Acciones de ${user.name}`}
                                                            className="w-7 h-7 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                                                        >
                                                            <BsThreeDots size={13} />
                                                        </button>
                                                        {isMenuOpen && (
                                                            <div
                                                                ref={actionMenuRef}
                                                                className="absolute right-2 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md overflow-hidden z-10"
                                                            >
                                                                <ActionMenuItem
                                                                    icon={<BsPencil size={12} />}
                                                                    label="Editar usuario"
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        setEditingUser(user);
                                                                    }}
                                                                />
                                                                <ActionMenuItem
                                                                    icon={user.status === 'active' ? <BsPersonDash size={12} /> : <BsPersonCheck size={12} />}
                                                                    label={user.status === 'active' ? 'Desactivar' : 'Reactivar'}
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        setConfirm({ kind: 'toggle', user });
                                                                    }}
                                                                />
                                                                <ActionMenuItem
                                                                    icon={<BsKey size={12} />}
                                                                    label="Restablecer contraseña"
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        setConfirm({ kind: 'reset', user });
                                                                    }}
                                                                />
                                                                <div className="border-t border-slate-100" />
                                                                <ActionMenuItem
                                                                    icon={<BsTrash size={12} />}
                                                                    label="Eliminar usuario"
                                                                    danger
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        setConfirm({ kind: 'delete', user });
                                                                    }}
                                                                />
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

                        {filteredUsers.length === 0 && (
                            <div className="px-6 py-16 flex flex-col items-center text-center">
                                <span className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                                    <BsPersonVcard size={16} />
                                </span>
                                <p className="text-[13px] font-medium text-slate-700">No se encontraron usuarios.</p>
                                <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
                                    {filtersActive
                                        ? 'Prueba ajustando los filtros o limpia la búsqueda.'
                                        : 'Crea el primer usuario con el botón superior.'}
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

                    {filteredUsers.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            rowsPerPage={rowsPerPage}
                            totalEntries={filteredUsers.length}
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
                {editingUser && (
                    <UserFormModal
                        mode="edit"
                        initial={editingUser}
                        onClose={() => setEditingUser(null)}
                        onSave={(data) => {
                            handleUpdate({ ...editingUser, ...data });
                            setEditingUser(null);
                        }}
                    />
                )}

                {creatingUser && (
                    <UserFormModal
                        mode="create"
                        onClose={() => setCreatingUser(false)}
                        onSave={(data) => {
                            handleCreate(data);
                            setCreatingUser(false);
                        }}
                    />
                )}

                {confirm?.kind === 'delete' && (
                    <ConfirmModal
                        title="Eliminar usuario"
                        description={`Esta acción eliminará permanentemente la cuenta de "${confirm.user.name}". No se puede deshacer.`}
                        confirmLabel="Confirmar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performDelete(confirm.user.id);
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'toggle' && (
                    <ConfirmModal
                        title={confirm.user.status === 'active' ? 'Desactivar usuario' : 'Reactivar usuario'}
                        description={
                            confirm.user.status === 'active'
                                ? `"${confirm.user.name}" perderá acceso a la plataforma hasta que vuelvas a reactivarlo.`
                                : `"${confirm.user.name}" podrá volver a iniciar sesión.`
                        }
                        confirmLabel={confirm.user.status === 'active' ? 'Desactivar' : 'Reactivar'}
                        variant={confirm.user.status === 'active' ? 'warning' : 'primary'}
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performToggle(confirm.user.id);
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'reset' && (
                    <ConfirmModal
                        title="Restablecer contraseña"
                        description={`Se enviará un correo a ${confirm.user.email} con instrucciones para que el usuario establezca una nueva contraseña.`}
                        confirmLabel="Enviar correo"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performResetPassword(confirm.user);
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'bulk-delete' && (
                    <ConfirmModal
                        title={`Eliminar ${confirm.ids.length} usuarios`}
                        description="Esta acción eliminará permanentemente las cuentas seleccionadas. No se puede deshacer."
                        confirmLabel="Confirmar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performBulkDelete(confirm.ids);
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'bulk-deactivate' && (
                    <ConfirmModal
                        title={`Desactivar ${confirm.ids.length} usuarios`}
                        description="Los usuarios seleccionados perderán acceso a la plataforma hasta que vuelvas a reactivarlos."
                        confirmLabel="Desactivar"
                        variant="warning"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performBulkSetStatus(confirm.ids, 'inactive');
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'bulk-activate' && (
                    <ConfirmModal
                        title={`Reactivar ${confirm.ids.length} usuarios`}
                        description="Los usuarios seleccionados podrán volver a iniciar sesión inmediatamente."
                        confirmLabel="Reactivar"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performBulkSetStatus(confirm.ids, 'active');
                            setConfirm(null);
                        }}
                    />
                )}

                {detailUser && (
                    <UserDetailDrawer
                        user={detailUser}
                        onClose={() => setDetailUser(null)}
                        onEdit={() => {
                            setDetailUser(null);
                            setEditingUser(detailUser);
                        }}
                        onToggle={() => {
                            setDetailUser(null);
                            setConfirm({ kind: 'toggle', user: detailUser });
                        }}
                        onReset={() => {
                            setDetailUser(null);
                            setConfirm({ kind: 'reset', user: detailUser });
                        }}
                        onDelete={() => {
                            setDetailUser(null);
                            setConfirm({ kind: 'delete', user: detailUser });
                        }}
                    />
                )}

                {exporting && (
                    <ExportOverlay
                        label="Exportando usuarios"
                        description={`Estamos preparando un archivo con ${filteredUsers.length} usuarios. No cierres esta ventana.`}
                        onComplete={handleExportComplete}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Stat card ---------- */

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
        <div className="absolute top-full left-0 mt-1 min-w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-200 rounded-md py-1 z-40">
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

function ActionMenuItem({
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
            className={`w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium transition-colors cursor-pointer ${danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            <span className={danger ? '' : 'text-slate-400'}>{icon}</span>
            {label}
        </button>
    );
}

/* ---------- User form modal ---------- */

interface UserFormData {
    name: string;
    email: string;
    role: UserData['role'];
    tenant: string;
}

function UserFormModal({
    mode,
    initial,
    onClose,
    onSave,
}: {
    mode: 'create' | 'edit';
    initial?: UserData;
    onClose: () => void;
    onSave: (data: UserFormData) => void;
}) {
    const { showToast } = useToast();
    const [form, setForm] = useState<UserFormData>({
        name: initial?.name ?? '',
        email: initial?.email ?? '',
        role: initial?.role ?? 'employee',
        tenant: initial?.tenant ?? COMPANIES_LIST[0],
    });
    const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const update = <K extends keyof UserFormData>(key: K, value: UserFormData[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = (): boolean => {
        const next: Partial<Record<keyof UserFormData, string>> = {};
        next.name = validateRequired(form.name, 'El nombre', 2);
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
            name: form.name.trim(),
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
                        {mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
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
                            id="name"
                            label="Nombre completo"
                            placeholder="Ej. Ana Pérez"
                            value={form.name}
                            onChange={(v) => update('name', v)}
                            error={errors.name}
                            autoComplete="name"
                        />
                        <FormField
                            id="email"
                            label="Correo electrónico"
                            type="email"
                            placeholder="usuario@empresa.com"
                            value={form.email}
                            onChange={(v) => update('email', v)}
                            error={errors.email}
                            autoComplete="email"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="role" className="block text-[13px] font-medium text-slate-700 mb-1.5">Rol</label>
                                <select
                                    id="role"
                                    value={form.role}
                                    onChange={(e) => update('role', e.target.value as UserData['role'])}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="employee">Empleado</option>
                                    <option value="client">Cliente</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="tenant" className="block text-[13px] font-medium text-slate-700 mb-1.5">Empresa</label>
                                <select
                                    id="tenant"
                                    value={form.tenant}
                                    onChange={(e) => update('tenant', e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
                                >
                                    {COMPANIES_LIST.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
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
                            {mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
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
    autoComplete,
}: {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    autoComplete?: string;
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
                autoComplete={autoComplete}
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

/* ---------- Checkbox ---------- */

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

/* ---------- Sortable column header ---------- */

function SortableTh({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
}: {
    label: string;
    sortKey: SortKey;
    currentSort: SortKey;
    currentDir: SortDir;
    onSort: (key: SortKey) => void;
}) {
    const isActive = currentSort === sortKey;

    return (
        <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${isActive ? 'text-slate-900' : 'hover:text-slate-700'
                    }`}
                aria-sort={isActive ? (currentDir === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
                {label}
                {isActive ? (
                    currentDir === 'asc' ? (
                        <BsChevronUp size={9} />
                    ) : (
                        <BsChevronDown size={9} />
                    )
                ) : (
                    <span className="opacity-30 group-hover:opacity-100">
                        <BsChevronDown size={9} />
                    </span>
                )}
            </button>
        </th>
    );
}

/* ---------- Bulk action button ---------- */

function BulkActionButton({
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
            className={`h-7 px-2.5 text-[12px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${danger
                    ? 'text-rose-100 hover:bg-rose-500/30'
                    : 'text-white/90 hover:bg-white/15'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

/* ---------- User detail drawer ---------- */

function UserDetailDrawer({
    user,
    onClose,
    onEdit,
    onToggle,
    onReset,
    onDelete,
}: {
    user: UserData;
    onClose: () => void;
    onEdit: () => void;
    onToggle: () => void;
    onReset: () => void;
    onDelete: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const status = STATUS_LABEL[user.status];
    const createdDate = new Date(user.createdAt).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    // Mock activity history
    const ACTIVITY = [
        { action: 'Inició sesión', detail: user.lastAccess, type: 'login' as const },
        { action: 'Actualizó su perfil', detail: 'hace 3 días', type: 'edit' as const },
        { action: 'Cambió de plan', detail: 'hace 1 semana', type: 'config' as const },
        { action: 'Cuenta creada', detail: createdDate, type: 'create' as const },
    ];

    const ACTIVITY_COLOR: Record<string, string> = {
        login: 'bg-emerald-500',
        edit: 'bg-[#1e40af]',
        config: 'bg-amber-500',
        create: 'bg-slate-400',
    };

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
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-slate-200 flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="drawer-title"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
                <header className="px-6 py-4 bg-[#1e40af] flex items-center justify-between shrink-0">
                    <h3 id="drawer-title" className="text-[15px] font-semibold text-white tracking-tight">
                        Detalle del usuario
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
                        <div className="flex items-start gap-3">
                            <img
                                src={getAvatarUrl(user.name)}
                                alt=""
                                className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <h4 className="text-[16px] font-semibold text-slate-900 tracking-tight truncate">
                                    {user.name}
                                </h4>
                                <p className="text-[12px] text-slate-500 font-mono truncate mt-0.5">{user.email}</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                        {status.text}
                                    </span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e40af]/10 text-[#1e40af] border border-[#1e40af]/15">
                                        {ROLE_LABEL[user.role]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info fields */}
                    <div className="px-6 py-4 border-b border-slate-100 space-y-3">
                        <DetailRow icon={<BsBuilding size={12} />} label="Empresa" value={user.tenant} />
                        <DetailRow icon={<BsShieldLock size={12} />} label="ID interno" value={user.id} mono />
                        <DetailRow icon={<BsClock size={12} />} label="Último acceso" value={user.lastAccess} />
                        <DetailRow icon={<BsEnvelope size={12} />} label="Cuenta creada" value={createdDate} />
                    </div>

                    {/* Activity */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Actividad reciente
                            </h5>
                            <span className="text-[10px] text-slate-400 font-mono">últimos 30 días</span>
                        </div>
                        <ul>
                            {ACTIVITY.map((item, i) => (
                                <li key={i} className="flex gap-3">
                                    <div className="flex flex-col items-center shrink-0">
                                        <span className={`w-1.5 h-1.5 rounded-full ${ACTIVITY_COLOR[item.type]} mt-1.5`} />
                                        {i !== ACTIVITY.length - 1 && (
                                            <span className="w-px flex-1 bg-slate-200 mt-1" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 pb-3">
                                        <p className="text-[13px] font-medium text-slate-900 leading-snug">{item.action}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{item.detail}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick actions */}
                    <div className="px-6 py-4">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Acciones
                        </h5>
                        <div className="space-y-1.5">
                            <DrawerActionButton
                                icon={<BsPencil size={13} />}
                                label="Editar usuario"
                                onClick={onEdit}
                            />
                            <DrawerActionButton
                                icon={user.status === 'active' ? <BsPersonDash size={13} /> : <BsPersonCheck size={13} />}
                                label={user.status === 'active' ? 'Desactivar usuario' : 'Reactivar usuario'}
                                onClick={onToggle}
                            />
                            <DrawerActionButton
                                icon={<BsArrowRepeat size={13} />}
                                label="Restablecer contraseña"
                                onClick={onReset}
                            />
                            <DrawerActionButton
                                icon={<BsTrash size={13} />}
                                label="Eliminar usuario"
                                onClick={onDelete}
                                danger
                            />
                        </div>
                    </div>
                </div>
            </motion.aside>
        </motion.div>
    );
}

function DetailRow({
    icon,
    label,
    value,
    mono,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
                <p
                    className={`text-[13px] text-slate-900 truncate mt-0.5 ${mono ? 'font-mono' : 'font-medium'
                        }`}
                >
                    {value}
                </p>
            </div>
        </div>
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
