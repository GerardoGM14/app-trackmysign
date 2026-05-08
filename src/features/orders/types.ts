/**
 * Domain model for production orders (órdenes de producción).
 * Created from approved Quotes. Flow: pending → in_design → in_production → ready → delivered
 */

import type { QuoteCustomer, QuoteItem } from '../quotes/types';

export type OrderStatus =
    | 'pending'        // Recién creada, aún no se inicia diseño
    | 'in_design'      // En diseño / arte
    | 'in_production'  // En producción (impresión, corte, montaje)
    | 'ready'          // Lista para entrega / retiro
    | 'delivered'      // Entregada al cliente
    | 'cancelled';     // Cancelada

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface OrderProof {
    id: string;
    /** dataURL de la imagen de la prueba (mock) */
    imageUrl: string;
    sentAt: string;
    status: 'pending' | 'approved' | 'rejected';
    respondedAt?: string;
    rejectionReason?: string;
    /** dataURL de la firma del cliente al aprobar */
    signature?: string;
    notes?: string;
}

export interface StatusChange {
    from: OrderStatus | null;
    to: OrderStatus;
    at: string;        // ISO datetime
    by: string;        // employee
    note?: string;
}

export interface Order {
    id: string;                 // 'OR-2026-XXX'
    fromQuoteId?: string;       // ID de la cotización origen
    customer: QuoteCustomer;
    items: QuoteItem[];
    subtotal: number;
    tax: number;
    total: number;
    taxRate: number;
    status: OrderStatus;
    priority: Priority;
    assignedTo?: string;        // employee responsable
    dueDate?: string;           // fecha límite de entrega
    createdAt: string;
    deliveredAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
    productionNotes?: string;   // notas internas del taller
    history: StatusChange[];    // timeline de cambios de estado
    proofs: OrderProof[];       // pruebas enviadas al cliente (Fase 4)
}

export const STATUS_CONFIG: Record<OrderStatus, { text: string; cls: string; dot: string; columnBg: string }> = {
    pending: {
        text: 'Pendiente',
        cls: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
        columnBg: 'bg-slate-100/40',
    },
    in_design: {
        text: 'En diseño',
        cls: 'bg-violet-50 text-violet-700 border-violet-200',
        dot: 'bg-violet-500',
        columnBg: 'bg-violet-50/40',
    },
    in_production: {
        text: 'En producción',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        columnBg: 'bg-amber-50/40',
    },
    ready: {
        text: 'Lista',
        cls: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
        columnBg: 'bg-sky-50/40',
    },
    delivered: {
        text: 'Entregada',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        columnBg: 'bg-emerald-50/40',
    },
    cancelled: {
        text: 'Cancelada',
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        columnBg: 'bg-rose-50/40',
    },
};

/** Estados visibles en el Kanban (sin cancelled, que se filtra aparte) */
export const KANBAN_STATUSES: OrderStatus[] = ['pending', 'in_design', 'in_production', 'ready', 'delivered'];

export const PRIORITY_CONFIG: Record<Priority, { text: string; cls: string; dot: string }> = {
    low: { text: 'Baja', cls: 'text-slate-500', dot: 'bg-slate-300' },
    normal: { text: 'Normal', cls: 'text-slate-600', dot: 'bg-slate-400' },
    high: { text: 'Alta', cls: 'text-amber-700', dot: 'bg-amber-500' },
    urgent: { text: 'Urgente', cls: 'text-rose-700', dot: 'bg-rose-500' },
};
