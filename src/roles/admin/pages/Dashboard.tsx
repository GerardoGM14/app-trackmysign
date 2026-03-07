import Chart from '../../../components/Chart';
import { usePlan } from '../../../hooks/usePlan';

export default function AdminDashboard() {
    const { planName } = usePlan();

    return (
        <div className="p-8 font-sans h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">Tenant Administration</h1>
                    <p className="text-slate-500 mt-2 font-medium">Managing company users, reports and configuration .</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Plan</span>
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-tight">{planName}</span>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                <div className="p-6 border border-slate-200 rounded-lg bg-white">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">Company Employees</p>
                    <p className="text-3xl font-black text-slate-900 leading-none">24</p>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">Active now</span>
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Manage Users →</span>
                    </div>
                </div>
                <div className="p-6 border border-slate-200 rounded-lg bg-white">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">Service Usage</p>
                    <p className="text-3xl font-black text-slate-900 leading-none">82%</p>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full w-[82%] shadow-none"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white border border-slate-200 p-8 rounded-lg flex-1 min-h-[450px]">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Operational Trends</h3>
                <div className="h-[350px] w-full border border-slate-100 rounded">
                    <Chart />
                </div>
            </div>
        </div>
    )
}
