import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
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
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    planId: null,
    tenantId: null,
    loading: true,
    setMockRole: () => { },
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [planId, setPlanId] = useState<string | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Dev-only role switcher. No-op in production builds.
    const setMockRole = (newRole: UserRole) => {
        if (!import.meta.env.DEV) {
            console.warn('setMockRole is disabled in production builds.');
            return;
        }
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

    const logout = async () => {
        // Cierra la sesión real de Firebase (si la hay) y limpia cualquier rol mock activo.
        // El listener onAuthStateChanged terminará de limpiar el estado.
        try {
            if (auth.currentUser) {
                await signOut(auth);
            }
        } catch (err) {
            console.error('Error al cerrar sesión en Firebase', err);
        }
        setUser(null);
        setRole(null);
        setPlanId(null);
        setTenantId(null);
    };

    return (
        <AuthContext.Provider value={{ user, role, planId, tenantId, loading, setMockRole, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
