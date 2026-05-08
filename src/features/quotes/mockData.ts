import type { Quote } from './types';
import { calculateTotals, calculateUnitPrice, calculateLineTotal } from './pricing';

function buildItem(input: {
    id: string;
    productType: Quote['items'][number]['productType'];
    description: string;
    width: number;
    height: number;
    unit: 'cm' | 'm';
    material: Quote['items'][number]['material'];
    quantity: number;
}): Quote['items'][number] {
    const unitPrice = calculateUnitPrice(input);
    const lineTotal = calculateLineTotal(unitPrice, input.quantity);
    return { ...input, unitPrice, lineTotal };
}

function buildQuote(quote: Omit<Quote, 'subtotal' | 'tax' | 'total'>): Quote {
    const totals = calculateTotals(quote.items);
    return { ...quote, ...totals };
}

export const INITIAL_QUOTES: Quote[] = [
    buildQuote({
        id: 'COT-2026-118',
        customer: { name: 'Diego Mendoza', email: 'diego@acmecorp.pe', phone: '+51 999 111 222', company: 'Acme Corp' },
        items: [
            buildItem({
                id: 'i1',
                productType: 'banner',
                description: 'Banner exterior fachada principal',
                width: 4,
                height: 2,
                unit: 'm',
                material: 'lonalux',
                quantity: 2,
            }),
            buildItem({
                id: 'i2',
                productType: 'vinyl',
                description: 'Vinilo decorativo escaparate',
                width: 250,
                height: 180,
                unit: 'cm',
                material: 'vinyl-cast',
                quantity: 1,
            }),
        ],
        status: 'sent',
        createdAt: '2026-05-04',
        sentAt: '2026-05-04',
        validUntil: '2026-05-18',
        createdBy: 'Anna Schmidt',
        notes: 'Cliente solicita instalación en horario nocturno.',
        taxRate: 0.18,
    }),
    buildQuote({
        id: 'COT-2026-117',
        customer: { name: 'Sofía Castro', email: 'sofia@centromedico.pe', phone: '+51 999 333 444', company: 'Centro Médico Lima' },
        items: [
            buildItem({
                id: 'i1',
                productType: 'interior-signage',
                description: 'Señalética direccional pisos 1-5',
                width: 30,
                height: 20,
                unit: 'cm',
                material: 'pvc',
                quantity: 25,
            }),
            buildItem({
                id: 'i2',
                productType: 'acrylic-sign',
                description: 'Letrero recepción acrílico',
                width: 80,
                height: 30,
                unit: 'cm',
                material: 'acrylic-iluminated',
                quantity: 1,
            }),
        ],
        status: 'approved',
        createdAt: '2026-05-02',
        sentAt: '2026-05-02',
        validUntil: '2026-05-16',
        respondedAt: '2026-05-06',
        createdBy: 'Hans Weber',
        taxRate: 0.18,
    }),
    buildQuote({
        id: 'COT-2026-116',
        customer: { name: 'Marco Rossi', email: 'marco@oceanic.it', company: 'Oceanic Brands' },
        items: [
            buildItem({
                id: 'i1',
                productType: 'rollup',
                description: 'Roll-up para evento corporativo',
                width: 80,
                height: 200,
                unit: 'cm',
                material: 'lonalux',
                quantity: 4,
            }),
        ],
        status: 'rejected',
        createdAt: '2026-04-28',
        sentAt: '2026-04-28',
        validUntil: '2026-05-12',
        respondedAt: '2026-05-01',
        createdBy: 'Anna Schmidt',
        rejectionReason: 'Cliente eligió otro proveedor por tiempo de entrega.',
        taxRate: 0.18,
    }),
    buildQuote({
        id: 'COT-2026-115',
        customer: { name: 'Lucía Vargas', email: 'lucia@bellavista.pe', phone: '+51 988 777 666', company: 'Bellavista Boutique' },
        items: [
            buildItem({
                id: 'i1',
                productType: 'vinyl',
                description: 'Logo vinilo para escaparate',
                width: 150,
                height: 100,
                unit: 'cm',
                material: 'vinyl-cast',
                quantity: 1,
            }),
            buildItem({
                id: 'i2',
                productType: 'sticker',
                description: 'Stickers promocionales 10x10cm',
                width: 10,
                height: 10,
                unit: 'cm',
                material: 'paper-coated',
                quantity: 500,
            }),
        ],
        status: 'converted',
        createdAt: '2026-04-22',
        sentAt: '2026-04-22',
        validUntil: '2026-05-06',
        respondedAt: '2026-04-25',
        convertedAt: '2026-04-26',
        convertedToOrderId: 'OR-2026-040',
        createdBy: 'Hans Weber',
        taxRate: 0.18,
    }),
    buildQuote({
        id: 'COT-2026-114',
        customer: { name: 'Klaus Bauer', email: 'klaus@printforce.de', company: 'PrintForce GmbH' },
        items: [
            buildItem({
                id: 'i1',
                productType: 'metal-sign',
                description: 'Letrero metálico fachada — Aluminio',
                width: 200,
                height: 80,
                unit: 'cm',
                material: 'aluminium',
                quantity: 1,
            }),
        ],
        status: 'expired',
        createdAt: '2026-04-10',
        sentAt: '2026-04-10',
        validUntil: '2026-04-24',
        createdBy: 'Anna Schmidt',
        taxRate: 0.18,
    }),
    buildQuote({
        id: 'COT-2026-113',
        customer: { name: 'Patricia Rojas', email: 'patricia@miempresa.pe' },
        items: [
            buildItem({
                id: 'i1',
                productType: 'vinyl',
                description: 'Vinilo cortado logos x12',
                width: 30,
                height: 30,
                unit: 'cm',
                material: 'vinyl-adhesive',
                quantity: 12,
            }),
        ],
        status: 'draft',
        createdAt: '2026-05-08',
        createdBy: 'Anna Schmidt',
        taxRate: 0.18,
    }),
    buildQuote({
        id: 'COT-2026-112',
        customer: { name: 'Mia Thompson', email: 'mia@designworks.com.au', company: 'DesignWorks AU' },
        items: [
            buildItem({
                id: 'i1',
                productType: 'banner',
                description: 'Banner publicitario 6x3m',
                width: 6,
                height: 3,
                unit: 'm',
                material: 'lonalux',
                quantity: 3,
            }),
            buildItem({
                id: 'i2',
                productType: 'rollup',
                description: 'Roll-up congresos x8',
                width: 85,
                height: 200,
                unit: 'cm',
                material: 'lonalux',
                quantity: 8,
            }),
        ],
        status: 'sent',
        createdAt: '2026-05-06',
        sentAt: '2026-05-06',
        validUntil: '2026-05-20',
        createdBy: 'Anna Schmidt',
        taxRate: 0.18,
    }),
    buildQuote({
        id: 'COT-2026-111',
        customer: { name: 'Olaf Nilsen', email: 'olaf@nordicsigns.no', company: 'Nordic Signs AS' },
        items: [
            buildItem({
                id: 'i1',
                productType: 'interior-signage',
                description: 'Señalética direccional escaleras',
                width: 25,
                height: 25,
                unit: 'cm',
                material: 'pvc',
                quantity: 8,
            }),
        ],
        status: 'approved',
        createdAt: '2026-04-30',
        sentAt: '2026-04-30',
        validUntil: '2026-05-14',
        respondedAt: '2026-05-03',
        createdBy: 'Hans Weber',
        taxRate: 0.18,
    }),
];

/** Lista de empleados de la empresa que pueden crear cotizaciones (para el select "Creado por") */
export const SHOP_USERS = ['Hans Weber', 'Anna Schmidt', 'Diego Ramos'];
