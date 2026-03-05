import { useAuth } from '../context/AuthContext';
import { PLANS_CONFIG, type Feature } from '../config/plans';

export const usePlan = () => {
    const { planId } = useAuth();

    // Use 'starter' as fallback if planId is null or not found in config
    const plan = PLANS_CONFIG[planId || 'starter'] || PLANS_CONFIG.starter;

    /**
     * Checks if a specific feature is included in the current plan
     */
    const isFeatureEnabled = (feature: Feature): boolean => {
        return plan.features.includes(feature);
    };

    /**
     * Checks if a numeric count is within the plan's limit
     */
    const checkLimit = (currentCount: number, limitType: 'maxUsers'): boolean => {
        return currentCount < plan[limitType];
    };

    /**
     * Gets the remaining days of history allowed by the plan
     * returns -1 for unlimited
     */
    const getHistoryLimit = (): number => {
        return plan.historyDays;
    };

    return {
        plan,
        isFeatureEnabled,
        checkLimit,
        getHistoryLimit,
        planName: plan.name
    };
};
