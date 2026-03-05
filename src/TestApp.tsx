import { auth } from './firebase';
import { BsCheckCircleFill, BsLightningFill } from 'react-icons/bs';
import Chart from './components/Chart';

function TestApp() {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-[Inter]">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex items-center justify-between bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                            <BsLightningFill className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">System Check</h1>
                            <p className="text-slate-400 text-sm">Verifying all integrations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">
                        <BsCheckCircleFill />
                        <span className="text-xs font-bold uppercase tracking-wider">All Systems Go</span>
                    </div>
                </header>

                {/* Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-2">Tailwind v4</p>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[100%] transition-all duration-1000"></div>
                        </div>
                        <p className="mt-4 text-sm font-medium">Styles active via @tailwindcss/vite</p>
                    </div>

                    <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-2">Firebase SDK</p>
                        <p className="text-xl font-bold">{auth ? 'Initialized' : 'Error'}</p>
                        <p className="mt-2 text-xs text-slate-400 font-mono">auth.app.name: {auth.app.name}</p>
                    </div>

                    <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-2">React Icons</p>
                        <div className="flex gap-4 text-2xl text-indigo-400">
                            <BsLightningFill />
                            <BsCheckCircleFill />
                            <BsLightningFill className="animate-pulse" />
                        </div>
                        <p className="mt-4 text-sm font-medium italic">Icons rendering correctly</p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">amCharts 5 Integration</h2>
                        <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] text-slate-400">LIVE DATA VISUALIZATION</span>
                    </div>
                    <div className="h-[400px] w-full bg-slate-950/40 rounded-2xl overflow-hidden border border-slate-800/50">
                        <Chart />
                    </div>
                </div>

                <footer className="text-center text-slate-600 text-xs pt-4">
                    TrackSign v1.0.0 • Built with Vite, React, Tailwind v4
                </footer>
            </div>
        </div>
    );
}

export default TestApp;
