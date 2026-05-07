export type Feature =
    | 'standard_tracking'
    | 'basic_metrics'
    | 'predefined_roles'
    | 'bulk_management'
    | 'advanced_analytics'
    | 'custom_roles'
    | 'api_access'
    | 'branding';

export interface PlanConfig {
    id: string;
    name: string;
    /** Monthly price in EUR. 0 means free. */
    price: number;
    /** Short marketing description shown to end users. */
    description: string;
    maxUsers: number;
    /** -1 means unlimited */
    storageGB: number;
    /** -1 means unlimited */
    historyDays: number;
    /** Internal feature flags used by usePlan() */
    features: Feature[];
    /** Bullet-point copy shown publicly (Register, Landing) — already translated. */
    displayedFeatures: string[];
    /** Marks the plan as "highlighted" in marketing UIs */
    highlighted?: boolean;
}

export const DEFAULT_PLANS: Record<string, PlanConfig> = {
    starter: {
        id: 'starter',
        name: 'Starter',
        price: 0,
        description: 'Ideal para equipos pequeños que están empezando.',
        maxUsers: 3,
        storageGB: 5,
        historyDays: 7,
        features: ['standard_tracking', 'basic_metrics', 'predefined_roles'],
        displayedFeatures: [
            'Hasta 3 usuarios',
            '5 GB de almacenamiento',
            '7 días de historial',
            'Roles predefinidos',
        ],
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99,
        description: 'Para organizaciones con operaciones complejas.',
        maxUsers: 30,
        storageGB: 30,
        historyDays: -1,
        features: [
            'standard_tracking',
            'bulk_management',
            'advanced_analytics',
            'custom_roles',
            'api_access',
            'branding',
        ],
        displayedFeatures: [
            'Hasta 30 usuarios',
            '30 GB de almacenamiento',
            'Historial ilimitado',
            'Analítica avanzada',
            'Roles personalizados',
            'Acceso a la API',
        ],
        highlighted: true,
    },
};

/** Backwards-compat alias for code that imports PLANS_CONFIG */
export const PLANS_CONFIG = DEFAULT_PLANS;
