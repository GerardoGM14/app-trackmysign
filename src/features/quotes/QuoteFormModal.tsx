import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BsX, BsCheck2, BsPlus, BsTrash } from 'react-icons/bs';
import { useToast } from '../../context/ToastContext';
import { validateEmail, validateRequired } from '../../utils/validators';
import {
    type Quote,
    type QuoteItem,
    type QuoteCustomer,
    type ProductType,
    type Material,
    type Unit,
    PRODUCT_TYPE_LABEL,
    MATERIAL_LABEL,
} from './types';
import { calculateTotals, calculateUnitPrice, calculateLineTotal, formatPrice } from './pricing';
import { SHOP_USERS } from './mockData';

interface QuoteFormModalProps {
    mode: 'create' | 'edit';
    initial?: Quote | null;
    onClose: () => void;
    onSave: (quote: Quote) => void;
}

const PRODUCT_OPTIONS: ProductType[] = [
    'vinyl', 'banner', 'acrylic-sign', 'metal-sign', 'rollup', 'sticker', 'interior-signage', 'custom',
];

const MATERIAL_OPTIONS: Material[] = [
    'lonalux', 'vinyl-adhesive', 'vinyl-cast', 'acrylic-3mm', 'acrylic-5mm',
    'acrylic-iluminated', 'pvc', 'aluminium', 'paper-coated', 'custom',
];

const UNIT_OPTIONS: Unit[] = ['cm', 'm'];

function emptyItem(): QuoteItem {
    return {
        id: `i-${Math.random().toString(36).slice(2, 8)}`,
        productType: 'vinyl',
        description: '',
        width: 100,
        height: 50,
        unit: 'cm',
        material: 'vinyl-adhesive',
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0,
    };
}

export default function QuoteFormModal({ mode, initial, onClose, onSave }: QuoteFormModalProps) {
    const { showToast } = useToast();

    const [customer, setCustomer] = useState<QuoteCustomer>(
        initial?.customer ?? { name: '', email: '', phone: '', company: '' },
    );
    const [items, setItems] = useState<QuoteItem[]>(initial?.items ?? [emptyItem()]);
    const [createdBy, setCreatedBy] = useState(initial?.createdBy ?? SHOP_USERS[0]);
    const [validInDays, setValidInDays] = useState(14);
    const [notes, setNotes] = useState(initial?.notes ?? '');
    const [errors, setErrors] = useState<Partial<Record<'customerName' | 'customerEmail' | 'items', string>>>({});

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    /* Recalcular precios cuando cambia un item */
    const updateItem = (id: string, patch: Partial<QuoteItem>) => {
        setItems((prev) =>
            prev.map((it) => {
                if (it.id !== id) return it;
                const next = { ...it, ...patch };
                const unitPrice = calculateUnitPrice({
                    width: next.width,
                    height: next.height,
                    unit: next.unit,
                    material: next.material,
                    quantity: next.quantity,
                });
                const lineTotal = calculateLineTotal(unitPrice, next.quantity);
                return { ...next, unitPrice, lineTotal };
            }),
        );
    };

    const addItem = () => setItems((prev) => [...prev, emptyItem()]);
    const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

    const totals = useMemo(() => calculateTotals(items), [items]);

    const validate = (): boolean => {
        const next: typeof errors = {};
        const nameErr = validateRequired(customer.name, 'El nombre del cliente', 2);
        const emailErr = validateEmail(customer.email);
        if (nameErr) next.customerName = nameErr;
        if (emailErr) next.customerEmail = emailErr;
        if (items.length === 0) {
            next.items = 'Debe agregar al menos un item.';
        } else {
            const invalid = items.some((it) => !it.description.trim() || it.width <= 0 || it.height <= 0 || it.quantity <= 0);
            if (invalid) next.items = 'Hay items con datos incompletos o inválidos.';
        }
        setErrors(next);
        if (Object.keys(next).length > 0) {
            showToast('Revisa los campos marcados.', 'warning');
            return false;
        }
        return true;
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const id = initial?.id ?? `COT-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
        const validUntil = new Date(Date.now() + validInDays * 86400000).toISOString().split('T')[0];

        const quote: Quote = {
            id,
            customer: {
                name: customer.name.trim(),
                email: customer.email.trim().toLowerCase(),
                phone: customer.phone?.trim() || undefined,
                company: customer.company?.trim() || undefined,
            },
            items,
            ...totals,
            taxRate: 0.18,
            status: initial?.status ?? 'draft',
            createdAt: initial?.createdAt ?? new Date().toISOString().split('T')[0],
            sentAt: initial?.sentAt,
            validUntil: initial?.validUntil ?? validUntil,
            respondedAt: initial?.respondedAt,
            convertedAt: initial?.convertedAt,
            convertedToOrderId: initial?.convertedToOrderId,
            createdBy,
            notes: notes.trim() || undefined,
        };
        onSave(quote);
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
                className="w-full max-w-3xl bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[92vh]"
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">
                        {mode === 'create' ? 'Nueva cotización' : `Editar ${initial?.id}`}
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
                    <div className="px-6 py-5 space-y-5">
                        {/* Customer */}
                        <section>
                            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Datos del cliente
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField
                                    id="customerName"
                                    label="Nombre"
                                    placeholder="Ej. Diego Mendoza"
                                    value={customer.name}
                                    onChange={(v) => {
                                        setCustomer({ ...customer, name: v });
                                        if (errors.customerName) setErrors((p) => ({ ...p, customerName: undefined }));
                                    }}
                                    error={errors.customerName}
                                />
                                <FormField
                                    id="customerEmail"
                                    label="Correo electrónico"
                                    type="email"
                                    placeholder="diego@empresa.com"
                                    value={customer.email}
                                    onChange={(v) => {
                                        setCustomer({ ...customer, email: v });
                                        if (errors.customerEmail) setErrors((p) => ({ ...p, customerEmail: undefined }));
                                    }}
                                    error={errors.customerEmail}
                                />
                                <FormField
                                    id="customerPhone"
                                    label="Teléfono"
                                    placeholder="+51 999 999 999"
                                    value={customer.phone ?? ''}
                                    onChange={(v) => setCustomer({ ...customer, phone: v })}
                                    optional
                                />
                                <FormField
                                    id="customerCompany"
                                    label="Empresa"
                                    placeholder="Ej. Acme Corp"
                                    value={customer.company ?? ''}
                                    onChange={(v) => setCustomer({ ...customer, company: v })}
                                    optional
                                />
                            </div>
                        </section>

                        {/* Items */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    Items cotizados
                                    <span className="text-slate-400 font-normal ml-1">({items.length})</span>
                                </h4>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="h-8 px-2.5 bg-white border border-slate-200 text-slate-700 text-[12px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <BsPlus size={14} />
                                    Agregar item
                                </button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <ItemEditor
                                        key={item.id}
                                        index={idx + 1}
                                        item={item}
                                        canRemove={items.length > 1}
                                        onChange={(patch) => updateItem(item.id, patch)}
                                        onRemove={() => removeItem(item.id)}
                                    />
                                ))}
                            </div>

                            {errors.items && (
                                <p className="text-[12px] text-rose-600 mt-2">{errors.items}</p>
                            )}
                        </section>

                        {/* Meta + notes */}
                        <section>
                            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Información adicional
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="createdBy" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                        Creado por
                                    </label>
                                    <select
                                        id="createdBy"
                                        value={createdBy}
                                        onChange={(e) => setCreatedBy(e.target.value)}
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
                                    >
                                        {SHOP_USERS.map((u) => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="validInDays" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                        Válida durante
                                        <span className="text-slate-400 font-normal ml-1">(días)</span>
                                    </label>
                                    <input
                                        id="validInDays"
                                        type="number"
                                        min={1}
                                        max={90}
                                        value={validInDays}
                                        onChange={(e) => setValidInDays(Number(e.target.value))}
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all tabular-nums"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="notes" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                        Notas
                                        <span className="text-slate-400 font-normal ml-1">(opcional)</span>
                                    </label>
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Términos, instrucciones especiales, condiciones de pago..."
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sticky totals + footer */}
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 sticky bottom-0">
                        <div className="flex items-end justify-between gap-3 flex-wrap">
                            <div className="flex items-baseline gap-4 text-[12px]">
                                <div>
                                    <span className="text-slate-500">Subtotal: </span>
                                    <span className="font-semibold text-slate-900 tabular-nums">{formatPrice(totals.subtotal)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">IGV (18%): </span>
                                    <span className="font-semibold text-slate-900 tabular-nums">{formatPrice(totals.tax)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Total: </span>
                                    <span className="text-[15px] font-semibold text-[#1e40af] tabular-nums">{formatPrice(totals.total)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
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
                                    {mode === 'create' ? 'Crear cotización' : 'Guardar cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

/* ---------- Item editor (one row per item) ---------- */

function ItemEditor({
    index,
    item,
    canRemove,
    onChange,
    onRemove,
}: {
    index: number;
    item: QuoteItem;
    canRemove: boolean;
    onChange: (patch: Partial<QuoteItem>) => void;
    onRemove: () => void;
}) {
    return (
        <div className="border border-slate-200 rounded-md bg-slate-50/40 p-3">
            <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Item #{index}
                </span>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label="Quitar item"
                        className="w-6 h-6 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <BsTrash size={11} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                <div className="md:col-span-4">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Tipo</label>
                    <select
                        value={item.productType}
                        onChange={(e) => onChange({ productType: e.target.value as ProductType })}
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded text-[12.5px] text-slate-900 outline-none focus:border-[#1e40af] cursor-pointer"
                    >
                        {PRODUCT_OPTIONS.map((p) => (
                            <option key={p} value={p}>{PRODUCT_TYPE_LABEL[p]}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-8">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Descripción</label>
                    <input
                        type="text"
                        value={item.description}
                        onChange={(e) => onChange({ description: e.target.value })}
                        placeholder="Ej. Banner exterior fachada principal"
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded text-[12.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af]"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Ancho</label>
                    <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={item.width}
                        onChange={(e) => onChange({ width: Number(e.target.value) })}
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded text-[12.5px] text-slate-900 outline-none focus:border-[#1e40af] tabular-nums"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Alto</label>
                    <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={item.height}
                        onChange={(e) => onChange({ height: Number(e.target.value) })}
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded text-[12.5px] text-slate-900 outline-none focus:border-[#1e40af] tabular-nums"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Unidad</label>
                    <select
                        value={item.unit}
                        onChange={(e) => onChange({ unit: e.target.value as Unit })}
                        className="w-full h-9 px-1.5 bg-white border border-slate-200 rounded text-[12.5px] text-slate-900 outline-none focus:border-[#1e40af] cursor-pointer"
                    >
                        {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-4">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Material</label>
                    <select
                        value={item.material}
                        onChange={(e) => onChange({ material: e.target.value as Material })}
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded text-[12.5px] text-slate-900 outline-none focus:border-[#1e40af] cursor-pointer"
                    >
                        {MATERIAL_OPTIONS.map((m) => (
                            <option key={m} value={m}>{MATERIAL_LABEL[m]}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Cantidad</label>
                    <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => onChange({ quantity: Number(e.target.value) })}
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded text-[12.5px] text-slate-900 outline-none focus:border-[#1e40af] tabular-nums"
                    />
                </div>
            </div>

            {/* Live calculation result */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-baseline justify-between gap-3 text-[12px]">
                <div className="text-slate-500">
                    Precio unitario: <span className="font-semibold text-slate-700 tabular-nums">{formatPrice(item.unitPrice)}</span>
                </div>
                <div>
                    <span className="text-slate-500">Subtotal línea: </span>
                    <span className="text-[14px] font-semibold text-[#1e40af] tabular-nums">{formatPrice(item.lineTotal)}</span>
                </div>
            </div>
        </div>
    );
}

/* ---------- Field ---------- */

function FormField({
    id,
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    optional,
}: {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    optional?: boolean;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
                {optional && <span className="text-slate-400 font-normal ml-1">(opcional)</span>}
            </label>
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
