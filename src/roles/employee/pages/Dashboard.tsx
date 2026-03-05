export default function EmployeeDashboard() {
    return (
        <div className="p-8 font-sans">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">Employee Workspace</h1>
            <p className="text-slate-500 mt-2 font-medium">Daily task management and operational activities.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 border border-slate-200 rounded bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">My Tasks</p>
                    <p className="text-3xl font-black text-slate-900">12</p>
                </div>
                <div className="p-6 border border-slate-200 rounded bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Time Tracked</p>
                    <p className="text-3xl font-black text-slate-900">6.5h</p>
                </div>
                <div className="p-6 border border-slate-200 rounded bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Efficiency</p>
                    <p className="text-3xl font-black text-emerald-600">94%</p>
                </div>
            </div>

            <div className="mt-8 bg-slate-50 border border-slate-200 p-6 rounded">
                <h3 className="text-sm font-black uppercase text-slate-800 mb-4">Assigned Log</h3>
                <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white p-3 border border-slate-100 flex items-center justify-between text-xs font-bold uppercase">
                            <span className="text-slate-600 tracking-tight">Operation_Batch_00{i}</span>
                            <span className="text-indigo-600">In Queue</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
