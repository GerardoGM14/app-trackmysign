import { useAuth, type UserRole } from '../context/AuthContext';
import { BsLightningCharge, BsShieldLock, BsBriefcase, BsPersonBadge, BsGem } from 'react-icons/bs';

export default function DevRoleSwitcher() {
    const { setMockRole, role } = useAuth();

    const roles: { id: UserRole, label: string, icon: any, color: string }[] = [
        { id: 'superadmin', label: 'SuperAdmin', icon: <BsGem />, color: 'bg-indigo-600' },
        { id: 'admin', label: 'Admin (Shop)', icon: <BsShieldLock />, color: 'bg-blue-600' },
        { id: 'employee', label: 'Employee', icon: <BsBriefcase />, color: 'bg-emerald-600' },
        { id: 'client', label: 'Client', icon: <BsPersonBadge />, color: 'bg-orange-600' },
    ];

    return (
        <div className="fixed top-24 left-6 z-[60] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-w-[200px] animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-2 mb-3">
                <BsLightningCharge className="text-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mock Login</span>
            </div>

            <div className="space-y-2">
                {roles.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => setMockRole(r.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all group ${role === r.id
                                ? `${r.color} text-white shadow-lg`
                                : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-100'
                            }`}
                    >
                        <span className={`text-base ${role === r.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}>
                            {r.icon}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                            {r.label}
                        </span>
                    </button>
                ))}

                <button
                    onClick={() => setMockRole(null)}
                    className="w-full mt-2 text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest py-1 transition-colors"
                >
                    Reset Auth
                </button>
            </div>
        </div>
    );
}
