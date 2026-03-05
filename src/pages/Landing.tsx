import { Link } from 'react-router-dom';
import { BsArrowRight, BsBuilding, BsCheckCircleFill, BsLightningFill, BsShieldLock } from 'react-icons/bs';

export default function Landing() {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navigation */}
            <nav className="h-20 border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                        <BsBuilding className="text-white text-lg" />
                    </div>
                    <span className="font-black uppercase tracking-tighter text-xl text-slate-900">TrackSign</span>
                </div>

                <Link
                    to="/login"
                    className="bg-indigo-600 text-white px-6 py-2 rounded text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                >
                    Sign In
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="py-24 px-8 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full text-indigo-600 mb-8">
                    <BsLightningFill className="text-sm" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Next Generation SaaS</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none mb-8 uppercase">
                    Track everything <br />
                    <span className="text-indigo-600">in one place.</span>
                </h1>

                <p className="max-w-2xl mx-auto text-slate-500 text-lg font-medium mb-12">
                    The ultimate multitenant platform for enterprise resource management.
                    Siloed architectures, role-based security, and real-time analytics.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/login"
                        className="group bg-slate-900 text-white px-10 py-5 rounded font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all"
                    >
                        Start for free
                        <BsArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button className="px-10 py-5 border border-slate-200 rounded font-black uppercase text-sm tracking-widest text-slate-600 hover:bg-slate-50 transition-colors">
                        View demo
                    </button>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-slate-50 border-y border-slate-100 px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        {
                            icon: <BsShieldLock />,
                            title: "Multitenant Security",
                            desc: "Complete data isolation for every company using our enterprise isolation engine."
                        },
                        {
                            icon: <BsPeople />,
                            title: "Role Hierarchy",
                            desc: "Manage SuperAdmins, Admins, Employees and Clients with granular permissions."
                        },
                        {
                            icon: <BsClipboardCheck />,
                            title: "Actionable Data",
                            desc: "Professional amCharts 5 integration for real-time operational monitoring."
                        }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-10 border border-slate-200 rounded">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-xl mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">{feature.title}</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">{feature.desc}</p>
                            <div className="mt-6 flex items-center gap-2 text-indigo-600">
                                <BsCheckCircleFill className="text-sm" />
                                <span className="text-[10px] font-black uppercase">Service active</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    © {new Date().getFullYear()} TrackSign SaaS Platform • Built with KoHo & Flat Design
                </p>
            </footer>
        </div>
    );
}

function BsPeople() {
    return (
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"></path></svg>
    );
}

function BsClipboardCheck() {
    return (
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"></path><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"></path><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"></path></svg>
    );
}
