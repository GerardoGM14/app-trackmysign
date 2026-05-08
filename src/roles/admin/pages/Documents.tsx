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
    BsFileEarmarkText,
    BsArrowRepeat,
    BsBell,
    BsArchive,
    BsCopy,
    BsCalendar3,
    BsClock,
    BsPersonBadge,
    BsFileEarmarkPdf,
} from 'react-icons/bs';

import Pagination from '../../../components/Pagination';
import ExportOverlay from '../../../components/ExportOverlay';
import ConfirmModal from '../../../components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { validateEmail, validateRequired } from '../../../utils/validators';

/* ---------- Domain ---------- */

type DocStatus = 'draft' | 'sent' | 'pending' | 'signed' | 'expired' | 'rejected';
type DocType = 'contract' | 'nda' | 'addendum' | 'agreement' | 'other';

interface Signer {
    name: string;
    email: string;
    status: 'pending' | 'signed' | 'rejected';
    signedAt?: string;
}

interface DocumentItem {
    id: string;
    title: string;
    type: DocType;
    status: DocStatus;
    signers: Signer[];
    createdBy: string;
    createdAt: string;
    sentAt?: string;
    completedAt?: string;
    expiresAt?: string;
    fileSizeKB: number;
}

const TYPE_LABEL: Record<DocType, string> = {
    contract: 'Contrato',
    nda: 'NDA',
    addendum: 'Anexo',
    agreement: 'Acuerdo',
    other: 'Otro',
};

const STATUS_CONFIG: Record<DocStatus, { text: string; cls: string; dot: string }> = {
    draft: { text: 'Borrador', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
    sent: { text: 'Enviado', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
    pending: { text: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    signed: { text: 'Firmado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    expired: { text: 'Expirado', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    rejected: { text: 'Rechazado', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

const SIGNER_STATUS_LABEL: Record<Signer['status'], { text: string; cls: string }> = {
    pending: { text: 'Pendiente', cls: 'text-amber-700' },
    signed: { text: 'Firmado', cls: 'text-emerald-700' },
    rejected: { text: 'Rechazado', cls: 'text-rose-700' },
};

const TYPE_OPTIONS = [
    { value: 'ALL', label: 'Todos los tipos' },
    { value: 'contract', label: 'Contrato' },
    { value: 'nda', label: 'NDA' },
    { value: 'addendum', label: 'Anexo' },
    { value: 'agreement', label: 'Acuerdo' },
    { value: 'other', label: 'Otro' },
] as const;

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'Todos los estados', dot: '' },
    { value: 'draft', label: 'Borrador', dot: 'bg-slate-400' },
    { value: 'sent', label: 'Enviado', dot: 'bg-sky-500' },
    { value: 'pending', label: 'Pendiente', dot: 'bg-amber-500' },
    { value: 'signed', label: 'Firmado', dot: 'bg-emerald-500' },
    { value: 'expired', label: 'Expirado', dot: 'bg-rose-500' },
    { value: 'rejected', label: 'Rechazado', dot: 'bg-rose-500' },
] as const;

const DATE_RANGES = [
    { value: 'ALL', label: 'Cualquier fecha' },
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 90 días' },
    { value: '365', label: 'Último año' },
] as const;

const INITIAL_DOCUMENTS: DocumentItem[] = [
    {
        id: 'D-2026-042', title: 'Contrato de servicios — Acme Corp', type: 'contract', status: 'signed',
        signers: [
            { name: 'Ana Pérez', email: 'ana@acme.com', status: 'signed', signedAt: '2026-05-07' },
            { name: 'Hans Weber', email: 'hans@miempresa.com', status: 'signed', signedAt: '2026-05-07' },
        ],
        createdBy: 'Hans Weber', createdAt: '2026-05-05', sentAt: '2026-05-05', completedAt: '2026-05-07', fileSizeKB: 248,
    },
    {
        id: 'D-2026-041', title: 'NDA — Beta Industries', type: 'nda', status: 'pending',
        signers: [
            { name: 'Carlos López', email: 'carlos@beta.io', status: 'pending' },
            { name: 'Hans Weber', email: 'hans@miempresa.com', status: 'signed', signedAt: '2026-05-06' },
        ],
        createdBy: 'Anna Schmidt', createdAt: '2026-05-04', sentAt: '2026-05-04', expiresAt: '2026-05-15', fileSizeKB: 184,
    },
    {
        id: 'D-2026-040', title: 'Acuerdo de colaboración Q2', type: 'agreement', status: 'signed',
        signers: [{ name: 'María Silva', email: 'maria@partner.com', status: 'signed', signedAt: '2026-05-04' }],
        createdBy: 'Hans Weber', createdAt: '2026-05-02', sentAt: '2026-05-02', completedAt: '2026-05-04', fileSizeKB: 312,
    },
    {
        id: 'D-2026-039', title: 'Renovación contrato anual', type: 'contract', status: 'pending',
        signers: [
            { name: 'James Park', email: 'james@partner.io', status: 'pending' },
            { name: 'Mia Thompson', email: 'mia@partner.io', status: 'pending' },
        ],
        createdBy: 'Anna Schmidt', createdAt: '2026-05-01', sentAt: '2026-05-01', expiresAt: '2026-05-12', fileSizeKB: 421,
    },
    {
        id: 'D-2026-038', title: 'Anexo modificatorio v2', type: 'addendum', status: 'expired',
        signers: [{ name: 'Olaf Nilsen', email: 'olaf@partner.no', status: 'pending' }],
        createdBy: 'Hans Weber', createdAt: '2026-04-15', sentAt: '2026-04-15', expiresAt: '2026-04-30', fileSizeKB: 96,
    },
    {
        id: 'D-2026-037', title: 'Contrato proveedor — Servicios cloud', type: 'contract', status: 'sent',
        signers: [{ name: 'Klaus Bauer', email: 'klaus@cloud.de', status: 'pending' }],
        createdBy: 'Anna Schmidt', createdAt: '2026-05-08', sentAt: '2026-05-08', expiresAt: '2026-05-22', fileSizeKB: 198,
    },
    {
        id: 'D-2026-036', title: 'NDA bilateral — Investigación de mercado', type: 'nda', status: 'draft',
        signers: [],
        createdBy: 'Hans Weber', createdAt: '2026-05-09', fileSizeKB: 145,
    },
    {
        id: 'D-2026-035', title: 'Acuerdo de confidencialidad — Audit', type: 'agreement', status: 'rejected',
        signers: [{ name: 'Sarah Connor', email: 'sarah@audit.uk', status: 'rejected' }],
        createdBy: 'Anna Schmidt', createdAt: '2026-04-28', sentAt: '2026-04-28', fileSizeKB: 267,
    },
    {
        id: 'D-2026-034', title: 'Contrato laboral — Desarrollador senior', type: 'contract', status: 'signed',
        signers: [{ name: 'Diego Ramos', email: 'diego@miempresa.com', status: 'signed', signedAt: '2026-04-26' }],
        createdBy: 'Hans Weber', createdAt: '2026-04-22', sentAt: '2026-04-22', completedAt: '2026-04-26', fileSizeKB: 312,
    },
    {
        id: 'D-2026-033', title: 'Adenda al contrato marco', type: 'addendum', status: 'signed',
        signers: [{ name: 'Marco Rossi', email: 'marco@partner.it', status: 'signed', signedAt: '2026-04-20' }],
        createdBy: 'Anna Schmidt', createdAt: '2026-04-18', sentAt: '2026-04-18', completedAt: '2026-04-20', fileSizeKB: 78,
    },
    {
        id: 'D-2026-032', title: 'Otro: Política de privacidad firmada', type: 'other', status: 'signed',
        signers: [{ name: 'Emily Zhang', email: 'emily@partner.com', status: 'signed', signedAt: '2026-04-15' }],
        createdBy: 'Hans Weber', createdAt: '2026-04-15', sentAt: '2026-04-15', completedAt: '2026-04-15', fileSizeKB: 52,
    },
];

const COMPANY_USERS = [
    'Hans Weber',
    'Anna Schmidt',
    'Diego Ramos',
];

type SortKey = 'title' | 'type' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

type ConfirmAction =
    | { kind: 'delete'; doc: DocumentItem }
    | { kind: 'archive'; doc: DocumentItem }
    | { kind: 'remind'; doc: DocumentItem }
    | { kind: 'resend'; doc: DocumentItem }
    | { kind: 'bulk-delete'; ids: string[] }
    | { kind: 'bulk-archive'; ids: string[] }
    | { kind: 'bulk-remind'; ids: string[] }
    | null;

export default function Documents() {
    const { showToast } = useToast();

    const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [signerFilter, setSignerFilter] = useState<string>('ALL');
    const [dateRange, setDateRange] = useState<string>('ALL');

    const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
    const [creatingDoc, setCreatingDoc] = useState(false);
    const [detailDoc, setDetailDoc] = useState<DocumentItem | null>(null);
    const [confirm, setConfirm] = useState<ConfirmAction>(null);
    const [exporting, setExporting] = useState(false);

    const [typeOpen, setTypeOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [signerOpen, setSignerOpen] = useState(false);
    const [dateOpen, setDateOpen] = useState(false);
    const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);

    const typeRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLDivElement>(null);
    const signerRef = useRef<HTMLDivElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
            if (signerRef.current && !signerRef.current.contains(e.target as Node)) setSignerOpen(false);
            if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setActionMenuFor(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const allSignerNames = useMemo(() => {
        const set = new Set<string>();
        docs.forEach((d) => d.signers.forEach((s) => set.add(s.name)));
        return Array.from(set).sort();
    }, [docs]);

    const filteredDocs = useMemo(() => {
        const q = search.toLowerCase().trim();
        const cutoff = dateRange === 'ALL' ? null : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000;

        const filtered = docs.filter((d) => {
            const matchSearch =
                !q ||
                d.title.toLowerCase().includes(q) ||
                d.id.toLowerCase().includes(q) ||
                d.signers.some((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
            const matchType = typeFilter === 'ALL' || d.type === typeFilter;
            const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
            const matchSigner = signerFilter === 'ALL' || d.signers.some((s) => s.name === signerFilter);
            const matchDate = !cutoff || new Date(d.createdAt).getTime() >= cutoff;
            return matchSearch && matchType && matchStatus && matchSigner && matchDate;
        });

        const sorted = [...filtered].sort((a, b) => {
            let va: string | number;
            let vb: string | number;
            if (sortKey === 'createdAt') {
                va = new Date(a.createdAt).getTime();
                vb = new Date(b.createdAt).getTime();
            } else if (sortKey === 'type') {
                va = TYPE_LABEL[a.type];
                vb = TYPE_LABEL[b.type];
            } else if (sortKey === 'status') {
                va = a.status;
                vb = b.status;
            } else {
                va = a.title.toLowerCase();
                vb = b.title.toLowerCase();
            }
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [docs, search, typeFilter, statusFilter, signerFilter, dateRange, sortKey, sortDir]);

    useEffect(() => setCurrentPage(1), [search, typeFilter, statusFilter, signerFilter, dateRange]);

    useEffect(() => {
        const validIds = new Set(filteredDocs.map((d) => d.id));
        setSelectedIds((prev) => {
            const next = new Set<string>();
            prev.forEach((id) => validIds.has(id) && next.add(id));
            return next.size === prev.size ? prev : next;
        });
    }, [filteredDocs]);

    const paginatedDocs = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredDocs.slice(start, start + rowsPerPage);
    }, [filteredDocs, currentPage, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredDocs.length / rowsPerPage));

    const stats = useMemo(
        () => ({
            total: docs.length,
            signed: docs.filter((d) => d.status === 'signed').length,
            pending: docs.filter((d) => d.status === 'pending' || d.status === 'sent').length,
            expired: docs.filter((d) => d.status === 'expired').length,
        }),
        [docs],
    );

    const filtersActive =
        search.trim() !== '' || typeFilter !== 'ALL' || statusFilter !== 'ALL' ||
        signerFilter !== 'ALL' || dateRange !== 'ALL';

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('ALL');
        setStatusFilter('ALL');
        setSignerFilter('ALL');
        setDateRange('ALL');
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

    const performDelete = (id: string) => {
        const target = docs.find((d) => d.id === id);
        if (!target) return;
        setDocs((prev) => prev.filter((d) => d.id !== id));
        showToast(`Documento "${target.id}" eliminado.`, 'success');
    };

    const performArchive = (id: string) => {
        const target = docs.find((d) => d.id === id);
        if (!target) return;
        setDocs((prev) => prev.filter((d) => d.id !== id));
        showToast(`Documento "${target.id}" archivado.`, 'info');
    };

    const performResend = (id: string) => {
        const target = docs.find((d) => d.id === id);
        if (!target) return;
        const pendingCount = target.signers.filter((s) => s.status === 'pending').length;
        showToast(
            pendingCount > 0
                ? `Reenviado a ${pendingCount} firmante(s) pendientes.`
                : 'No hay firmantes pendientes en este documento.',
            pendingCount > 0 ? 'success' : 'warning',
        );
    };

    const performRemind = (id: string) => {
        const target = docs.find((d) => d.id === id);
        if (!target) return;
        const pendingCount = target.signers.filter((s) => s.status === 'pending').length;
        showToast(
            pendingCount > 0
                ? `Recordatorio enviado a ${pendingCount} firmante(s).`
                : 'No hay firmantes pendientes para recordar.',
            pendingCount > 0 ? 'success' : 'warning',
        );
    };

    const performBulkDelete = (ids: string[]) => {
        setDocs((prev) => prev.filter((d) => !ids.includes(d.id)));
        clearSelection();
        showToast(`${ids.length} documento(s) eliminados.`, 'success');
    };

    const performBulkArchive = (ids: string[]) => {
        setDocs((prev) => prev.filter((d) => !ids.includes(d.id)));
        clearSelection();
        showToast(`${ids.length} documento(s) archivados.`, 'info');
    };

    const performBulkRemind = (ids: string[]) => {
        const sent = docs
            .filter((d) => ids.includes(d.id))
            .reduce((sum, d) => sum + d.signers.filter((s) => s.status === 'pending').length, 0);
        clearSelection();
        showToast(
            sent > 0 ? `${sent} recordatorio(s) enviados.` : 'No hay firmantes pendientes en la selección.',
            sent > 0 ? 'success' : 'warning',
        );
    };

    const handleDuplicate = (doc: DocumentItem) => {
        const id = `D-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
        const duplicated: DocumentItem = {
            ...doc,
            id,
            title: `${doc.title} (copia)`,
            status: 'draft',
            signers: [],
            createdAt: new Date().toISOString().split('T')[0],
            sentAt: undefined,
            completedAt: undefined,
            expiresAt: undefined,
        };
        setDocs((prev) => [duplicated, ...prev]);
        showToast(`Borrador "${duplicated.id}" creado a partir de "${doc.id}".`, 'success');
    };

    const handleDownload = (doc: DocumentItem) => {
        showToast(`Descargando ${doc.id}.pdf (${doc.fileSizeKB} KB)...`, 'info');
    };

    const handleCreate = (data: DocumentFormData) => {
        const id = `D-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
        const newDoc: DocumentItem = {
            id,
            title: data.title,
            type: data.type,
            status: data.signers.length === 0 ? 'draft' : 'sent',
            signers: data.signers.map((s) => ({ ...s, status: 'pending' as const })),
            createdBy: data.createdBy,
            createdAt: new Date().toISOString().split('T')[0],
            sentAt: data.signers.length === 0 ? undefined : new Date().toISOString().split('T')[0],
            expiresAt: data.expiresInDays > 0
                ? new Date(Date.now() + data.expiresInDays * 86400000).toISOString().split('T')[0]
                : undefined,
            fileSizeKB: 200,
        };
        setDocs((prev) => [newDoc, ...prev]);
        showToast(`Documento "${id}" creado correctamente.`, 'success');
    };

    const handleUpdate = (updated: DocumentItem) => {
        setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        showToast(`Documento "${updated.id}" actualizado.`, 'success');
    };

    const exportToExcel = async () => {
        setExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Documentos');
            ws.columns = [
                { header: 'ID', key: 'id', width: 14 },
                { header: 'Título', key: 'title', width: 40 },
                { header: 'Tipo', key: 'type', width: 14 },
                { header: 'Estado', key: 'status', width: 14 },
                { header: 'Firmantes', key: 'signers', width: 30 },
                { header: 'Creado por', key: 'createdBy', width: 20 },
                { header: 'Creado', key: 'createdAt', width: 14 },
                { header: 'Vence', key: 'expiresAt', width: 14 },
                { header: 'Tamaño (KB)', key: 'fileSizeKB', width: 14 },
            ];

            const headerRow = ws.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });
            headerRow.height = 22;

            filteredDocs.forEach((d) => {
                ws.addRow({
                    id: d.id,
                    title: d.title,
                    type: TYPE_LABEL[d.type],
                    status: STATUS_CONFIG[d.status].text,
                    signers: d.signers.map((s) => `${s.name} <${s.email}>`).join('; '),
                    createdBy: d.createdBy,
                    createdAt: d.createdAt,
                    expiresAt: d.expiresAt ?? '',
                    fileSizeKB: d.fileSizeKB,
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `documentos_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            showToast('No fue posible exportar el archivo.', 'error');
            setExporting(false);
        }
    };

    const handleExportComplete = () => {
        setExporting(false);
        showToast('Archivo de documentos exportado correctamente.', 'success');
    };

    const typeFilterLabel = TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? 'Todos los tipos';
    const statusFilterLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'Todos los estados';
    const signerFilterLabel = signerFilter === 'ALL' ? 'Todos los firmantes' : signerFilter;
    const dateFilterLabel = DATE_RANGES.find((o) => o.value === dateRange)?.label ?? 'Cualquier fecha';

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Documentos
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Gestiona los contratos, NDAs y acuerdos de tu empresa.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                        <button
                            type="button"
                            onClick={exportToExcel}
                            disabled={filteredDocs.length === 0}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <BsDownload size={12} />
                            Exportar
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreatingDoc(true)}
                            className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsPlus size={15} />
                            Nuevo documento
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Total" value={stats.total} dot="bg-[#1e40af]" />
                    <StatCard label="Firmados" value={stats.signed} dot="bg-emerald-500" />
                    <StatCard label="Pendientes" value={stats.pending} dot="bg-amber-500" />
                    <StatCard label="Expirados" value={stats.expired} dot="bg-rose-500" />
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col lg:flex-row gap-2.5">
                    <div className="relative flex-1 min-w-[220px]">
                        <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                            type="text"
                            placeholder="Buscar por título, ID o firmante..."
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
                        <div className="relative" ref={typeRef}>
                            <FilterButton
                                label={typeFilterLabel}
                                active={typeFilter !== 'ALL'}
                                open={typeOpen}
                                onToggle={() => {
                                    setTypeOpen(!typeOpen);
                                    setStatusOpen(false);
                                    setSignerOpen(false);
                                    setDateOpen(false);
                                }}
                            />
                            {typeOpen && (
                                <DropdownMenu>
                                    {TYPE_OPTIONS.map((opt) => (
                                        <DropdownItem
                                            key={opt.value}
                                            label={opt.label}
                                            selected={typeFilter === opt.value}
                                            onClick={() => {
                                                setTypeFilter(opt.value);
                                                setTypeOpen(false);
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
                                    setTypeOpen(false);
                                    setSignerOpen(false);
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

                        <div className="relative" ref={signerRef}>
                            <FilterButton
                                label={signerFilterLabel}
                                active={signerFilter !== 'ALL'}
                                open={signerOpen}
                                onToggle={() => {
                                    setSignerOpen(!signerOpen);
                                    setTypeOpen(false);
                                    setStatusOpen(false);
                                    setDateOpen(false);
                                }}
                            />
                            {signerOpen && (
                                <DropdownMenu>
                                    <DropdownItem
                                        label="Todos los firmantes"
                                        selected={signerFilter === 'ALL'}
                                        onClick={() => {
                                            setSignerFilter('ALL');
                                            setSignerOpen(false);
                                        }}
                                    />
                                    {allSignerNames.map((name) => (
                                        <DropdownItem
                                            key={name}
                                            label={name}
                                            selected={signerFilter === name}
                                            onClick={() => {
                                                setSignerFilter(name);
                                                setSignerOpen(false);
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
                                    setTypeOpen(false);
                                    setStatusOpen(false);
                                    setSignerOpen(false);
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
                                    {selectedIds.size === 1 ? 'documento seleccionado' : 'documentos seleccionados'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BulkActionButton
                                    icon={<BsBell size={12} />}
                                    label="Recordar"
                                    onClick={() => setConfirm({ kind: 'bulk-remind', ids: Array.from(selectedIds) })}
                                />
                                <BulkActionButton
                                    icon={<BsArchive size={12} />}
                                    label="Archivar"
                                    onClick={() => setConfirm({ kind: 'bulk-archive', ids: Array.from(selectedIds) })}
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
                            const pageIds = paginatedDocs.map((d) => d.id);
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
                                            <SortableTh label="Documento" sortKey="title" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <SortableTh label="Tipo" sortKey="type" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <SortableTh label="Estado" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <th className="px-4 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Firmantes</th>
                                            <SortableTh label="Creado" sortKey="createdAt" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedDocs.map((doc) => {
                                            const status = STATUS_CONFIG[doc.status];
                                            const isMenuOpen = actionMenuFor === doc.id;
                                            const isSelected = selectedIds.has(doc.id);
                                            const signedCount = doc.signers.filter((s) => s.status === 'signed').length;
                                            const totalSigners = doc.signers.length;

                                            return (
                                                <tr
                                                    key={doc.id}
                                                    onClick={() => setDetailDoc(doc)}
                                                    className={`border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer ${isSelected ? 'bg-[#1e40af]/[0.03]' : 'hover:bg-slate-50/60'
                                                        }`}
                                                >
                                                    <td className="pl-4 pr-2 py-2.5 w-9" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(doc.id)}
                                                            aria-label={`Seleccionar ${doc.title}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <span className="w-7 h-7 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                                                                <BsFileEarmarkPdf size={13} />
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-[13px] font-semibold text-slate-900 truncate">{doc.title}</p>
                                                                <p className="text-[11px] text-slate-400 font-mono">{doc.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] font-medium text-slate-700">{TYPE_LABEL[doc.type]}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                            {status.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        {totalSigners === 0 ? (
                                                            <span className="text-[12px] text-slate-400">—</span>
                                                        ) : (
                                                            <span className="text-[12px] text-slate-600 font-mono tabular-nums">
                                                                {signedCount}/{totalSigners}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[12px] text-slate-500 tabular-nums">{doc.createdAt}</span>
                                                    </td>
                                                    <td className="px-2 py-2.5 relative" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActionMenuFor(isMenuOpen ? null : doc.id)}
                                                            aria-label={`Acciones de ${doc.title}`}
                                                            className="w-7 h-7 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                                                        >
                                                            <BsThreeDots size={13} />
                                                        </button>
                                                        {isMenuOpen && (
                                                            <div ref={actionMenuRef} className="absolute right-2 top-full mt-1 w-52 bg-white border border-slate-200 rounded-md overflow-hidden z-10">
                                                                <ActionMenuItem
                                                                    icon={<BsFileEarmarkText size={12} />}
                                                                    label="Ver detalle"
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        setDetailDoc(doc);
                                                                    }}
                                                                />
                                                                <ActionMenuItem
                                                                    icon={<BsDownload size={12} />}
                                                                    label="Descargar PDF"
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        handleDownload(doc);
                                                                    }}
                                                                />
                                                                {(doc.status === 'sent' || doc.status === 'pending') && (
                                                                    <>
                                                                        <ActionMenuItem
                                                                            icon={<BsArrowRepeat size={12} />}
                                                                            label="Reenviar"
                                                                            onClick={() => {
                                                                                setActionMenuFor(null);
                                                                                setConfirm({ kind: 'resend', doc });
                                                                            }}
                                                                        />
                                                                        <ActionMenuItem
                                                                            icon={<BsBell size={12} />}
                                                                            label="Enviar recordatorio"
                                                                            onClick={() => {
                                                                                setActionMenuFor(null);
                                                                                setConfirm({ kind: 'remind', doc });
                                                                            }}
                                                                        />
                                                                    </>
                                                                )}
                                                                {doc.status === 'draft' && (
                                                                    <ActionMenuItem
                                                                        icon={<BsPencil size={12} />}
                                                                        label="Editar borrador"
                                                                        onClick={() => {
                                                                            setActionMenuFor(null);
                                                                            setEditingDoc(doc);
                                                                        }}
                                                                    />
                                                                )}
                                                                <ActionMenuItem
                                                                    icon={<BsCopy size={12} />}
                                                                    label="Duplicar"
                                                                    onClick={() => {
                                                                        setActionMenuFor(null);
                                                                        handleDuplicate(doc);
                                                                    }}
                                                                />
                                                                <div className="border-t border-slate-100" />
                                                                {doc.status !== 'draft' && (
                                                                    <ActionMenuItem
                                                                        icon={<BsArchive size={12} />}
                                                                        label="Archivar"
                                                                        onClick={() => {
                                                                            setActionMenuFor(null);
                                                                            setConfirm({ kind: 'archive', doc });
                                                                        }}
                                                                    />
                                                                )}
                                                                {doc.status === 'draft' && (
                                                                    <ActionMenuItem
                                                                        icon={<BsTrash size={12} />}
                                                                        label="Eliminar"
                                                                        danger
                                                                        onClick={() => {
                                                                            setActionMenuFor(null);
                                                                            setConfirm({ kind: 'delete', doc });
                                                                        }}
                                                                    />
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

                        {filteredDocs.length === 0 && (
                            <div className="px-6 py-16 flex flex-col items-center text-center">
                                <span className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                                    <BsFileEarmarkText size={16} />
                                </span>
                                <p className="text-[13px] font-medium text-slate-700">No se encontraron documentos.</p>
                                <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
                                    {filtersActive
                                        ? 'Prueba ajustando los filtros o limpia la búsqueda.'
                                        : 'Crea tu primer documento con el botón superior.'}
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

                    {filteredDocs.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            rowsPerPage={rowsPerPage}
                            totalEntries={filteredDocs.length}
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
                {detailDoc && (
                    <DocumentDetailDrawer
                        doc={detailDoc}
                        onClose={() => setDetailDoc(null)}
                        onDownload={() => handleDownload(detailDoc)}
                        onRemind={() => {
                            setDetailDoc(null);
                            setConfirm({ kind: 'remind', doc: detailDoc });
                        }}
                        onResend={() => {
                            setDetailDoc(null);
                            setConfirm({ kind: 'resend', doc: detailDoc });
                        }}
                        onArchive={() => {
                            setDetailDoc(null);
                            setConfirm({ kind: 'archive', doc: detailDoc });
                        }}
                        onDelete={() => {
                            setDetailDoc(null);
                            setConfirm({ kind: 'delete', doc: detailDoc });
                        }}
                    />
                )}

                {(creatingDoc || editingDoc) && (
                    <DocumentFormModal
                        mode={creatingDoc ? 'create' : 'edit'}
                        initial={editingDoc}
                        onClose={() => {
                            setCreatingDoc(false);
                            setEditingDoc(null);
                        }}
                        onSave={(data) => {
                            if (editingDoc) {
                                handleUpdate({ ...editingDoc, title: data.title, type: data.type, signers: data.signers.map((s) => ({ ...s, status: 'pending' as const })) });
                            } else {
                                handleCreate(data);
                            }
                            setCreatingDoc(false);
                            setEditingDoc(null);
                        }}
                    />
                )}

                {confirm?.kind === 'delete' && (
                    <ConfirmModal
                        title="Eliminar documento"
                        description={`Esta acción eliminará permanentemente "${confirm.doc.id}". No se puede deshacer.`}
                        confirmLabel="Confirmar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performDelete(confirm.doc.id);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'archive' && (
                    <ConfirmModal
                        title="Archivar documento"
                        description={`"${confirm.doc.id}" se moverá al archivo y dejará de aparecer en este listado.`}
                        confirmLabel="Archivar"
                        variant="warning"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performArchive(confirm.doc.id);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'remind' && (
                    <ConfirmModal
                        title="Enviar recordatorio"
                        description={`Se enviará un correo a los firmantes pendientes de "${confirm.doc.id}".`}
                        confirmLabel="Enviar"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performRemind(confirm.doc.id);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'resend' && (
                    <ConfirmModal
                        title="Reenviar documento"
                        description={`Se volverá a enviar "${confirm.doc.id}" a los firmantes pendientes.`}
                        confirmLabel="Reenviar"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performResend(confirm.doc.id);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'bulk-delete' && (
                    <ConfirmModal
                        title={`Eliminar ${confirm.ids.length} documento(s)`}
                        description="Esta acción eliminará permanentemente los documentos seleccionados. No se puede deshacer."
                        confirmLabel="Confirmar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performBulkDelete(confirm.ids);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'bulk-archive' && (
                    <ConfirmModal
                        title={`Archivar ${confirm.ids.length} documento(s)`}
                        description="Los documentos seleccionados se moverán al archivo y dejarán de aparecer."
                        confirmLabel="Archivar"
                        variant="warning"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performBulkArchive(confirm.ids);
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'bulk-remind' && (
                    <ConfirmModal
                        title={`Enviar recordatorios`}
                        description={`Se enviará un correo a los firmantes pendientes de ${confirm.ids.length} documento(s).`}
                        confirmLabel="Enviar"
                        variant="primary"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performBulkRemind(confirm.ids);
                            setConfirm(null);
                        }}
                    />
                )}

                {exporting && (
                    <ExportOverlay
                        label="Exportando documentos"
                        description={`Estamos preparando un archivo con ${filteredDocs.length} documento(s).`}
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

function DocumentDetailDrawer({
    doc,
    onClose,
    onDownload,
    onRemind,
    onResend,
    onArchive,
    onDelete,
}: {
    doc: DocumentItem;
    onClose: () => void;
    onDownload: () => void;
    onRemind: () => void;
    onResend: () => void;
    onArchive: () => void;
    onDelete: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const status = STATUS_CONFIG[doc.status];
    const signedCount = doc.signers.filter((s) => s.status === 'signed').length;
    const totalSigners = doc.signers.length;
    const progress = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;

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
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">Detalle del documento</h3>
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
                            <span className="w-12 h-12 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                                <BsFileEarmarkPdf size={20} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-[15px] font-semibold text-slate-900 tracking-tight leading-snug">{doc.title}</h4>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.id}</p>
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.cls}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                        {status.text}
                                    </span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                        {TYPE_LABEL[doc.type]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    {totalSigners > 0 && (
                        <div className="px-6 py-4 border-b border-slate-100">
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-[12px] font-medium text-slate-700">Progreso de firmas</span>
                                <span className="text-[12px] text-slate-500 tabular-nums">
                                    <span className="font-semibold text-slate-900">{signedCount}</span> / {totalSigners}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-[width] duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Signers */}
                    {totalSigners > 0 && (
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Firmantes
                            </h5>
                            <ul className="space-y-2">
                                {doc.signers.map((s) => {
                                    const label = SIGNER_STATUS_LABEL[s.status];
                                    return (
                                        <li key={s.email} className="flex items-start gap-2.5">
                                            <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 shrink-0">
                                                {s.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-medium text-slate-900 truncate">{s.name}</p>
                                                <p className="text-[11px] text-slate-500 font-mono truncate">{s.email}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-[11px] font-medium ${label.cls}`}>{label.text}</p>
                                                {s.signedAt && <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{s.signedAt}</p>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="px-6 py-4 border-b border-slate-100 space-y-3">
                        <DetailRow icon={<BsPersonBadge size={12} />} label="Creado por" value={doc.createdBy} />
                        <DetailRow icon={<BsCalendar3 size={12} />} label="Creado" value={doc.createdAt} mono />
                        {doc.sentAt && <DetailRow icon={<BsArrowRepeat size={12} />} label="Enviado" value={doc.sentAt} mono />}
                        {doc.completedAt && <DetailRow icon={<BsCheck2 size={12} />} label="Completado" value={doc.completedAt} mono />}
                        {doc.expiresAt && <DetailRow icon={<BsClock size={12} />} label="Vence" value={doc.expiresAt} mono />}
                        <DetailRow icon={<BsFileEarmarkPdf size={12} />} label="Tamaño" value={`${doc.fileSizeKB} KB`} mono />
                    </div>

                    {/* Quick actions */}
                    <div className="px-6 py-4">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones</h5>
                        <div className="space-y-1.5">
                            <DrawerActionButton icon={<BsDownload size={13} />} label="Descargar PDF" onClick={onDownload} />
                            {(doc.status === 'sent' || doc.status === 'pending') && (
                                <>
                                    <DrawerActionButton icon={<BsBell size={13} />} label="Enviar recordatorio" onClick={onRemind} />
                                    <DrawerActionButton icon={<BsArrowRepeat size={13} />} label="Reenviar a firmantes" onClick={onResend} />
                                </>
                            )}
                            {doc.status !== 'draft' && (
                                <DrawerActionButton icon={<BsArchive size={13} />} label="Archivar" onClick={onArchive} />
                            )}
                            {doc.status === 'draft' && (
                                <DrawerActionButton icon={<BsTrash size={13} />} label="Eliminar borrador" onClick={onDelete} danger />
                            )}
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
                <p className={`text-[13px] text-slate-900 truncate mt-0.5 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
            </div>
        </div>
    );
}

function DrawerActionButton({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
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

/* ---------- Form modal (create + edit) ---------- */

interface DocumentFormData {
    title: string;
    type: DocType;
    signers: { name: string; email: string }[];
    createdBy: string;
    expiresInDays: number;
}

function DocumentFormModal({
    mode,
    initial,
    onClose,
    onSave,
}: {
    mode: 'create' | 'edit';
    initial?: DocumentItem | null;
    onClose: () => void;
    onSave: (data: DocumentFormData) => void;
}) {
    const { showToast } = useToast();

    const [title, setTitle] = useState(initial?.title ?? '');
    const [type, setType] = useState<DocType>(initial?.type ?? 'contract');
    const [createdBy, setCreatedBy] = useState(initial?.createdBy ?? COMPANY_USERS[0]);
    const [expiresInDays, setExpiresInDays] = useState(14);
    const [signers, setSigners] = useState<{ name: string; email: string }[]>(
        initial?.signers.map((s) => ({ name: s.name, email: s.email })) ?? [],
    );
    const [newSigner, setNewSigner] = useState({ name: '', email: '' });
    const [errors, setErrors] = useState<Partial<Record<'title' | 'signerName' | 'signerEmail', string>>>({});

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const addSigner = () => {
        const next: typeof errors = {};
        const nameErr = validateRequired(newSigner.name, 'El nombre', 2);
        const emailErr = validateEmail(newSigner.email);
        if (nameErr) next.signerName = nameErr;
        if (emailErr) next.signerEmail = emailErr;
        if (signers.some((s) => s.email.toLowerCase() === newSigner.email.trim().toLowerCase())) {
            next.signerEmail = 'Este firmante ya fue agregado.';
        }
        setErrors((prev) => ({ ...prev, ...next }));
        if (Object.keys(next).length > 0) return;

        setSigners([...signers, { name: newSigner.name.trim(), email: newSigner.email.trim().toLowerCase() }]);
        setNewSigner({ name: '', email: '' });
        setErrors((prev) => ({ ...prev, signerName: undefined, signerEmail: undefined }));
    };

    const removeSigner = (email: string) => {
        setSigners((prev) => prev.filter((s) => s.email !== email));
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const next: typeof errors = {};
        const titleErr = validateRequired(title, 'El título', 3);
        if (titleErr) next.title = titleErr;
        setErrors(next);
        if (Object.keys(next).length > 0) {
            showToast('Revisa los campos marcados.', 'warning');
            return;
        }
        onSave({
            title: title.trim(),
            type,
            signers,
            createdBy,
            expiresInDays,
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
                className="w-full max-w-lg bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">
                        {mode === 'create' ? 'Nuevo documento' : 'Editar borrador'}
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
                            id="docTitle"
                            label="Título del documento"
                            placeholder="Ej. Contrato de servicios — Acme Corp"
                            value={title}
                            onChange={(v) => {
                                setTitle(v);
                                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                            }}
                            error={errors.title}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="docType" className="block text-[13px] font-medium text-slate-700 mb-1.5">Tipo</label>
                                <select
                                    id="docType"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as DocType)}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
                                >
                                    <option value="contract">Contrato</option>
                                    <option value="nda">NDA</option>
                                    <option value="addendum">Anexo</option>
                                    <option value="agreement">Acuerdo</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="createdBy" className="block text-[13px] font-medium text-slate-700 mb-1.5">Creado por</label>
                                <select
                                    id="createdBy"
                                    value={createdBy}
                                    onChange={(e) => setCreatedBy(e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
                                >
                                    {COMPANY_USERS.map((u) => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="expires" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                Vence en
                                <span className="text-slate-400 font-normal ml-1">(días)</span>
                            </label>
                            <input
                                id="expires"
                                type="number"
                                min={0}
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all tabular-nums"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">0 = sin vencimiento</p>
                        </div>

                        {/* Signers */}
                        <div>
                            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                Firmantes
                                <span className="text-slate-400 font-normal ml-1">({signers.length})</span>
                            </label>

                            {signers.length > 0 && (
                                <ul className="border border-slate-200 rounded-md overflow-hidden divide-y divide-slate-100 mb-2">
                                    {signers.map((s) => (
                                        <li key={s.email} className="flex items-center justify-between px-3 py-2 bg-slate-50">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-medium text-slate-900 truncate">{s.name}</p>
                                                <p className="text-[11px] text-slate-500 font-mono truncate">{s.email}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSigner(s.email)}
                                                aria-label="Quitar firmante"
                                                className="w-6 h-6 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                                            >
                                                <BsX size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nombre"
                                        value={newSigner.name}
                                        onChange={(e) => {
                                            setNewSigner({ ...newSigner, name: e.target.value });
                                            if (errors.signerName) setErrors((p) => ({ ...p, signerName: undefined }));
                                        }}
                                        aria-invalid={!!errors.signerName}
                                        className={`h-10 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all ${errors.signerName
                                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                                                : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                                            }`}
                                    />
                                    <input
                                        type="email"
                                        placeholder="correo@empresa.com"
                                        value={newSigner.email}
                                        onChange={(e) => {
                                            setNewSigner({ ...newSigner, email: e.target.value });
                                            if (errors.signerEmail) setErrors((p) => ({ ...p, signerEmail: undefined }));
                                        }}
                                        aria-invalid={!!errors.signerEmail}
                                        className={`h-10 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all ${errors.signerEmail
                                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                                                : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                                            }`}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addSigner}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <BsPlus size={14} />
                                    Agregar firmante
                                </button>
                            </div>
                            {(errors.signerName || errors.signerEmail) && (
                                <p className="text-[12px] text-rose-600 mt-1.5">
                                    {errors.signerName ?? errors.signerEmail}
                                </p>
                            )}
                            <p className="text-[11px] text-slate-400 mt-1.5">
                                Si no agregas firmantes, el documento se guardará como borrador.
                            </p>
                        </div>

                        {/* Mock file upload */}
                        <div className="border-2 border-dashed border-slate-200 rounded-md px-4 py-6 text-center bg-slate-50/40">
                            <BsFileEarmarkPdf size={24} className="text-slate-400 mx-auto mb-2" />
                            <p className="text-[13px] font-medium text-slate-700">Subir PDF</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Funcionalidad disponible próximamente</p>
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
                            {mode === 'create' ? (signers.length === 0 ? 'Guardar borrador' : 'Crear y enviar') : 'Guardar cambios'}
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
    placeholder,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
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
                type="text"
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
