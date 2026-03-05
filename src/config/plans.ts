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
    maxUsers: number;
    storageGB: number;
    historyDays: number; // -1 for unlimited
    features: Feature[];
}

export const PLANS_CONFIG: Record<string, PlanConfig> = {
    starter: {
        id: 'starter',
        name: 'Starter',
        maxUsers: 3,
        storageGB: 5,
        historyDays: 7,
        features: [
            'standard_tracking',
            'basic_metrics',
            'predefined_roles'
        ]
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        maxUsers: 30,
        storageGB: 30,
        historyDays: -1,
        features: [
            'standard_tracking',
            'bulk_management',
            'advanced_analytics',
            'custom_roles',
            'api_access',
            'branding'
        ]
    }
};
