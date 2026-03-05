import { useState } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';
import SnakeLoader from '../components/SnakeLoader';

export default function LoaderTest() {
    const [showOverlay, setShowOverlay] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center gap-12 font-sans">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loader Style Guide</h1>
                <p className="text-slate-500">Preview and test the custom SnakeLoader component.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
                {/* Small */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center gap-4 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Small (60px)</span>
                    <SnakeLoader size={60} />
                </div>

                {/* Medium */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center gap-4 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medium (100px)</span>
                    <SnakeLoader size={100} />
                </div>

                {/* Large */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center gap-4 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Large (150px)</span>
                    <SnakeLoader size={150} />
                </div>
            </div>

            <div className="flex flex-col items-center gap-6 mt-8">
                <button
                    onClick={() => setShowOverlay(true)}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                    Activate Full-Screen Overlay
                </button>
                <p className="text-xs text-slate-400">Click to see the LoadingOverlay used in authentication.</p>
            </div>

            {showOverlay && (
                <div className="relative">
                    <LoadingOverlay />
                    <button
                        onClick={() => setShowOverlay(false)}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-full opacity-50 hover:opacity-100 transition-opacity"
                    >
                        Click to Hide / Ocultar
                    </button>
                </div>
            )}
        </div>
    );
}
