import type { Order, OrderStatus, Priority } from './types';
import { calculateUnitPrice, calculateLineTotal, calculateTotals } from '../quotes/pricing';
import type { ProductType, Material } from '../quotes/types';

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

function build(order: Omit<Order, 'subtotal' | 'tax' | 'total'>): Order {
    const totals = calculateTotals(order.items);
    return { ...order, ...totals };
}

const today = new Date();
function inDays(days: number): string {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

export const INITIAL_ORDERS: Order[] = [
    build({
        id: 'OR-2026-040',
        fromQuoteId: 'COT-2026-115',
        customer: { name: 'Lucía Vargas', email: 'lucia@bellavista.pe', phone: '+51 988 777 666', company: 'Bellavista Boutique' },
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
            { from: null, to: 'pending', at: inDays(-5), by: 'Hans Weber', note: 'Convertida desde COT-2026-115' },
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
        ],
    }),
    build({
        id: 'OR-2026-039',
        customer: { name: 'James Park', email: 'james@plazasur.pe', company: 'Edificio Plaza Sur' },
        items: [
            buildItem({ id: 'i1', productType: 'interior-signage', description: 'Señalética interior pisos 1-12', width: 30, height: 20, unit: 'cm', material: 'pvc', quantity: 48 }),
        ],
        status: 'in_design',
        priority: 'normal',
        assignedTo: 'Diego Ramos',
        dueDate: inDays(8),
        createdAt: inDays(-3),
        taxRate: 0.18,
        productionNotes: 'Cliente solicita acabado mate.',
        history: [
            { from: null, to: 'pending', at: inDays(-3), by: 'Hans Weber' },
            { from: 'pending', to: 'in_design', at: inDays(-2), by: 'Diego Ramos' },
        ],
        proofs: [
            {
                id: 'pf-039-1',
                imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=80&w=800',
                sentAt: inDays(-1),
                status: 'pending',
                notes: 'Propuesta de señalética para piso 1. Revisar tipografía y contraste.',
            },
            {
                id: 'pf-039-2',
                imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&q=80&w=800',
                sentAt: inDays(-2),
                status: 'rejected',
                respondedAt: inDays(-1),
                rejectionReason: 'El color azul es más oscuro que el de la marca. Ajustar a Pantone 2935 C.',
            },
        ],
    }),
    build({
        id: 'OR-2026-038',
        customer: { name: 'María Silva', email: 'maria@centromedico.pe', company: 'Centro Médico Lima' },
        items: [
            buildItem({ id: 'i1', productType: 'banner', description: 'Banner roll-up 80x200cm', width: 80, height: 200, unit: 'cm', material: 'lonalux', quantity: 4 }),
        ],
        status: 'ready',
        priority: 'normal',
        assignedTo: 'Anna Schmidt',
        dueDate: inDays(1),
        createdAt: inDays(-7),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-7), by: 'Hans Weber' },
            { from: 'pending', to: 'in_design', at: inDays(-6), by: 'Anna Schmidt' },
            { from: 'in_design', to: 'in_production', at: inDays(-4), by: 'Anna Schmidt' },
            { from: 'in_production', to: 'ready', at: inDays(-1), by: 'Anna Schmidt', note: 'Listo para retiro o entrega' },
        ],
        proofs: [],
    }),
    build({
        id: 'OR-2026-037',
        customer: { name: 'Carlos López', email: 'carlos@beta.io', company: 'Beta Industries' },
        items: [
            buildItem({ id: 'i1', productType: 'acrylic-sign', description: 'Letrero acrílico iluminado fachada', width: 200, height: 80, unit: 'cm', material: 'acrylic-iluminated', quantity: 1 }),
        ],
        status: 'pending',
        priority: 'urgent',
        assignedTo: undefined,
        dueDate: inDays(5),
        createdAt: inDays(-1),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-1), by: 'Hans Weber', note: 'Cliente solicita entrega urgente' },
        ],
        proofs: [],
    }),
    build({
        id: 'OR-2026-036',
        customer: { name: 'Ana Pérez', email: 'ana@acmecorp.pe', company: 'Acme Corp' },
        items: [
            buildItem({ id: 'i1', productType: 'banner', description: 'Banner exterior fachada principal', width: 4, height: 2, unit: 'm', material: 'lonalux', quantity: 2 }),
            buildItem({ id: 'i2', productType: 'vinyl', description: 'Vinilo decorativo escaparate', width: 250, height: 180, unit: 'cm', material: 'vinyl-cast', quantity: 1 }),
        ],
        status: 'delivered',
        priority: 'normal',
        assignedTo: 'Hans Weber',
        dueDate: inDays(-2),
        createdAt: inDays(-15),
        deliveredAt: inDays(-2),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-15), by: 'Hans Weber' },
            { from: 'pending', to: 'in_design', at: inDays(-14), by: 'Anna Schmidt' },
            { from: 'in_design', to: 'in_production', at: inDays(-10), by: 'Anna Schmidt' },
            { from: 'in_production', to: 'ready', at: inDays(-4), by: 'Hans Weber' },
            { from: 'ready', to: 'delivered', at: inDays(-2), by: 'Hans Weber', note: 'Instalación completada' },
        ],
        proofs: [],
    }),
    build({
        id: 'OR-2026-035',
        customer: { name: 'Patricia Rojas', email: 'patricia@miempresa.pe', company: 'Boutique Lima Centro' },
        items: [
            buildItem({ id: 'i1', productType: 'vinyl', description: 'Vinilo decorativo escaparate', width: 300, height: 200, unit: 'cm', material: 'vinyl-cast', quantity: 1 }),
        ],
        status: 'in_production',
        priority: 'normal',
        assignedTo: 'Anna Schmidt',
        dueDate: inDays(7),
        createdAt: inDays(-4),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-4), by: 'Hans Weber' },
            { from: 'pending', to: 'in_design', at: inDays(-3), by: 'Anna Schmidt' },
            { from: 'in_design', to: 'in_production', at: inDays(-1), by: 'Anna Schmidt' },
        ],
        proofs: [],
    }),
    build({
        id: 'OR-2026-034',
        customer: { name: 'Mia Thompson', email: 'mia@designworks.com.au', company: 'DesignWorks AU' },
        items: [
            buildItem({ id: 'i1', productType: 'rollup', description: 'Roll-up congresos x8', width: 85, height: 200, unit: 'cm', material: 'lonalux', quantity: 8 }),
        ],
        status: 'pending',
        priority: 'low',
        assignedTo: undefined,
        dueDate: inDays(14),
        createdAt: inDays(0),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(0), by: 'Anna Schmidt' },
        ],
        proofs: [],
    }),
    build({
        id: 'OR-2026-033',
        customer: { name: 'Olaf Nilsen', email: 'olaf@nordicsigns.no', company: 'Nordic Signs AS' },
        items: [
            buildItem({ id: 'i1', productType: 'interior-signage', description: 'Señalética escaleras edificio', width: 25, height: 25, unit: 'cm', material: 'pvc', quantity: 8 }),
        ],
        status: 'in_design',
        priority: 'normal',
        assignedTo: 'Diego Ramos',
        dueDate: inDays(10),
        createdAt: inDays(-2),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-2), by: 'Hans Weber' },
            { from: 'pending', to: 'in_design', at: inDays(-1), by: 'Diego Ramos' },
        ],
        proofs: [],
    }),
    build({
        id: 'OR-2026-032',
        customer: { name: 'Klaus Bauer', email: 'klaus@printforce.de', company: 'PrintForce GmbH' },
        items: [
            buildItem({ id: 'i1', productType: 'metal-sign', description: 'Letrero metálico fachada', width: 200, height: 80, unit: 'cm', material: 'aluminium', quantity: 1 }),
        ],
        status: 'ready',
        priority: 'high',
        assignedTo: 'Hans Weber',
        dueDate: inDays(2),
        createdAt: inDays(-9),
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-9), by: 'Hans Weber' },
            { from: 'pending', to: 'in_design', at: inDays(-8), by: 'Anna Schmidt' },
            { from: 'in_design', to: 'in_production', at: inDays(-5), by: 'Anna Schmidt' },
            { from: 'in_production', to: 'ready', at: inDays(-2), by: 'Hans Weber' },
        ],
        proofs: [],
    }),
    build({
        id: 'OR-2026-031',
        customer: { name: 'Marco Rossi', email: 'marco@oceanic.it', company: 'Oceanic Brands' },
        items: [
            buildItem({ id: 'i1', productType: 'rollup', description: 'Roll-up evento corporativo', width: 80, height: 200, unit: 'cm', material: 'lonalux', quantity: 4 }),
        ],
        status: 'cancelled',
        priority: 'normal',
        assignedTo: undefined,
        dueDate: undefined,
        createdAt: inDays(-12),
        cancelledAt: inDays(-10),
        cancelReason: 'Cliente canceló el evento.',
        taxRate: 0.18,
        history: [
            { from: null, to: 'pending', at: inDays(-12), by: 'Anna Schmidt' },
            { from: 'pending', to: 'cancelled', at: inDays(-10), by: 'Hans Weber', note: 'Cliente canceló el evento' },
        ],
        proofs: [],
    }),
];

/** Determina urgencia visual según fecha límite */
export function getDueUrgency(dueDate?: string): { tone: 'overdue' | 'urgent' | 'soon' | 'normal'; daysLeft: number | null } {
    if (!dueDate) return { tone: 'normal', daysLeft: null };
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { tone: 'overdue', daysLeft: days };
    if (days <= 2) return { tone: 'urgent', daysLeft: days };
    if (days <= 5) return { tone: 'soon', daysLeft: days };
    return { tone: 'normal', daysLeft: days };
}

export type { OrderStatus, Priority };
