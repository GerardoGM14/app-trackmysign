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
    BsDownload,
    BsThreeDots,
    BsPencil,
    BsTrash,
    BsKey,
    BsPersonDash,
    BsPersonCheck,
    BsPeople,
    BsBuilding,
    BsClock,
    BsEnvelope,
    BsShieldLock,
    BsArrowRepeat,
    BsExclamationTriangle,
    BsSend,
} from 'react-icons/bs';

import Pagination from '../../../components/Pagination';
import ExportOverlay from '../../../components/ExportOverlay';
import ConfirmModal from '../../../components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { usePlan } from '../../../hooks/usePlan';
import { validateEmail, validateRequired } from '../../../utils/validators';

interface Employee {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'employee';
    department: string;
    status: 'active' | 'invited' | 'inactive';
    lastAccess: string;
    invitedAt?: string;
    joinedAt?: string;
    documentsSigned: number;
}

const INITIAL_EMPLOYEES: Employee[] = [
    { id: 'E-001', name: 'Hans Weber', email: 'hans@miempresa.com', role: 'admin', department: 'Dirección', status: 'active', lastAccess: 'hace 2 h', joinedAt: '2024-01-15', documentsSigned: 84 },
    { id: 'E-002', name: 'Anna Schmidt', email: 'anna@miempresa.com', role: 'employee', department: 'Operaciones', status: 'active', lastAccess: 'hace 30 min', joinedAt: '2024-02-10', documentsSigned: 52 },
    { id: 'E-003', name: 'Diego Ramos', email: 'diego@miempresa.com', role: 'employee', department: 'Tecnología', status: 'active', lastAccess: 'hace 1 h', joinedAt: '2024-04-22', documentsSigned: 28 },
    { id: 'E-004', name: 'Lucía Vargas', email: 'lucia@miempresa.com', role: 'employee', department: 'Operaciones', status: 'active', lastAccess: 'hace 1 día', joinedAt: '2024-03-05', documentsSigned: 41 },
    { id: 'E-005', name: 'Carlos Méndez', email: 'carlos@miempresa.com', role: 'employee', department: 'Comercial', status: 'invited', lastAccess: 'Nunca', invitedAt: '2026-05-06', documentsSigned: 0 },
    { id: 'E-006', name: 'Patricia Rojas', email: 'patricia@miempresa.com', role: 'employee', department: 'Comercial', status: 'active', lastAccess: 'hace 5 h', joinedAt: '2024-05-18', documentsSigned: 17 },
    { id: 'E-007', name: 'Renato Silva', email: 'renato@miempresa.com', role: 'employee', department: 'Tecnología', status: 'inactive', lastAccess: 'hace 2 sem', joinedAt: '2024-01-30', documentsSigned: 12 },
    { id: 'E-008', name: 'María Torres', email: 'maria@miempresa.com', role: 'employee', department: 'Recursos Humanos', status: 'active', lastAccess: 'hace 4 h', joinedAt: '2024-06-01', documentsSigned: 35 },
    { id: 'E-009', name: 'Javier Castro', email: 'javier@miempresa.com', role: 'employee', department: 'Operaciones', status: 'invited', lastAccess: 'Nunca', invitedAt: '2026-05-07', documentsSigned: 0 },
];

const DEPARTMENTS = ['Dirección', 'Operaciones', 'Tecnología', 'Comercial', 'Recursos Humanos', 'Finanzas'];

const ROLE_LABEL: Record<Employee['role'], string> = {
    admin: 'Administrador',
    employee: 'Empleado',
};

const STATUS_LABEL: Record<Employee['status'], { text: string; cls: string; dot: string }> = {
    active: { text: 'Activo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    invited: { text: 'Invitado', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    inactive: { text: 'Inactivo', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

const ROLE_OPTIONS = [
    { value: 'ALL', label: 'Todos los roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'employee', label: 'Empleado' },
] as const;

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'Todos los estados', dot: '' },
    { value: 'active', label: 'Activo', dot: 'bg-emerald-500' },
    { value: 'invited', label: 'Invitado', dot: 'bg-amber-500' },
    { value: 'inactive', label: 'Inactivo', dot: 'bg-slate-400' },
] as const;

type SortKey = 'name' | 'role' | 'department' | 'status' | 'lastAccess';
type SortDir = 'asc' | 'desc';

const ACCESS_WEIGHT: Record<string, number> = {
    'hace 30 min': 30,
    'hace 1 h': 60,
    'hace 2 h': 120,
    'hace 4 h': 240,
    'hace 5 h': 300,
    'hace 1 día': 1440,
    'hace 2 sem': 20160,
    Nunca: Number.MAX_SAFE_INTEGER,
};

function sortValue(emp: Employee, key: SortKey): string | number {
    if (key === 'lastAccess') return ACCESS_WEIGHT[emp.lastAccess] ?? Number.MAX_SAFE_INTEGER;
    if (key === 'role') return ROLE_LABEL[emp.role];
    if (key === 'status') return emp.status;
    if (key === 'name') return emp.name.toLowerCase();
    return emp.department.toLowerCase();
}

type ConfirmAction =
    | { kind: 'delete'; emp: Employee }
    | { kind: 'toggle'; emp: Employee }
    | { kind: 'reset'; emp: Employee }
    | { kind: 'resend-invite'; emp: Employee }
    | { kind: 'bulk-delete'; ids: string[] }
    | { kind: 'bulk-deactivate'; ids: string[] }
    | { kind: 'bulk-activate'; ids: string[] }
    | null;

const getAvatarUrl = (name: string) =>
    `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;

export default function Employees() {
    const { showToast } = useToast();
    const { plan, planName } = usePlan();

    const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
    const [invitingEmp, setInvitingEmp] = useState(false);
    const [detailEmp, setDetailEmp] = useState<Employee | null>(null);
    const [confirm, setConfirm] = useState<ConfirmAction>(null);
    const [exporting, setExporting] = useState(false);

    const [roleOpen, setRoleOpen] = useState(false);
    const [departmentOpen, setDepartmentOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);

    const roleRef = useRef<HTMLDivElement>(null);
    const departmentRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false);
            if (departmentRef.current && !departmentRef.current.contains(e.target as Node)) setDepartmentOpen(false);
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setActionMenuFor(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredEmployees = useMemo(() => {
        const q = search.toLowerCase().trim();
        const filtered = employees.filter((e) => {
            const matchSearch =
                !q ||
                e.name.toLowerCase().includes(q) ||
                e.email.toLowerCase().includes(q) ||
                e.department.toLowerCase().includes(q);
            const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
            const matchDepartment = departmentFilter === 'ALL' || e.department === departmentFilter;
            const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
            return matchSearch && matchRole && matchDepartment && matchStatus;
        });

        return [...filtered].sort((a, b) => {
            const va = sortValue(a, sortKey);
            const vb = sortValue(b, sortKey);
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [employees, search, roleFilter, departmentFilter, statusFilter, sortKey, sortDir]);

    useEffect(() => setCurrentPage(1), [search, roleFilter, departmentFilter, statusFilter]);

    useEffect(() => {
        const validIds = new Set(filteredEmployees.map((e) => e.id));
        setSelectedIds((prev) => {
            const next = new Set<string>();
            prev.forEach((id) => validIds.has(id) && next.add(id));
            return next.size === prev.size ? prev : next;
        });
    }, [filteredEmployees]);

    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredEmployees.slice(start, start + rowsPerPage);
    }, [filteredEmployees, currentPage, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / rowsPerPage));

    const stats = useMemo(
        () => ({
            total: employees.length,
            active: employees.filter((e) => e.status === 'active').length,
            invited: employees.filter((e) => e.status === 'invited').length,
            inactive: employees.filter((e) => e.status === 'inactive').length,
        }),
        [employees],
    );

    // Plan limit awareness
    const activeCount = stats.active + stats.invited;
    const limit = plan.maxUsers;
    const isUnlimited = limit === -1;
    const atLimit = !isUnlimited && activeCount >= limit;
    const usagePct = isUnlimited ? 0 : Math.round((activeCount / limit) * 100);

    const filtersActive =
        search.trim() !== '' || roleFilter !== 'ALL' || departmentFilter !== 'ALL' || statusFilter !== 'ALL';

    const clearFilters = () => {
        setSearch('');
        setRoleFilter('ALL');
        setDepartmentFilter('ALL');
        setStatusFilter('ALL');
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else {
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

    const performToggle = (id: string) => {
        const target = employees.find((e) => e.id === id);
        if (!target) return;
        const next = target.status === 'active' ? 'inactive' : 'active';
        setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: next } : e)));
        showToast(
            next === 'active' ? `${target.name} reactivado.` : `${target.name} desactivado.`,
            next === 'active' ? 'success' : 'warning',
        );
    };

    const performDelete = (id: string) => {
        const target = employees.find((e) => e.id === id);
        if (!target) return;
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        showToast(`${target.name} eliminado del equipo.`, 'success');
    };

    const performResetPassword = (emp: Employee) => {
        showToast(`Se envió un correo a ${emp.email} para restablecer la contraseña.`, 'success');
    };

    const performResendInvite = (emp: Employee) => {
        showToast(`Invitación reenviada a ${emp.email}.`, 'success');
    };

    const handleInvite = (data: { name: string; email: string; role: Employee['role']; department: string }) => {
        if (atLimit) {
            showToast(`Has alcanzado el límite de ${limit} usuarios de tu plan ${planName}.`, 'warning');
            return;
        }
        const id = `E-${String(employees.length + 1).padStart(3, '0')}`;
        const newEmp: Employee = {
            id,
            ...data,
            status: 'invited',
            lastAccess: 'Nunca',
            invitedAt: new Date().toISOString().split('T')[0],
            documentsSigned: 0,
        };
        setEmployees((prev) => [newEmp, ...prev]);
        showToast(`Invitación enviada a ${data.email}.`, 'success');
    };

    const handleUpdate = (updated: Employee) => {
        setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        showToast(`${updated.name} actualizado.`, 'success');
    };

    const performBulkDelete = (ids: string[]) => {
        setEmployees((prev) => prev.filter((e) => !ids.includes(e.id)));
        clearSelection();
        showToast(`${ids.length} empleados eliminados.`, 'success');
    };

    const performBulkSetStatus = (ids: string[], status: Employee['status']) => {
        setEmployees((prev) => prev.map((e) => (ids.includes(e.id) ? { ...e, status } : e)));
        clearSelection();
        showToast(
            status === 'active'
                ? `${ids.length} empleados reactivados.`
                : `${ids.length} empleados desactivados.`,
            status === 'active' ? 'success' : 'warning',
        );
    };

    const exportToExcel = async () => {
        setExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Empleados');
            ws.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nombre', key: 'name', width: 24 },
                { header: 'Correo', key: 'email', width: 30 },
                { header: 'Rol', key: 'role', width: 16 },
                { header: 'Departamento', key: 'department', width: 22 },
                { header: 'Estado', key: 'status', width: 12 },
                { header: 'Documentos firmados', key: 'documentsSigned', width: 18 },
                { header: 'Último acceso', key: 'lastAccess', width: 16 },
                { header: 'Fecha de ingreso', key: 'joinedAt', width: 16 },
            ];

            const headerRow = ws.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });
            headerRow.height = 22;

            filteredEmployees.forEach((e) => {
                ws.addRow({
                    id: e.id,
                    name: e.name,
                    email: e.email,
                    role: ROLE_LABEL[e.role],
                    department: e.department,
                    status: STATUS_LABEL[e.status].text,
                    documentsSigned: e.documentsSigned,
                    lastAccess: e.lastAccess,
                    joinedAt: e.joinedAt ?? '—',
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `empleados_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            showToast('No fue posible exportar el archivo.', 'error');
            setExporting(false);
        }
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Archivo de empleados exportado correctamente.', 'success');
    };

    const roleFilterLabel = ROLE_OPTIONS.find((o) => o.value === roleFilter)?.label ?? 'Todos los roles';
    const statusFilterLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'Todos los estados';
    const departmentFilterLabel = departmentFilter === 'ALL' ? 'Todos los departamentos' : departmentFilter;

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Empleados
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Invita, gestiona roles y administra los miembros de tu organización.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                        <button
                            type="button"
                            onClick={exportToExcel}
                            disabled={filteredEmployees.length === 0}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <BsDownload size={12} />
                            Exportar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (atLimit) {
                                    showToast(
                                        `Has alcanzado el límite de ${limit} usuarios de tu plan ${planName}.`,
                                        'warning',
                                    );
                                    return;
                                }
                                setInvitingEmp(true);
                            }}
                            className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsSend size={12} />
                            Invitar empleado
                        </button>
                    </div>
                </header>

                {/* Plan usage banner */}
                {!isUnlimited && (
                    <div
                        className={`border rounded-lg px-4 py-3 flex items-center gap-3 ${atLimit
                                ? 'bg-rose-50 border-rose-200'
                                : usagePct >= 80
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-slate-50 border-slate-200'
                            }`}
                    >
                        <span
                            className={`shrink-0 ${atLimit ? 'text-rose-600' : usagePct >= 80 ? 'text-amber-600' : 'text-slate-500'
                                }`}
                        >
                            <BsExclamationTriangle size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-[13px] font-medium ${atLimit ? 'text-rose-900' : usagePct >= 80 ? 'text-amber-900' : 'text-slate-900'
                                    }`}
                            >
                                {atLimit
                                    ? `Has alcanzado el límite del plan ${planName}.`
                                    : `Estás usando ${activeCount} de ${limit} usuarios disponibles.`}
                            </p>
                            <p
                                className={`text-[11px] mt-0.5 ${atLimit ? 'text-rose-700' : usagePct >= 80 ? 'text-amber-700' : 'text-slate-500'
                                    }`}
                            >
                                {atLimit
                                    ? 'Desactiva o elimina empleados para liberar cupos, o actualiza tu plan.'
                                    : `Plan ${planName} permite hasta ${limit} usuarios activos o invitados.`}
                            </p>
                        </div>
                        <div className="hidden sm:block w-32 shrink-0">
                            <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden border border-slate-200">
                                <div
                                    className={`h-full rounded-full transition-[width] duration-500 ${atLimit ? 'bg-rose-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-[#1e40af]'
                                        }`}
                                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 text-right tabular-nums">
                                {usagePct}%
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Total" value={stats.total} dot="bg-[#1e40af]" />
                    <StatCard label="Activos" value={stats.active} dot="bg-emerald-500" />
                    <StatCard label="Invitados" value={stats.invited} dot="bg-amber-500" />
                    <StatCard label="Inactivos" value={stats.inactive} dot="bg-slate-400" />
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col lg:flex-row gap-2.5">
                    <div className="relative flex-1 min-w-[220px]">
                        <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, correo o departamento..."
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
                        <div className="relative" ref={roleRef}>
                            <FilterButton
                                label={roleFilterLabel}
                                active={roleFilter !== 'ALL'}
                                open={roleOpen}
                                onToggle={() => {
                                    setRoleOpen(!roleOpen);
                                    setDepartmentOpen(false);
                                    setStatusOpen(false);
                                }}
                            />
                            {roleOpen && (
                                <DropdownMenu>
                                    {ROLE_OPTIONS.map((opt) => (
                                        <DropdownItem
                                            key={opt.value}
                                            label={opt.label}
                                            selected={roleFilter === opt.value}
                                            onClick={() => {
                                                setRoleFilter(opt.value);
                                                setRoleOpen(false);
                                            }}
                                        />
                                    ))}
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="relative" ref={departmentRef}>
                            <FilterButton
                                label={departmentFilterLabel}
                                active={departmentFilter !== 'ALL'}
                                open={departmentOpen}
                                onToggle={() => {
                                    setDepartmentOpen(!departmentOpen);
                                    setRoleOpen(false);
                                    setStatusOpen(false);
                                }}
                            />
                            {departmentOpen && (
                                <DropdownMenu>
                                    <DropdownItem
                                        label="Todos los departamentos"
                                        selected={departmentFilter === 'ALL'}
                                        onClick={() => {
                                            setDepartmentFilter('ALL');
                                            setDepartmentOpen(false);
                                        }}
                                    />
                                    {DEPARTMENTS.map((d) => (
                                        <DropdownItem
                                            key={d}
                                            label={d}
                                            selected={departmentFilter === d}
                                            onClick={() => {
                                                setDepartmentFilter(d);
                                                setDepartmentOpen(false);
                                            }}
                                        />
                                    ))}
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="relative" ref={statusRef}>
                            <FilterButton
                                label={statusFilterLabel}
                                active={statusFilter !== 'ALL'}
                                open={statusOpen}
                                onToggle={() => {
                                    setStatusOpen(!statusOpen);
                                    setRoleOpen(false);
                                    setDepartmentOpen(false);
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

                {/* Bulk action bar */}
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
                                    {selectedIds.size === 1 ? 'empleado seleccionado' : 'empleados seleccionados'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BulkActionButton
                                    icon={<BsPersonCheck size={12} />}
                                    label="Activar"
                                    onClick={() => setConfirm({ kind: 'bulk-activate', ids: Array.from(selectedIds) })}
                                />
                                <BulkActionButton
                                    icon={<BsPersonDash size={12} />}
                                    label="Desactivar"
                                    onClick={() => setConfirm({ kind: 'bulk-deactivate', ids: Array.from(selectedIds) })}
                                />
                                <BulkActionButton
                                    icon={<BsTrash size={12} />}
                                    label="Eliminar"
                                    danger
                                    onClick={() => setConfirm({ kind: 'bulk-delete', ids: Array.from(selectedIds) })}
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
                            const pageIds = paginatedEmployees.map((e) => e.id);
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
                                            <SortableTh label="Empleado" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <SortableTh label="Rol" sortKey="role" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <SortableTh label="Departamento" sortKey="department" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <SortableTh label="Estado" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider text-right">Firmas</th>
                                            <SortableTh label="Último acceso" sortKey="lastAccess" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedEmployees.map((emp) => {
                                            const status = STATUS_LABEL[emp.status];
                                            const isMenuOpen = actionMenuFor === emp.id;
                                            const isSelected = selectedIds.has(emp.id);

                                            return (
                                                <tr
                                                    key={emp.id}
                                                    onClick={() => setDetailEmp(emp)}
                                                    className={`border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer ${isSelected ? 'bg-[#1e40af]/[0.03]' : 'hover:bg-slate-50/60'
                                                        }`}
                                                >
                                                    <td className="pl-4 pr-2 py-2.5 w-9" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(emp.id)}
                                                            aria-label={`Seleccionar ${emp.name}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <img
                                                                src={getAvatarUrl(emp.name)}
                                                                alt=""
                                                                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-[13px] font-semibold text-slate-900 truncate">{emp.name}</p>
                                                                <p className="text-[11px] text-slate-500 font-mono truncate">{emp.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] font-medium text-slate-700">{ROLE_LABEL[emp.role]}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] text-slate-700">{emp.department}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                            {status.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        <span className="text-[12px] font-mono tabular-nums text-slate-700">{emp.documentsSigned}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] text-slate-500">{emp.lastAccess}</span>
                                                    </td>
                                                    <td className="px-2 py-2.5 relative" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActionMenuFor(isMenuOpen ? null : emp.id)}
                                                            aria-label={`Acciones de ${emp.name}`}
                                                            className="w-7 h-7 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                                                        >
                                                            <BsThreeDots size={13} />
                                                        </button>
                                                        {isMenuOpen && (
                                                            <div ref={actionMenuRef} className="absolute right-2 top-full mt-1 w-52 bg-white border border-slate-200 rounded-md overflow-hidden z-10">
                                                                <ActionMenuItem
                                                                    icon={<BsPencil size={12} />}
                                                                    label="Editar empleado"
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        setEditingEmp(emp);
                                                                    }}
                                                                />
                                                                {emp.status === 'invited' && (
                                                                    <ActionMenuItem
                                                                        icon={<BsArrowRepeat size={12} />}
                                                                        label="Reenviar invitación"
                                                                        onClick={() => {
                                                                            setActionMenuFor(null);
                                                                            setConfirm({ kind: 'resend-invite', emp });
                                                                        }}
                                                                    />
                                                                )}
                                                                {emp.status !== 'invited' && (
                                                                    <ActionMenuItem
                                                                        icon={emp.status === 'active' ? <BsPersonDash size={12} /> : <BsPersonCheck size={12} />}
                                                                        label={emp.status === 'active' ? 'Desactivar' : 'Reactivar'}
                                                                        onClick={() => {
                                                                            setActionMenuFor(null);
                                                                            setConfirm({ kind: 'toggle', emp });
                                                                        }}
                                                                    />
                                                                )}
                                                                <ActionMenuItem
                                                                    icon={<BsKey size={12} />}
                                                                    label="Restablecer contraseña"
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        setConfirm({ kind: 'reset', emp });
                                                                    }}
                                                                />
                                                                <div className="border-t border-slate-100" />
                                                                <ActionMenuItem
                                                                    icon={<BsTrash size={12} />}
                                                                    label="Eliminar del equipo"
                                                                    danger
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        setConfirm({ kind: 'delete', emp });
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

                        {filteredEmployees.length === 0 && (
                            <div className="px-6 py-16 flex flex-col items-center text-center">
                                <span className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                                    <BsPeople size={16} />
                                </span>
                                <p className="text-[13px] font-medium text-slate-700">No se encontraron empleados.</p>
                                <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
                                    {filtersActive
                                        ? 'Prueba ajustando los filtros o limpia la búsqueda.'
                                        : 'Invita al primer empleado con el botón superior.'}
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

                    {filteredEmployees.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            rowsPerPage={rowsPerPage}
                            totalEntries={filteredEmployees.length}
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
                {editingEmp && (
                    <EmployeeFormModal
                        mode="edit"
                        initial={editingEmp}
                        onClose={() => setEditingEmp(null)}
                        onSave={(data) => {
                            handleUpdate({ ...editingEmp, ...data });
                            setEditingEmp(null);
                        }}
                    />
                )}

                {invitingEmp && (
                    <EmployeeFormModal
                        mode="invite"
                        onClose={() => setInvitingEmp(false)}
                        onSave={(data) => {
                            handleInvite(data);
                            setInvitingEmp(false);
                        }}
                    />
                )}

                {confirm?.kind === 'delete' && (
                    <ConfirmModal
                        title="Eliminar empleado"
                        description={`Esta acción eliminará permanentemente a "${confirm.emp.name}" del equipo. No se puede deshacer.`}
                        confirmLabel="Confirmar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performDelete(confirm.emp.id);
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'toggle' && (
                    <ConfirmModal
                        title={confirm.emp.status === 'active' ? 'Desactivar empleado' : 'Reactivar empleado'}
                        description={
                            confirm.emp.status === 'active'
                                ? `"${confirm.emp.name}" perderá acceso a la plataforma hasta que vuelvas a reactivarlo.`
                                : `"${confirm.emp.name}" podrá volver a iniciar sesión y firmar documentos.`
                        }
                        confirmLabel={confirm.emp.status === 'active' ? 'Desactivar' : 'Reactivar'}
                        variant={confirm.emp.status === 'active' ? 'warning' : 'primary'}
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performToggle(confirm.emp.id);
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'reset' && (
                    <ConfirmModal
                        title="Restablecer contraseña"
                        description={`Se enviará un correo a ${confirm.emp.email} con instrucciones para que el empleado establezca una nueva contraseña.`}
                        confirmLabel="Enviar correo"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performResetPassword(confirm.emp);
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'resend-invite' && (
                    <ConfirmModal
                        title="Reenviar invitación"
                        description={`Se enviará nuevamente la invitación a ${confirm.emp.email}.`}
                        confirmLabel="Reenviar"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performResendInvite(confirm.emp);
                            setConfirm(null);
                        }}
                    />
                )}

                {confirm?.kind === 'bulk-delete' && (
                    <ConfirmModal
                        title={`Eliminar ${confirm.ids.length} empleados`}
                        description="Esta acción eliminará permanentemente a los empleados seleccionados. No se puede deshacer."
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
                        title={`Desactivar ${confirm.ids.length} empleados`}
                        description="Los empleados seleccionados perderán acceso a la plataforma hasta que vuelvas a reactivarlos."
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
                        title={`Reactivar ${confirm.ids.length} empleados`}
                        description="Los empleados seleccionados podrán volver a iniciar sesión inmediatamente."
                        confirmLabel="Reactivar"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performBulkSetStatus(confirm.ids, 'active');
                            setConfirm(null);
                        }}
                    />
                )}

                {detailEmp && (
                    <EmployeeDetailDrawer
                        emp={detailEmp}
                        onClose={() => setDetailEmp(null)}
                        onEdit={() => {
                            setDetailEmp(null);
                            setEditingEmp(detailEmp);
                        }}
                        onToggle={() => {
                            setDetailEmp(null);
                            setConfirm({ kind: 'toggle', emp: detailEmp });
                        }}
                        onReset={() => {
                            setDetailEmp(null);
                            setConfirm({ kind: 'reset', emp: detailEmp });
                        }}
                        onResendInvite={() => {
                            setDetailEmp(null);
                            setConfirm({ kind: 'resend-invite', emp: detailEmp });
                        }}
                        onDelete={() => {
                            setDetailEmp(null);
                            setConfirm({ kind: 'delete', emp: detailEmp });
                        }}
                    />
                )}

                {exporting && (
                    <ExportOverlay
                        label="Exportando empleados"
                        description={`Estamos preparando un archivo con ${filteredEmployees.length} empleados.`}
                        onComplete={handleExportComplete}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Stat ---------- */

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

/* ---------- Filters & dropdowns ---------- */

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

function BulkActionButton({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-7 px-2.5 text-[12px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${danger ? 'text-rose-100 hover:bg-rose-500/30' : 'text-white/90 hover:bg-white/15'
                }`}
        >
            {icon}
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

/* ---------- Detail drawer ---------- */

function EmployeeDetailDrawer({
    emp,
    onClose,
    onEdit,
    onToggle,
    onReset,
    onResendInvite,
    onDelete,
}: {
    emp: Employee;
    onClose: () => void;
    onEdit: () => void;
    onToggle: () => void;
    onReset: () => void;
    onResendInvite: () => void;
    onDelete: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const status = STATUS_LABEL[emp.status];

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
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
                <header className="px-6 py-4 bg-[#1e40af] flex items-center justify-between shrink-0">
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">Detalle del empleado</h3>
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
                    <div className="px-6 py-5 border-b border-slate-100">
                        <div className="flex items-start gap-3">
                            <img
                                src={getAvatarUrl(emp.name)}
                                alt=""
                                className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <h4 className="text-[16px] font-semibold text-slate-900 tracking-tight truncate">{emp.name}</h4>
                                <p className="text-[12px] text-slate-500 font-mono truncate mt-0.5">{emp.email}</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                        {status.text}
                                    </span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e40af]/10 text-[#1e40af] border border-[#1e40af]/15">
                                        {ROLE_LABEL[emp.role]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="border border-slate-200 rounded-md px-3 py-2.5">
                                <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Documentos firmados</p>
                                <p className="text-[20px] font-semibold text-slate-900 tracking-tight tabular-nums mt-1">
                                    {emp.documentsSigned}
                                </p>
                            </div>
                            <div className="border border-slate-200 rounded-md px-3 py-2.5">
                                <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Último acceso</p>
                                <p className="text-[13px] font-medium text-slate-900 mt-1 truncate">{emp.lastAccess}</p>
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="px-6 py-4 border-b border-slate-100 space-y-3">
                        <DetailRow icon={<BsBuilding size={12} />} label="Departamento" value={emp.department} />
                        <DetailRow icon={<BsShieldLock size={12} />} label="ID interno" value={emp.id} mono />
                        {emp.joinedAt && (
                            <DetailRow icon={<BsClock size={12} />} label="Fecha de ingreso" value={emp.joinedAt} mono />
                        )}
                        {emp.invitedAt && !emp.joinedAt && (
                            <DetailRow icon={<BsEnvelope size={12} />} label="Invitación enviada" value={emp.invitedAt} mono />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones</h5>
                        <div className="space-y-1.5">
                            <DrawerActionButton icon={<BsPencil size={13} />} label="Editar empleado" onClick={onEdit} />
                            {emp.status === 'invited' ? (
                                <DrawerActionButton icon={<BsArrowRepeat size={13} />} label="Reenviar invitación" onClick={onResendInvite} />
                            ) : (
                                <DrawerActionButton
                                    icon={emp.status === 'active' ? <BsPersonDash size={13} /> : <BsPersonCheck size={13} />}
                                    label={emp.status === 'active' ? 'Desactivar empleado' : 'Reactivar empleado'}
                                    onClick={onToggle}
                                />
                            )}
                            <DrawerActionButton icon={<BsKey size={13} />} label="Restablecer contraseña" onClick={onReset} />
                            <DrawerActionButton icon={<BsTrash size={13} />} label="Eliminar del equipo" onClick={onDelete} danger />
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
            <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
                <p className={`text-[13px] text-slate-900 truncate mt-0.5 ${mono ? 'font-mono' : 'font-medium'}`}>
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

/* ---------- Form modal (invite + edit) ---------- */

interface EmployeeFormData {
    name: string;
    email: string;
    role: Employee['role'];
    department: string;
}

function EmployeeFormModal({
    mode,
    initial,
    onClose,
    onSave,
}: {
    mode: 'invite' | 'edit';
    initial?: Employee;
    onClose: () => void;
    onSave: (data: EmployeeFormData) => void;
}) {
    const { showToast } = useToast();
    const [form, setForm] = useState<EmployeeFormData>({
        name: initial?.name ?? '',
        email: initial?.email ?? '',
        role: initial?.role ?? 'employee',
        department: initial?.department ?? DEPARTMENTS[0],
    });
    const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const update = <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = (): boolean => {
        const next: Partial<Record<keyof EmployeeFormData, string>> = {};
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
                        {mode === 'invite' ? 'Invitar empleado' : 'Editar empleado'}
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
                            placeholder="usuario@miempresa.com"
                            value={form.email}
                            onChange={(v) => update('email', v)}
                            error={errors.email}
                            autoComplete="email"
                            disabled={mode === 'edit'}
                            hint={mode === 'edit' ? 'No editable' : undefined}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="role" className="block text-[13px] font-medium text-slate-700 mb-1.5">Rol</label>
                                <select
                                    id="role"
                                    value={form.role}
                                    onChange={(e) => update('role', e.target.value as Employee['role'])}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="employee">Empleado</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="department" className="block text-[13px] font-medium text-slate-700 mb-1.5">Departamento</label>
                                <select
                                    id="department"
                                    value={form.department}
                                    onChange={(e) => update('department', e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
                                >
                                    {DEPARTMENTS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {mode === 'invite' && (
                            <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 flex items-start gap-2.5">
                                <span className="text-[#1e40af] shrink-0 mt-0.5">
                                    <BsEnvelope size={13} />
                                </span>
                                <div>
                                    <p className="text-[12.5px] font-medium text-slate-900">Se enviará una invitación por correo</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                        El empleado recibirá un enlace para configurar su contraseña y acceder a la plataforma.
                                    </p>
                                </div>
                            </div>
                        )}
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
                            {mode === 'invite' ? <BsSend size={12} /> : <BsCheck2 size={13} />}
                            {mode === 'invite' ? 'Enviar invitación' : 'Guardar cambios'}
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
    disabled,
    hint,
}: {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    autoComplete?: string;
    disabled?: boolean;
    hint?: string;
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
                disabled={disabled}
                aria-invalid={!!error}
                className={`w-full h-10 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:bg-slate-50 ${error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                    }`}
            />
            {error && <p className="text-[12px] text-rose-600 mt-1.5">{error}</p>}
            {!error && hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
        </div>
    );
}
