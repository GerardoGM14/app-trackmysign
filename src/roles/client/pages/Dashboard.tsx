export default function ClientDashboard() {
    return (
        <div className="p-12 max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black uppercase text-slate-900 tracking-tighter">Client Portal</h1>
                <p className="text-slate-500 mt-2 font-medium">Access your requests and tracking information here.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Activities</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded">
                            <div>
                                <p className="text-sm font-bold text-slate-900 uppercase">Request #00{i}</p>
                                <p className="text-xs text-slate-500">Last updated: 2 hours ago</p>
                            </div>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded">In Progress</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
