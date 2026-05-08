/**
 * Domain model for quotes (cotizaciones) of a print/signage shop.
 * A quote is the first step of the sales cycle: Cotización → Orden → Producción → Facturación → Pago
 */

export type QuoteStatus =
    | 'draft'      // Borrador interno, no enviado
    | 'sent'       // Enviado al cliente, esperando respuesta
    | 'approved'   // Cliente aprobó la cotización
    | 'rejected'   // Cliente rechazó
    | 'expired'    // Pasó la fecha de validez sin respuesta
    | 'converted'; // Ya se convirtió a una orden

export type ProductType =
    | 'vinyl'             // Vinilo adhesivo / decorativo
    | 'banner'            // Banner lonalux, vinilo banner
    | 'acrylic-sign'      // Letrero acrílico iluminado o no
    | 'metal-sign'        // Letrero metálico
    | 'rollup'            // Roll-up portátil
    | 'sticker'           // Stickers / etiquetas
    | 'interior-signage'  // Señalética interior (placas, direccionales)
    | 'custom';           // Personalizado

export type Material =
    | 'lonalux'           // Lona lux (banners exteriores)
    | 'vinyl-adhesive'    // Vinilo adhesivo estándar
    | 'vinyl-cast'        // Vinilo fundido (alta durabilidad)
    | 'acrylic-3mm'       // Acrílico 3mm
    | 'acrylic-5mm'       // Acrílico 5mm
    | 'acrylic-iluminated' // Acrílico con iluminación LED
    | 'pvc'               // PVC espumado / forex
    | 'aluminium'         // Aluminio compuesto
    | 'paper-coated'      // Papel couché (stickers)
    | 'custom';

export type Unit = 'cm' | 'm';

export interface QuoteItem {
    id: string;
    productType: ProductType;
    description: string;
    width: number;        // en `unit`
    height: number;       // en `unit`
    unit: Unit;
    material: Material;
    quantity: number;
    /** Precio unitario calculado (€/unidad) — editable manualmente si se quiere */
    unitPrice: number;
    /** Total línea = unitPrice × quantity */
    lineTotal: number;
    /** Notas internas opcionales */
    notes?: string;
}

export interface QuoteCustomer {
    name: string;
    email: string;
    phone?: string;
    company?: string;
}

export interface Quote {
    id: string;                     // 'COT-2026-118'
    customer: QuoteCustomer;
    items: QuoteItem[];
    subtotal: number;
    taxRate: number;                // 0.18 = 18% IGV PE
    tax: number;
    total: number;
    status: QuoteStatus;
    createdAt: string;              // ISO date
    sentAt?: string;
    validUntil?: string;
    respondedAt?: string;
    convertedAt?: string;           // cuando pasó a orden
    convertedToOrderId?: string;    // ID de la orden generada
    createdBy: string;              // empleado que creó
    notes?: string;                 // notas internas / términos
    rejectionReason?: string;
}

/* ---------- Static catalogs (used by UI for selects + price calculator) ---------- */

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
    vinyl: 'Vinilo decorativo',
    banner: 'Banner / Lona',
    'acrylic-sign': 'Letrero acrílico',
    'metal-sign': 'Letrero metálico',
    rollup: 'Roll-up',
    sticker: 'Sticker / Etiqueta',
    'interior-signage': 'Señalética interior',
    custom: 'Personalizado',
};

export const MATERIAL_LABEL: Record<Material, string> = {
    lonalux: 'Lonalux 13 oz',
    'vinyl-adhesive': 'Vinilo adhesivo',
    'vinyl-cast': 'Vinilo fundido',
    'acrylic-3mm': 'Acrílico 3 mm',
    'acrylic-5mm': 'Acrílico 5 mm',
    'acrylic-iluminated': 'Acrílico iluminado LED',
    pvc: 'PVC espumado',
    aluminium: 'Aluminio compuesto',
    'paper-coated': 'Papel couché',
    custom: 'Personalizado',
};

export const STATUS_CONFIG: Record<QuoteStatus, { text: string; cls: string; dot: string }> = {
    draft: { text: 'Borrador', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
    sent: { text: 'Enviada', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
    approved: { text: 'Aprobada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    rejected: { text: 'Rechazada', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    expired: { text: 'Expirada', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    converted: { text: 'Convertida', cls: 'bg-[#1e40af]/10 text-[#1e40af] border-[#1e40af]/20', dot: 'bg-[#1e40af]' },
};
