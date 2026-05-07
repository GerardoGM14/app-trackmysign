import type { UserRole } from '../../context/AuthContext';

interface MockUser {
    role: Exclude<UserRole, null>;
    pass: string;
}

const MOCK_USERS: Record<string, MockUser> = {
    'superadmin@trackmysign.com': { role: 'superadmin', pass: 'superadmin123' },
    'admin@shop.com': { role: 'admin', pass: 'admin123' },
    'employee@shop.com': { role: 'employee', pass: 'employee123' },
    'client@customer.com': { role: 'client', pass: 'client123' },
};

/**
 * Dev-only credential interceptor. Returns null in production builds so mock
 * users can never authenticate against a deployed app.
 */
export function tryMockLogin(email: string, password: string): MockUser | null {
    if (!import.meta.env.DEV) return null;
    const user = MOCK_USERS[email];
    if (user && user.pass === password) return user;
    return null;
}
