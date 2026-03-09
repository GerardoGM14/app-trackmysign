import { useState } from 'react';
import { BsCalendar3, BsArrowUpRight, BsArrowDownRight, BsDownload } from 'react-icons/bs';

// --- MOCK ANALYTICS DATA ---
const MONTHLY_REVENUE = [
    { month: 'Jul', mrr: 8200 },
    { month: 'Aug', mrr: 8900 },
    { month: 'Sep', mrr: 9400 },
    { month: 'Oct', mrr: 9200 },
    { month: 'Nov', mrr: 10100 },
    { month: 'Dec', mrr: 10800 },
    { month: 'Jan', mrr: 11200 },
    { month: 'Feb', mrr: 11600 },
    { month: 'Mar', mrr: 12540 },
];

const TOP_TENANTS = [
    { name: 'TechGraphics Inc', revenue: 2970, users: 156, plan: 'ENTERPRISE' },
    { name: 'DesignWorks AU', revenue: 2376, users: 92, plan: 'ENTERPRISE' },
    { name: 'EuroPrint Hub', revenue: 1980, users: 84, plan: 'ENTERPRISE' },
    { name: 'PrintForce GmbH', revenue: 1470, users: 35, plan: 'PROFESSIONAL' },
    { name: 'Global Signage Ltd', revenue: 1078, users: 42, plan: 'PROFESSIONAL' },
];

const FEATURE_USAGE = [
    { name: 'Shipment Tracking', usage: 94 },
    { name: 'Report Generation', usage: 78 },
    { name: 'User Management', usage: 72 },
    { name: 'API Integrations', usage: 45 },
    { name: 'Custom Branding', usage: 32 },
];

const DAILY_ACTIVE = [
    { day: 'Mon', dau: 340 },
    { day: 'Tue', dau: 420 },
    { day: 'Wed', dau: 480 },
    { day: 'Thu', dau: 460 },
    { day: 'Fri', dau: 510 },
    { day: 'Sat', dau: 180 },
    { day: 'Sun', dau: 120 },
];

export default function Analytics() {
    const [period, setPeriod] = useState('9M');
    const maxRevenue = Math.max(...MONTHLY_REVENUE.map(m => m.mrr));
    const maxDAU = Math.max(...DAILY_ACTIVE.map(d => d.dau));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Analytics</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Deep metrics and business intelligence for your SaaS.</p>
                </div>
                <div className="flex gap-3 self-start sm:self-auto">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600">
                        <BsCalendar3 size={12} />
                        Last {period}
                    </div>
                    <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl font-semibold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer">
                        <BsDownload size={12} />
                        Export
                    </button>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPIBox title="Monthly Revenue (MRR)" value="€12,540" trend="+8.4%" positive />
                <KPIBox title="Annual Run Rate (ARR)" value="€150,480" trend="+12%" positive />
                <KPIBox title="Churn Rate" value="4.2%" trend="-0.8%" positive />
                <KPIBox title="Avg. Revenue Per Tenant" value="€298" trend="+3.1%" positive />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* MRR Trend */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Revenue Trend</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Monthly recurring revenue over time</p>
                        </div>
                        <div className="flex gap-1">
                            {['3M', '6M', '9M', '1Y'].map(p => (
                                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${period === p ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-end gap-2 h-48">
                        {MONTHLY_REVENUE.map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-semibold text-slate-500">€{(item.mrr / 1000).toFixed(1)}k</span>
                                <div
                                    className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer"
                                    style={{ height: `${(item.mrr / maxRevenue) * 140}px` }}
                                    title={`${item.month}: €${item.mrr.toLocaleString()}`}
                                />
                                <span className="text-[10px] font-medium text-slate-400">{item.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Active Users */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-900">Daily Active Users</h3>
                        <p className="text-xs text-slate-400 mt-0.5">User activity distribution this week</p>
                    </div>
                    <div className="flex items-end gap-3 h-48">
                        {DAILY_ACTIVE.map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-semibold text-slate-500">{item.dau}</span>
                                <div
                                    className="w-full bg-indigo-500 rounded-t-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                                    style={{ height: `${(item.dau / maxDAU) * 140}px` }}
                                />
                                <span className="text-[10px] font-medium text-slate-400">{item.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Top Tenants by Revenue */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Top Tenants by Revenue</h3>
                    <p className="text-xs text-slate-400 mb-6">Highest contributing organizations</p>
                    <div className="space-y-4">
                        {TOP_TENANTS.map((t, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{i + 1}</span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                                        <p className="text-xs text-slate-400">{t.users} users · {t.plan}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">€{t.revenue.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feature Usage */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Feature Adoption</h3>
                    <p className="text-xs text-slate-400 mb-6">Most used platform features across all tenants</p>
                    <div className="space-y-5">
                        {FEATURE_USAGE.map((f, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-sm font-medium text-slate-700">{f.name}</span>
                                    <span className="text-xs font-semibold text-slate-500">{f.usage}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-700"
                                        style={{ width: `${f.usage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Growth Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPIBox title="New Tenants (This Month)" value="5" trend="+2" positive />
                <KPIBox title="Trial → Paid Conversion" value="68%" trend="+5%" positive />
                <KPIBox title="Avg. Onboarding Time" value="2.4 days" trend="-12h" positive />
                <KPIBox title="Support Tickets Open" value="12" trend="+3" positive={false} />
            </div>
        </div>
    );
}

function KPIBox({ title, value, trend, positive }: { title: string; value: string; trend: string; positive: boolean }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
            <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-semibold text-slate-900">{value}</p>
                <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {positive ? <BsArrowUpRight size={10} /> : <BsArrowDownRight size={10} />}
                    {trend}
                </span>
            </div>
        </div>
    );
}
