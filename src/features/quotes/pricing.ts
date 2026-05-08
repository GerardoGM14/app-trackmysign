import type { Material, QuoteItem, Unit } from './types';

/**
 * Mock pricing rules. In a real app this would come from the shop's master config.
 * Returns price per square meter (€/m²) of finished product including material.
 */
const MATERIAL_PRICE_PER_M2: Record<Material, number> = {
    lonalux: 18,
    'vinyl-adhesive': 24,
    'vinyl-cast': 38,
    'acrylic-3mm': 65,
    'acrylic-5mm': 95,
    'acrylic-iluminated': 220,
    pvc: 45,
    aluminium: 80,
    'paper-coated': 12,
    custom: 50,
};

/** Setup fee per item (handling, design, packaging) */
const SETUP_FEE = 8;

/** Minimum charge per item */
const MIN_CHARGE = 15;

function toMeters(value: number, unit: Unit): number {
    return unit === 'cm' ? value / 100 : value;
}

/**
 * Calculate the unit price for a single item based on its dimensions, material and quantity.
 * - Bigger areas → linear material cost
 * - Higher quantities → small bulk discount tier
 * Returns price per unit (single piece), not the line total.
 */
export function calculateUnitPrice(input: {
    width: number;
    height: number;
    unit: Unit;
    material: Material;
    quantity: number;
}): number {
    const w = toMeters(input.width, input.unit);
    const h = toMeters(input.height, input.unit);
    const areaM2 = w * h;

    if (areaM2 <= 0) return 0;

    const ratePerM2 = MATERIAL_PRICE_PER_M2[input.material] ?? MATERIAL_PRICE_PER_M2.custom;
    let unitPrice = areaM2 * ratePerM2 + SETUP_FEE;

    // Bulk discount tiers
    if (input.quantity >= 50) unitPrice *= 0.85;
    else if (input.quantity >= 20) unitPrice *= 0.92;
    else if (input.quantity >= 10) unitPrice *= 0.96;

    return Math.max(MIN_CHARGE, Math.round(unitPrice * 100) / 100);
}

/** Returns line total = unitPrice × quantity, rounded to 2 decimals */
export function calculateLineTotal(unitPrice: number, quantity: number): number {
    return Math.round(unitPrice * quantity * 100) / 100;
}

/** Calculates subtotal, tax (18% IGV PE) and total of a list of items */
export function calculateTotals(items: QuoteItem[], taxRate = 0.18) {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax,
        total,
    };
}

/** Recalculates an item's prices when its inputs change */
export function recalculateItem(item: QuoteItem): QuoteItem {
    const unitPrice = calculateUnitPrice({
        width: item.width,
        height: item.height,
        unit: item.unit,
        material: item.material,
        quantity: item.quantity,
    });
    const lineTotal = calculateLineTotal(unitPrice, item.quantity);
    return { ...item, unitPrice, lineTotal };
}

/** Format price as €1,234.56 */
export function formatPrice(value: number): string {
    return value.toLocaleString('es-PE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
