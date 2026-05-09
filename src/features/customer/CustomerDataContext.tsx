import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Quote } from '../quotes/types';
import type { Order } from '../orders/types';
import { CUSTOMER_QUOTES, CUSTOMER_ORDERS } from './customerData';

interface CustomerDataContextType {
    quotes: Quote[];
    orders: Order[];
    approveProof: (orderId: string, proofId: string, signature: string) => void;
    rejectProof: (orderId: string, proofId: string, reason: string) => void;
    approveQuote: (quoteId: string) => void;
    rejectQuote: (quoteId: string, reason: string) => void;
}

const CustomerDataContext = createContext<CustomerDataContextType | undefined>(undefined);

export function CustomerDataProvider({ children }: { children: ReactNode }) {
    const [quotes, setQuotes] = useState<Quote[]>(CUSTOMER_QUOTES);
    const [orders, setOrders] = useState<Order[]>(CUSTOMER_ORDERS);

    const today = () => new Date().toISOString().split('T')[0];

    const approveProof = useCallback((orderId: string, proofId: string, signature: string) => {
        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId
                    ? {
                        ...o,
                        proofs: o.proofs.map((p) =>
                            p.id === proofId ? { ...p, status: 'approved' as const, respondedAt: today(), signature } : p,
                        ),
                    }
                    : o,
            ),
        );
    }, []);

    const rejectProof = useCallback((orderId: string, proofId: string, reason: string) => {
        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId
                    ? {
                        ...o,
                        proofs: o.proofs.map((p) =>
                            p.id === proofId ? { ...p, status: 'rejected' as const, respondedAt: today(), rejectionReason: reason } : p,
                        ),
                    }
                    : o,
            ),
        );
    }, []);

    const approveQuote = useCallback((quoteId: string) => {
        setQuotes((prev) =>
            prev.map((q) => (q.id === quoteId ? { ...q, status: 'approved', respondedAt: today() } : q)),
        );
    }, []);

    const rejectQuote = useCallback((quoteId: string, reason: string) => {
        setQuotes((prev) =>
            prev.map((q) =>
                q.id === quoteId ? { ...q, status: 'rejected', respondedAt: today(), rejectionReason: reason } : q,
            ),
        );
    }, []);

    return (
        <CustomerDataContext.Provider value={{ quotes, orders, approveProof, rejectProof, approveQuote, rejectQuote }}>
            {children}
        </CustomerDataContext.Provider>
    );
}

export function useCustomerData() {
    const ctx = useContext(CustomerDataContext);
    if (!ctx) throw new Error('useCustomerData must be used within CustomerDataProvider');
    return ctx;
}
