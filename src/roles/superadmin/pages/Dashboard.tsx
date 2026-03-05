export default function SuperAdminDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-black uppercase tracking-tight">Global Billing & SaaS Control</h1>
            <p className="text-slate-500 mt-2">Welcome, SuperAdmin. Monitoring all tenants and subscription statuses.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border border-slate-200 rounded-lg bg-white">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</p>
                    <p className="text-2xl font-black mt-2 text-indigo-600">$128,430.00</p>
                </div>
                <div className="p-6 border border-slate-200 rounded-lg bg-white">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Active Tenants</p>
                    <p className="text-2xl font-black mt-2">42</p>
                </div>
                <div className="p-6 border border-slate-200 rounded-lg bg-white">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">System Health</p>
                    <p className="text-2xl font-black mt-2 text-emerald-500">Normal</p>
                </div>
            </div>
        </div>
    )
}
