/**
 * Mock data para la vista del Customer.
 * Simula que el usuario actual es "Lucía Vargas / Bellavista Boutique" (client@customer.com).
 * Incluye: cotizaciones recibidas, órdenes en curso, pruebas para aprobar.
 */

import type { Quote } from '../quotes/types';
import type { Order, OrderProof } from '../orders/types';
import { calculateUnitPrice, calculateLineTotal, calculateTotals } from '../quotes/pricing';
import type { ProductType, Material } from '../quotes/types';

export const CUSTOMER_PROFILE = {
    name: 'Lucía Vargas',
    email: 'client@customer.com',
    phone: '+51 988 777 666',
    company: 'Bellavista Boutique',
    address: 'Av. La Marina 2547, San Miguel — Lima, Perú',
    contactSince: '2024-08-12',
};

const today = new Date();
function inDays(days: number): string {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function buildItem(input: {
    id: string;
    productType: ProductType;
    description: string;
    width: number;
    height: number;
    unit: 'cm' | 'm';
    material: Material;
    quantity: number;
}) {
    const unitPrice = calculateUnitPrice(input);
    const lineTotal = calculateLineTotal(unitPrice, input.quantity);
    return { ...input, unitPrice, lineTotal };
}

function buildQuote(q: Omit<Quote, 'subtotal' | 'tax' | 'total'>): Quote {
    const totals = calculateTotals(q.items);
    return { ...q, ...totals };
}

function buildOrder(o: Omit<Order, 'subtotal' | 'tax' | 'total'>): Order {
    const totals = calculateTotals(o.items);
    return { ...o, ...totals };
}

const customer = {
    name: CUSTOMER_PROFILE.name,
    email: CUSTOMER_PROFILE.email,
    phone: CUSTOMER_PROFILE.phone,
    company: CUSTOMER_PROFILE.company,
};

/* ---------------- Cotizaciones del cliente ---------------- */

export const CUSTOMER_QUOTES: Quote[] = [
    buildQuote({
        id: 'COT-2026-118',
        customer,
        items: [
            buildItem({ id: 'i1', productType: 'banner', description: 'Banner exterior fachada principal', width: 4, height: 2, unit: 'm', material: 'lonalux', quantity: 2 }),
            buildItem({ id: 'i2', productType: 'rollup', description: 'Roll-up evento aniversario', width: 80, height: 200, unit: 'cm', material: 'lonalux', quantity: 4 }),
        ],
        status: 'sent',
        taxRate: 0.18,
        createdAt: inDays(-2),
        sentAt: inDays(-2),
        validUntil: inDays(12),
        createdBy: 'Anna Schmidt',
        notes: 'Incluye instalación dentro de Lima Metropolitana.',
    }),
    buildQuote({
        id: 'COT-2026-115',
        customer,
        items: [
            buildItem({ id: 'i1', productType: 'vinyl', description: 'Logo vinilo escaparate', width: 150, height: 100, unit: 'cm', material: 'vinyl-cast', quantity: 1 }),
            buildItem({ id: 'i2', productType: 'sticker', description: 'Stickers promocionales 10x10cm', width: 10, height: 10, unit: 'cm', material: 'paper-coated', quantity: 500 }),
        ],
        status: 'converted',
        taxRate: 0.18,
        createdAt: inDays(-8),
        sentAt: inDays(-8),
        validUntil: inDays(7),
        respondedAt: inDays(-6),
        convertedAt: inDays(-5),
        convertedToOrderId: 'OR-2026-040',
        createdBy: 'Hans Weber',
    }),
    buildQuote({
        id: 'COT-2026-101',
        customer,
        items: [
            buildItem({ id: 'i1', productType: 'interior-signage', description: 'Señalética probadores', width: 25, height: 25, unit: 'cm', material: 'pvc', quantity: 6 }),
        ],
        status: 'rejected',
        taxRate: 0.18,
        createdAt: inDays(-25),
        sentAt: inDays(-25),
        validUntil: inDays(-10),
        respondedAt: inDays(-22),
        rejectionReason: 'Presupuesto fuera del rango previsto este trimestre.',
        createdBy: 'Anna Schmidt',
    }),
];

/* ---------------- Órdenes del cliente ---------------- */

export const CUSTOMER_ORDERS: Order[] = [
    buildOrder({
        id: 'OR-2026-040',
        fromQuoteId: 'COT-2026-115',
        customer,
        items: [
            buildItem({ id: 'i1', productType: 'vinyl', description: 'Logo vinilo escaparate', width: 150, height: 100, unit: 'cm', material: 'vinyl-cast', quantity: 1 }),
            buildItem({ id: 'i2', productType: 'sticker', description: 'Stickers promocionales 10x10cm', width: 10, height: 10, unit: 'cm', material: 'paper-coated', quantity: 500 }),
        ],
        status: 'in_production',
        priority: 'high',
        assignedTo: 'Anna Schmidt',
        dueDate: inDays(3),
        createdAt: inDays(-5),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-5), by: 'Hans Weber' },
            { from: 'pending', to: 'in_design', at: inDays(-4), by: 'Anna Schmidt' },
            { from: 'in_design', to: 'in_production', at: inDays(-2), by: 'Anna Schmidt', note: 'Diseño aprobado por cliente' },
        ],
        proofs: [
            {
                id: 'pf-040-1',
                imageUrl: 'https://images.unsplash.com/photo-1523474438810-b04a2480633c?auto=format&fit=crop&q=80&w=800',
                sentAt: inDays(-3),
                status: 'approved',
                respondedAt: inDays(-2),
                notes: 'Primera versión del logo en vinilo para escaparate.',
            },
            {
                id: 'pf-040-2',
                imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=80&w=800',
                sentAt: inDays(-1),
                status: 'pending',
                notes: 'Mockup final del vinilo aplicado en escaparate, vista frontal.',
            },
        ],
    }),
    buildOrder({
        id: 'OR-2026-021',
        customer,
        items: [
            buildItem({ id: 'i1', productType: 'banner', description: 'Banner promo verano', width: 3, height: 1.5, unit: 'm', material: 'lonalux', quantity: 1 }),
        ],
        status: 'delivered',
        priority: 'normal',
        assignedTo: 'Hans Weber',
        dueDate: inDays(-12),
        createdAt: inDays(-30),
        deliveredAt: inDays(-12),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-30), by: 'Hans Weber' },
            { from: 'pending', to: 'in_design', at: inDays(-28), by: 'Anna Schmidt' },
            { from: 'in_design', to: 'in_production', at: inDays(-22), by: 'Anna Schmidt' },
            { from: 'in_production', to: 'ready', at: inDays(-14), by: 'Hans Weber' },
            { from: 'ready', to: 'delivered', at: inDays(-12), by: 'Hans Weber', note: 'Entregado en tienda' },
        ],
        proofs: [
            {
                id: 'pf-021-1',
                imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&q=80&w=800',
                sentAt: inDays(-26),
                status: 'approved',
                respondedAt: inDays(-25),
                notes: 'Banner promo verano, propuesta final.',
            },
        ],
    }),
    buildOrder({
        id: 'OR-2026-008',
        customer,
        items: [
            buildItem({ id: 'i1', productType: 'interior-signage', description: 'Señalética cambiadores', width: 20, height: 20, unit: 'cm', material: 'pvc', quantity: 4 }),
        ],
        status: 'pending',
        priority: 'normal',
        dueDate: inDays(15),
        createdAt: inDays(-1),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-1), by: 'Anna Schmidt' },
        ],
        proofs: [],
    }),
];

/** Devuelve solo las pruebas pendientes de respuesta del cliente. */
export function getPendingProofs(orders: Order[]): Array<{ order: Order; proof: OrderProof }> {
    const out: Array<{ order: Order; proof: OrderProof }> = [];
    orders.forEach((o) => {
        o.proofs.filter((p) => p.status === 'pending').forEach((p) => out.push({ order: o, proof: p }));
    });
    return out.sort((a, b) => (a.proof.sentAt < b.proof.sentAt ? 1 : -1));
}
