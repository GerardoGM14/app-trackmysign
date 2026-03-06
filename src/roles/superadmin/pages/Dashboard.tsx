import {
    BsBuilding,
    BsPeople,
    BsCreditCard,
    BsArrowUpRight,
    BsThreeDotsVertical,
    BsPlusCircle,
    BsArrowDownRight
} from 'react-icons/bs';

export default function SuperAdminDashboard() {
    return (
        <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">SaaS Fleet Control</h1>
                    <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">Global ecosystem overview and performance monitoring.</p>
                </div>
                <div className="flex gap-4 self-start sm:self-auto">
                    <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 whitespace-nowrap">
                        <BsPlusCircle />
                        New Tenant
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Tenants"
                    value="42"
                    icon={<BsBuilding />}
                    trend="+12%"
                    positive={true}
                    color="bg-blue-600"
                />
                <KPICard
                    title="Monthly MRR"
                    value="€12,540"
                    icon={<BsCreditCard />}
                    trend="+8.4%"
                    positive={true}
                    color="bg-emerald-500"
                />
                <KPICard
                    title="Total Users"
                    value="1,284"
                    icon={<BsPeople />}
                    trend="-2.1%"
                    positive={false}
                    color="bg-indigo-600"
                />
                <KPICard
                    title="Active Subs"
                    value="38"
                    icon={<BsArrowUpRight />}
                    trend="+4"
                    positive={true}
                    color="bg-blue-400"
                />
            </div>

            {/* Main Sections Logic */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Activity (Table styled) */}
                <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-wider">Recent Tenants</h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">LATEST SHIPMENTS OF ONBOARDING</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            <BsThreeDotsVertical />
                        </button>
                    </div>

                    <div className="overflow-x-auto overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="pb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Company</th>
                                    <th className="pb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Admin</th>
                                    <th className="pb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="pb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Plan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <TenantRow company="EuroPrint Hub" email="boss@europrint.de" status="ACTIVE" plan="ENTERPRISE" />
                                <TenantRow company="Global Signage Ltd" email="admin@globalsign.co.uk" status="ACTIVE" plan="PROFESSIONAL" />
                                <TenantRow company="Imprenta Madrid" email="info@madridpress.es" status="SUSPENDED" plan="BASIC" />
                                <TenantRow company="TechGraphics Inc" email="support@techgraph.com" status="ACTIVE" plan="ENTERPRISE" />
                                <TenantRow company="Oceanic Brands" email="mkt@oceanic.it" status="PENDING" plan="PROFESSIONAL" />
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column Analytics Preview Placeholder */}
                <div className="space-y-8 text-white">
                    <div className="bg-[#040833] rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer shadow-2xl shadow-blue-900/40">
                        {/* Decorative background for card */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/40 transition-all duration-500" />

                        <div className="relative z-10">
                            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Growth Milestone</h4>
                            <p className="text-2xl font-semibold mb-4 leading-tight">95% Customer Retention Rate reached.</p>
                            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-colors border border-white/10">
                                Global Data Strategy
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                        <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-wider mb-6">Subscription Mix</h3>
                        <div className="flex flex-col gap-5">
                            <MixItem label="Enterprise (€99)" percentage={45} color="bg-blue-600" />
                            <MixItem label="Professional (€49)" percentage={35} color="bg-emerald-500" />
                            <MixItem label="Starter (€29)" percentage={20} color="bg-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, trend, positive, color }: { title: string, value: string, icon: any, trend: string, positive: boolean, color: string }) {
    return (
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-5 sm:p-7 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between group hover:border-blue-100 transition-all">
            <div className="flex items-start justify-between">
                <div className={`${color} w-11 h-11 sm:w-14 sm:h-14 rounded-[20px] sm:rounded-3xl flex items-center justify-center text-white text-lg sm:text-xl shadow-2xl shadow-slate-400/20 group-hover:scale-110 transition-transform duration-500`}>
                    {icon}
                </div>
                <div className={`flex items-center gap-1 ${positive ? 'text-emerald-500' : 'text-rose-500'} font-semibold text-[10px] sm:text-xs`}>
                    {positive ? <BsArrowUpRight strokeWidth={1} /> : <BsArrowDownRight strokeWidth={1} />}
                    {trend}
                </div>
            </div>
            <div className="mt-6 sm:mt-8">
                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{title}</p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mt-1">{value}</h2>
            </div>
        </div>
    );
}

function TenantRow({ company, email, status, plan }: { company: string, email: string, status: string, plan: string }) {
    const getStatusStyle = (s: string) => {
        switch (s) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'SUSPENDED': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <tr className="group hover:bg-slate-50 transition-colors">
            <td className="py-4">
                <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{company}</p>
                <p className="text-[10px] text-slate-400 font-medium">Global ID: 4920-X8</p>
            </td>
            <td className="py-4">
                <p className="text-[11px] font-semibold text-slate-600 tracking-tight">{email}</p>
            </td>
            <td className="py-4">
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest border ${getStatusStyle(status)}`}>
                    {status}
                </span>
            </td>
            <td className="py-4">
                <p className="text-[10px] font-semibold text-slate-800 tracking-widest">{plan}</p>
            </td>
        </tr>
    );
}

function MixItem({ label, percentage, color }: { label: string, percentage: number, color: string }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5 px-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                <span className="text-[10px] font-semibold text-slate-900">{percentage}%</span>
            </div>
            <div className="h-2 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}
