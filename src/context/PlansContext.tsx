import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_PLANS, type PlanConfig } from '../config/plans';

const STORAGE_KEY = 'trackmysign:plans:v1';

interface PlansContextValue {
    plans: PlanConfig[];
    plansById: Record<string, PlanConfig>;
    upsertPlan: (plan: PlanConfig) => void;
    removePlan: (id: string) => void;
    resetPlans: () => void;
}

const PlansContext = createContext<PlansContextValue | undefined>(undefined);

function loadInitialPlans(): PlanConfig[] {
    if (typeof window === 'undefined') return Object.values(DEFAULT_PLANS);
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return Object.values(DEFAULT_PLANS);
        const parsed = JSON.parse(raw) as PlanConfig[];
        if (!Array.isArray(parsed) || parsed.length === 0) return Object.values(DEFAULT_PLANS);
        return parsed;
    } catch {
        return Object.values(DEFAULT_PLANS);
    }
}

export function PlansProvider({ children }: { children: ReactNode }) {
    const [plans, setPlans] = useState<PlanConfig[]>(loadInitialPlans);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
        } catch {
            // ignore quota errors
        }
    }, [plans]);

    const plansById = useMemo(() => {
        return plans.reduce<Record<string, PlanConfig>>((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {});
    }, [plans]);

    const upsertPlan = useCallback((plan: PlanConfig) => {
        setPlans((prev) => {
            const idx = prev.findIndex((p) => p.id === plan.id);
            if (idx === -1) return [...prev, plan];
            const next = [...prev];
            next[idx] = plan;
            return next;
        });
    }, []);

    const removePlan = useCallback((id: string) => {
        setPlans((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const resetPlans = useCallback(() => {
        setPlans(Object.values(DEFAULT_PLANS));
    }, []);

    const value: PlansContextValue = { plans, plansById, upsertPlan, removePlan, resetPlans };

    return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>;
}

export function usePlans(): PlansContextValue {
    const ctx = useContext(PlansContext);
    if (!ctx) throw new Error('usePlans must be used within a PlansProvider');
    return ctx;
}
