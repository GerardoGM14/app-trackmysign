import { useState } from 'react';
import {
    BsSearch,
    BsThreeDotsVertical,
    BsPersonPlus,
    BsX,
    BsCheck2,
    BsShieldLock,
    BsKey,
    BsPersonDash,
    BsPersonCheck
} from 'react-icons/bs';

// --- MOCK USER DATA ---
interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'employee' | 'client';
    tenant: string;
    status: 'active' | 'inactive';
    lastAccess: string;
    createdAt: string;
}

const INITIAL_USERS: UserData[] = [
    { id: 'U-001', name: 'Hans Weber', email: 'boss@europrint.de', role: 'admin', tenant: 'EuroPrint Hub', status: 'active', lastAccess: '2 hours ago', createdAt: '2024-01-15' },
    { id: 'U-002', name: 'Anna Schmidt', email: 'anna@europrint.de', role: 'employee', tenant: 'EuroPrint Hub', status: 'active', lastAccess: '1 day ago', createdAt: '2024-02-10' },
    { id: 'U-003', name: 'Sarah Connor', email: 'admin@globalsign.co.uk', role: 'admin', tenant: 'Global Signage Ltd', status: 'active', lastAccess: '3 hours ago', createdAt: '2024-02-20' },
    { id: 'U-004', name: 'Carlos Ruiz', email: 'info@madridpress.es', role: 'admin', tenant: 'Imprenta Madrid', status: 'inactive', lastAccess: '2 weeks ago', createdAt: '2024-03-10' },
    { id: 'U-005', name: 'Emily Zhang', email: 'support@techgraph.com', role: 'admin', tenant: 'TechGraphics Inc', status: 'active', lastAccess: '30 min ago', createdAt: '2023-11-05' },
    { id: 'U-006', name: 'James Park', email: 'james@techgraph.com', role: 'employee', tenant: 'TechGraphics Inc', status: 'active', lastAccess: '1 hour ago', createdAt: '2024-01-20' },
    { id: 'U-007', name: 'Maria Silva', email: 'maria@techgraph.com', role: 'employee', tenant: 'TechGraphics Inc', status: 'active', lastAccess: '5 hours ago', createdAt: '2024-03-15' },
    { id: 'U-008', name: 'Marco Rossi', email: 'mkt@oceanic.it', role: 'admin', tenant: 'Oceanic Brands', status: 'active', lastAccess: '4 days ago', createdAt: '2024-06-01' },
    { id: 'U-009', name: 'Olaf Nilsen', email: 'olaf@nordicsigns.no', role: 'admin', tenant: 'Nordic Signs AS', status: 'active', lastAccess: '3 days ago', createdAt: '2024-04-18' },
    { id: 'U-010', name: 'Klaus Bauer', email: 'klaus@printforce.de', role: 'admin', tenant: 'PrintForce GmbH', status: 'active', lastAccess: '5 hours ago', createdAt: '2024-01-28' },
    { id: 'U-011', name: 'Mia Thompson', email: 'mia@designworks.com.au', role: 'admin', tenant: 'DesignWorks AU', status: 'active', lastAccess: '1 hour ago', createdAt: '2023-09-12' },
    { id: 'U-012', name: 'John Doe', email: 'john@customer.com', role: 'client', tenant: 'EuroPrint Hub', status: 'inactive', lastAccess: '1 month ago', createdAt: '2024-05-22' },
];

const TENANTS_LIST = ['EuroPrint Hub', 'Global Signage Ltd', 'Imprenta Madrid', 'TechGraphics Inc', 'Oceanic Brands', 'Nordic Signs AS', 'PrintForce GmbH', 'DesignWorks AU'];

export default function Users() {
    const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [tenantFilter, setTenantFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const [newUser, setNewUser] = useState({
        name: '', email: '', role: 'employee' as UserData['role'], tenant: TENANTS_LIST[0]
    });

    // Filtering
    const filteredUsers = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.tenant.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
        const matchTenant = tenantFilter === 'ALL' || u.tenant === tenantFilter;
        const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
        return matchSearch && matchRole && matchTenant && matchStatus;
    });

    // Actions
    const createUser = () => {
        if (!newUser.name || !newUser.email) return;
        const created: UserData = {
            id: `U-${String(users.length + 1).padStart(3, '0')}`,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            tenant: newUser.tenant,
            status: 'active',
            lastAccess: 'Never',
            createdAt: new Date().toISOString().split('T')[0],
        };
        setUsers([created, ...users]);
        setNewUser({ name: '', email: '', role: 'employee', tenant: TENANTS_LIST[0] });
        setShowCreateModal(false);
    };

    const toggleStatus = (id: string) => {
        setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
        setActiveMenu(null);
    };

    const deleteUser = (id: string) => {
        setUsers(users.filter(u => u.id !== id));
        setActiveMenu(null);
    };

    const updateUser = () => {
        if (!editingUser) return;
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setEditingUser(null);
    };

    const getRoleStyle = (r: string) => {
        switch (r) {
            case 'admin': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'employee': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getAvatarUrl = (name: string) => `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">All platform users across every tenant.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 self-start sm:self-auto cursor-pointer"
                >
                    <BsPersonPlus />
                    Add User
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">{users.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Admins</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">{users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Employees</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">{users.filter(u => u.role === 'employee').length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Active</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">{users.filter(u => u.status === 'active').length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search by name, email or tenant..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 cursor-pointer">
                        <option value="ALL">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="employee">Employee</option>
                        <option value="client">Client</option>
                    </select>
                    <select value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 cursor-pointer">
                        <option value="ALL">All Tenants</option>
                        {TENANTS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 cursor-pointer">
                        <option value="ALL">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Access</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                                <img src={getAvatarUrl(user.name)} alt={user.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                                                <p className="text-xs text-slate-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border ${getRoleStyle(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{user.tenant}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            {user.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400">{user.lastAccess}</td>
                                    <td className="px-6 py-4 relative">
                                        <button onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                            <BsThreeDotsVertical size={14} />
                                        </button>
                                        {activeMenu === user.id && (
                                            <div className="absolute right-6 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-30">
                                                <button onClick={() => { setEditingUser(user); setActiveMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                                                    <BsShieldLock size={12} /> Edit Role
                                                </button>
                                                <button onClick={() => toggleStatus(user.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                                                    {user.status === 'active' ? <><BsPersonDash size={12} /> Deactivate</> : <><BsPersonCheck size={12} /> Activate</>}
                                                </button>
                                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                                                    <BsKey size={12} /> Reset Password
                                                </button>
                                                <button onClick={() => deleteUser(user.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 cursor-pointer">
                                                    <BsPersonDash size={12} /> Remove User
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm font-medium">No users found matching your criteria.</div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">Add New User</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><BsX size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                                <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
                                <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" placeholder="john@company.com" type="email" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
                                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserData['role'] })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer">
                                    <option value="admin">Admin</option>
                                    <option value="employee">Employee</option>
                                    <option value="client">Client</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Assign to Tenant</label>
                                <select value={newUser.tenant} onChange={(e) => setNewUser({ ...newUser, tenant: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer">
                                    {TENANTS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                            <button onClick={createUser} className="flex-1 py-2.5 bg-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer">Add User</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50" onClick={() => setEditingUser(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><BsX size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                                <input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
                                <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserData['role'] })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer">
                                    <option value="admin">Admin</option>
                                    <option value="employee">Employee</option>
                                    <option value="client">Client</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Tenant</label>
                                <select value={editingUser.tenant} onChange={(e) => setEditingUser({ ...editingUser, tenant: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer">
                                    {TENANTS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                            <button onClick={updateUser} className="flex-1 py-2.5 bg-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                <BsCheck2 size={16} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
