import { auth, db } from '../firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'superadmin' | 'admin' | 'employee' | 'client' | null;

interface AuthContextType {
    user: User | null;
    role: UserRole;
    planId: string | null;
    tenantId: string | null;
    loading: boolean;
    setMockRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    planId: null,
    tenantId: null,
    loading: true,
    setMockRole: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [planId, setPlanId] = useState<string | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Dev Helper: Instant Role Switch
    const setMockRole = (newRole: UserRole) => {
        setLoading(true);
        if (newRole) {
            setUser({
                uid: `mock-uid-${newRole}`,
                email: `${newRole}@mock.com`,
                displayName: `Mock ${newRole}`,
            } as User);
            setRole(newRole);
            setPlanId(newRole === 'superadmin' ? 'enterprise' : 'starter');
            setTenantId('mock-tenant-id');
        } else {
            setUser(null);
            setRole(null);
            setPlanId(null);
            setTenantId(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            // Priority 1: If we have mock data, don't let real Firebase events override it
            // unless we are explicitly logging in again with real credentials
            setLoading(true);

            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setRole(data.role as UserRole);
                    setPlanId(data.planId || 'starter');
                    setTenantId(data.tenantId || null);
                }
            } else {
                // Only clear if we're not currently in a mock session
                // Or if we specifically want to log out
                setUser(null);
                setRole(null);
                setPlanId(null);
                setTenantId(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, planId, tenantId, loading, setMockRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
