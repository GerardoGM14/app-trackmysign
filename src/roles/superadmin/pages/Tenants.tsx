import { useState, useRef, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../../components/Pagination';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import { RiFileExcel2Line } from 'react-icons/ri';
import {
    BsSearch,
    BsPencil,
    BsTrash,
    BsPause,
    BsPlay,
    BsX,
    BsCheck2,
    BsChevronRight,
    BsGrid1X2,
    BsCreditCard,
    BsCircle,
    BsChevronDown
} from 'react-icons/bs';

// --- MOCK DATA ---
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
    { id: 'T-001', company: 'EuroPrint Hub', admin: 'Hans Weber', email: 'boss@europrint.de', plan: 'ENTERPRISE', status: 'ACTIVE', users: 84, storage: '128 GB', createdAt: '2024-01-15', lastLogin: '2 hours ago' },
    { id: 'T-002', company: 'Global Signage Ltd', admin: 'Sarah Connor', email: 'admin@globalsign.co.uk', plan: 'PROFESSIONAL', status: 'ACTIVE', users: 42, storage: '64 GB', createdAt: '2024-02-20', lastLogin: '1 day ago' },
    { id: 'T-003', company: 'Imprenta Madrid', admin: 'Carlos Ruiz', email: 'info@madridpress.es', plan: 'PROFESSIONAL', status: 'SUSPENDED', users: 12, storage: '16 GB', createdAt: '2024-03-10', lastLogin: '2 weeks ago' },
    { id: 'T-004', company: 'TechGraphics Inc', admin: 'Emily Zhang', email: 'support@techgraph.com', plan: 'ENTERPRISE', status: 'ACTIVE', users: 156, storage: '256 GB', createdAt: '2023-11-05', lastLogin: '30 min ago' },
    { id: 'T-005', company: 'Oceanic Brands', admin: 'Marco Rossi', email: 'mkt@oceanic.it', plan: 'PROFESSIONAL', status: 'PENDING', users: 0, storage: '0 GB', createdAt: '2024-06-01', lastLogin: 'Never' },
    { id: 'T-006', company: 'Nordic Signs AS', admin: 'Olaf Nilsen', email: 'olaf@nordicsigns.no', plan: 'PROFESSIONAL', status: 'ACTIVE', users: 8, storage: '8 GB', createdAt: '2024-04-18', lastLogin: '3 days ago' },
    { id: 'T-007', company: 'PrintForce GmbH', admin: 'Klaus Bauer', email: 'klaus@printforce.de', plan: 'PROFESSIONAL', status: 'ACTIVE', users: 35, storage: '48 GB', createdAt: '2024-01-28', lastLogin: '5 hours ago' },
    { id: 'T-008', company: 'DesignWorks AU', admin: 'Mia Thompson', email: 'mia@designworks.com.au', plan: 'ENTERPRISE', status: 'ACTIVE', users: 92, storage: '180 GB', createdAt: '2023-09-12', lastLogin: '1 hour ago' },
];



export default function Tenants() {
    const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const planDropdownRef = useRef<HTMLDivElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (planDropdownRef.current && !planDropdownRef.current.contains(e.target as Node)) setPlanDropdownOpen(false);
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) setStatusDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Filtering
    const filteredTenants = useMemo(() => {
        return tenants.filter(t => {
            const matchSearch = t.company.toLowerCase().includes(search.toLowerCase()) ||
                t.email.toLowerCase().includes(search.toLowerCase()) ||
                t.admin.toLowerCase().includes(search.toLowerCase());
            const matchPlan = planFilter === 'ALL' || t.plan === planFilter;
            const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
            return matchSearch && matchPlan && matchStatus;
        });
    }, [tenants, search, planFilter, statusFilter]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, planFilter, statusFilter]);

    const paginatedTenants = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredTenants.slice(start, start + rowsPerPage);
    }, [filteredTenants, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredTenants.length / rowsPerPage);



    const toggleStatus = (id: string) => {
        setTenants(tenants.map(t =>
            t.id === id ? { ...t, status: t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : t
        ));
    };

    const deleteTenant = (id: string) => {
        setTenants(tenants.filter(t => t.id !== id));
    };

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tenants Report');

        // Define columns
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 12 },
            { header: 'Company', key: 'company', width: 25 },
            { header: 'Admin', key: 'admin', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Plan', key: 'plan', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Users', key: 'users', width: 10 },
            { header: 'Storage', key: 'storage', width: 12 },
            { header: 'Last Login', key: 'lastLogin', width: 15 }
        ];

        // Header Styling
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { name: 'Segoe UI', family: 4, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E293B' } // Slate 900
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF334155' } },
                bottom: { style: 'thin', color: { argb: 'FF334155' } },
                left: { style: 'thin', color: { argb: 'FF334155' } },
                right: { style: 'thin', color: { argb: 'FF334155' } }
            };
        });
        headerRow.height = 25;

        // Add Data
        filteredTenants.forEach((t) => {
            const row = worksheet.addRow({
                id: t.id,
                company: t.company,
                admin: t.admin,
                email: t.email,
                plan: t.plan,
                status: t.status,
                users: t.users,
                storage: t.storage,
                lastLogin: t.lastLogin
            });

            // Row Styling
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
                cell.alignment = { vertical: 'middle', horizontal: colNumber === 7 ? 'center' : 'left' };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } }
                };
            });
            row.height = 22;
        });

        // Generate Buffer and save
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Tenants_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const updateTenant = () => {
        if (!editingTenant) return;
        setTenants(tenants.map(t => t.id === editingTenant.id ? editingTenant : t));
        setEditingTenant(null);
    };



    const getPlanStyle = (p: string) => {
        switch (p) {
            case 'ENTERPRISE': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'PROFESSIONAL': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const navigate = useNavigate();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-slate-400 font-medium mb-2">
                <BsGrid1X2 size={12} />
                <span
                    className="hover:text-blue-600 cursor-pointer transition-colors"
                    onClick={() => navigate("/dashboard")}
                >
                    Overview
                </span>
                <BsChevronRight size={10} />
                <span className="text-slate-700">Tenants</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                        Tenant Management
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Manage all organizations subscribed to your platform.
                    </p>
                </div>

                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm active:scale-95 self-start sm:self-auto cursor-pointer group"
                >
                    <RiFileExcel2Line
                        size={18}
                        className="group-hover:scale-110 transition-transform"
                    />
                    Download Report
                </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <BsSearch
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={14}
                    />
                    <input
                        type="text"
                        placeholder="Search by company, admin or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="flex gap-2">
                    {/* Plan Filter Dropdown */}
                    <div className="relative" ref={planDropdownRef}>
                        <button
                            onClick={() => {
                                setPlanDropdownOpen(!planDropdownOpen);
                                setStatusDropdownOpen(false);
                            }}
                            className={`flex items-center gap-2 pl-3 pr-8 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-600 cursor-pointer transition-colors min-w-[140px] ${planDropdownOpen
                                ? "border-blue-500"
                                : "border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            <BsCreditCard size={14} className="text-slate-400" />
                            <span>
                                {planFilter === "ALL"
                                    ? "All Plans"
                                    : planFilter === "ENTERPRISE"
                                        ? "Enterprise"
                                        : "Professional"}
                            </span>
                            <BsChevronDown
                                size={10}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </button>

                        {planDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-40">
                                {[
                                    { value: "ALL", label: "All Plans" },
                                    { value: "ENTERPRISE", label: "Enterprise" },
                                    { value: "PROFESSIONAL", label: "Professional" },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setPlanFilter(opt.value);
                                            setPlanDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm cursor-pointer rounded-lg mx-auto transition-colors ${planFilter === opt.value
                                            ? "bg-blue-600 text-white"
                                            : "text-slate-700 hover:bg-slate-100"
                                            }`}
                                        style={{ width: "calc(100% - 8px)", margin: "0 4px" }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="relative" ref={statusDropdownRef}>
                        <button
                            onClick={() => {
                                setStatusDropdownOpen(!statusDropdownOpen);
                                setPlanDropdownOpen(false);
                            }}
                            className={`flex items-center gap-2 pl-3 pr-8 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-600 cursor-pointer transition-colors min-w-[140px] ${statusDropdownOpen
                                ? "border-blue-500"
                                : "border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            <BsCircle size={12} className="text-slate-400" />
                            <span>
                                {statusFilter === "ALL"
                                    ? "All Status"
                                    : statusFilter.charAt(0) +
                                    statusFilter.slice(1).toLowerCase()}
                            </span>
                            <BsChevronDown
                                size={10}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </button>

                        {statusDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-40">
                                {[
                                    { value: "ALL", label: "All Status", dot: "" },
                                    { value: "ACTIVE", label: "Active", dot: "bg-emerald-500" },
                                    { value: "SUSPENDED", label: "Suspended", dot: "bg-rose-500" },
                                    { value: "PENDING", label: "Pending", dot: "bg-amber-500" },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setStatusFilter(opt.value);
                                            setStatusDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm cursor-pointer rounded-lg flex items-center gap-2 transition-colors ${statusFilter === opt.value
                                            ? "bg-blue-600 text-white"
                                            : "text-slate-700 hover:bg-slate-100"
                                            }`}
                                        style={{ width: "calc(100% - 8px)", margin: "0 4px" }}
                                    >
                                        {opt.dot && (
                                            <span
                                                className={`w-2 h-2 rounded-full ${statusFilter === opt.value ? "bg-white" : opt.dot
                                                    }`}
                                            />
                                        )}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-100">
                                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider w-[20%]">
                                    Company
                                </th>
                                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider w-[18%]">
                                    Admin
                                </th>
                                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">
                                    Plan
                                </th>
                                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">
                                    Status
                                </th>
                                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider w-[8%]">
                                    Users
                                </th>
                                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider w-[10%]">
                                    Storage
                                </th>
                                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">
                                    Last Login
                                </th>
                                <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider w-[8%]">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedTenants.map((tenant) => (
                                <tr
                                    key={tenant.id}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                                >
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-3">
                                            <HiOutlineOfficeBuilding
                                                size={18}
                                                className="text-slate-400 shrink-0"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {tenant.company}
                                                </p>
                                                <p className="text-xs text-slate-400">{tenant.id}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <img
                                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
                                                    tenant.admin
                                                )}`}
                                                alt={tenant.admin}
                                                className="w-7 h-7 rounded-full bg-slate-100 shrink-0"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">
                                                    {tenant.admin}
                                                </p>
                                                <p className="text-xs text-slate-400">{tenant.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-2.5">
                                        <span
                                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${getPlanStyle(
                                                tenant.plan
                                            )}`}
                                        >
                                            {tenant.plan.charAt(0) + tenant.plan.slice(1).toLowerCase()}
                                        </span>
                                    </td>

                                    <td className="px-4 py-2.5">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${tenant.status === "ACTIVE"
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                : tenant.status === "SUSPENDED"
                                                    ? "bg-rose-50 text-rose-600 border-rose-200"
                                                    : "bg-amber-50 text-amber-600 border-amber-200"
                                                }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${tenant.status === "ACTIVE"
                                                    ? "bg-emerald-500"
                                                    : tenant.status === "SUSPENDED"
                                                        ? "bg-rose-500"
                                                        : "bg-amber-500"
                                                    }`}
                                            />
                                            {tenant.status.charAt(0) +
                                                tenant.status.slice(1).toLowerCase()}
                                        </span>
                                    </td>

                                    <td className="px-4 py-2.5 text-sm font-medium text-slate-700">
                                        {tenant.users}
                                    </td>

                                    <td className="px-4 py-2.5 text-sm font-medium text-slate-700">
                                        {tenant.storage}
                                    </td>

                                    <td className="px-4 py-2.5 text-xs text-slate-400">
                                        {tenant.lastLogin}
                                    </td>

                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setEditingTenant(tenant)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                title="Edit"
                                            >
                                                <BsPencil size={13} />
                                            </button>

                                            <button
                                                onClick={() => toggleStatus(tenant.id)}
                                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                title={tenant.status === "ACTIVE" ? "Suspend" : "Activate"}
                                            >
                                                {tenant.status === "ACTIVE" ? (
                                                    <BsPause size={13} />
                                                ) : (
                                                    <BsPlay size={13} />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => deleteTenant(tenant.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                title="Delete"
                                            >
                                                <BsTrash size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredTenants.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-sm font-medium">
                            No tenants found matching your criteria.
                        </div>
                    )}
                </div>
            </div>

            {/* Independent Pagination Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
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
            </div>

            {/* Edit Modal */}
            {editingTenant && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50"
                    onClick={() => setEditingTenant(null)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Edit Tenant
                            </h2>
                            <button
                                onClick={() => setEditingTenant(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <BsX size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Company Name
                                </label>
                                <input
                                    value={editingTenant.company}
                                    onChange={(e) =>
                                        setEditingTenant({
                                            ...editingTenant,
                                            company: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Admin Name
                                </label>
                                <input
                                    value={editingTenant.admin}
                                    onChange={(e) =>
                                        setEditingTenant({
                                            ...editingTenant,
                                            admin: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Plan
                                </label>
                                <select
                                    value={editingTenant.plan}
                                    onChange={(e) =>
                                        setEditingTenant({
                                            ...editingTenant,
                                            plan: e.target.value as Tenant["plan"],
                                        })
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="PROFESSIONAL">Professional</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Status
                                </label>
                                <select
                                    value={editingTenant.status}
                                    onChange={(e) =>
                                        setEditingTenant({
                                            ...editingTenant,
                                            status: e.target.value as Tenant["status"],
                                        })
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="SUSPENDED">Suspended</option>
                                    <option value="PENDING">Pending</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setEditingTenant(null)}
                                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateTenant}
                                className="flex-1 py-2.5 bg-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <BsCheck2 size={16} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
