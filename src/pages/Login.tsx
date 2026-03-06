import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { BsEye, BsEyeSlash, BsKey, BsPersonPlus } from 'react-icons/bs';
import { FaShieldCat } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import logo from '../assets/Login/logo-trackmysign.png';
import LoadingOverlay from '../components/LoadingOverlay';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const SLIDES = [
    {
        url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000",
        text: "Smart enterprise tracking",
        desc: "Monitor your operations in real-time with our advanced logistics engine."
    },
    {
        url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000",
        text: "Secure multitenant data",
        desc: "Complete data isolation for every business unit using our security protocols."
    },
    {
        url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000",
        text: "Professional logistics management",
        desc: "Streamline workflows and optimize resource allocation across your organization."
    },
    {
        url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000",
        text: "Advanced SaaS platform",
        desc: "Scalable infrastructure designed to support enterprise-grade performance."
    }
];

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();
    const { setMockRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loginMode, setLoginMode] = useState<'email' | 'google'>('email');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.includes('@')) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }

        // --- DEV MOCK INTERCEPTOR ---
        const mockUsers: Record<string, { role: 'superadmin' | 'admin' | 'employee' | 'client', pass: string }> = {
            'superadmin@trackmysign.com': { role: 'superadmin', pass: 'superadmin123' },
            'admin@shop.com': { role: 'admin', pass: 'admin123' },
            'employee@shop.com': { role: 'employee', pass: 'employee123' },
            'client@customer.com': { role: 'client', pass: 'client123' },
        };

        if (mockUsers[email] && password === mockUsers[email].pass) {
            setLoading(true);
            setMockRole(mockUsers[email].role);
            showToast(`Mock Login: Welcome ${mockUsers[email].role}`, 'success');
            setLoading(false);
            return;
        }
        // ----------------------------

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast('Successfully signed in!', 'success');
        } catch (err: any) {
            showToast(err.message, 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            showToast('Successfully signed in with Google!', 'success');
        } catch (err: any) {
            showToast(err.message, 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-4 md:p-8">
            {loading && <LoadingOverlay />}
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 items-stretch">

                {/* Left Side: Login Form - Separated Container */}
                <div className="w-full lg:w-[420px] bg-white border border-slate-200 rounded-2xl p-8 md:p-12 flex flex-col justify-center shadow-sm">
                    <div className="flex flex-col mb-6">
                        <div className="h-24 w-auto flex items-center justify-center lg:justify-start mb-4">
                            <img src={logo} alt="TrackSign Logo" className="h-full w-auto object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Welcome to the platform</h1>
                        <p className="text-slate-900 text-sm mt-1">
                            Secure access to your enterprise tracking and multitenant operational data.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                                placeholder="name@company.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded outline-none focus:border-blue-600 transition-all text-sm pr-12"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer"
                                >
                                    {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
                                </button>
                            </div>
                        </div>


                        <div className="flex gap-3 items-center w-full">
                            <button
                                type={loginMode === 'email' ? 'submit' : 'button'}
                                onClick={(e) => {
                                    if (loginMode !== 'email') {
                                        e.preventDefault();
                                        setLoginMode('email');
                                    }
                                }}
                                disabled={loading}
                                style={{
                                    flexGrow: loginMode === 'email' ? 1 : 0,
                                    flexBasis: '56px',
                                    flexShrink: 0
                                }}
                                className={`h-14 rounded-xl font-bold text-sm transition-all duration-500 ease-in-out cursor-pointer flex items-center justify-center overflow-hidden whitespace-nowrap active:scale-[0.98] ${loginMode === 'email'
                                    ? 'bg-blue-600 text-white px-6'
                                    : 'bg-white border border-slate-200 text-blue-600 px-0'
                                    }`}
                            >
                                {loading && loginMode === 'email' ? (
                                    <div className="w-4 h-4" />
                                ) : (
                                    <div className={`flex items-center justify-center transition-all duration-500 ${loginMode === 'email' ? 'gap-3' : 'gap-0'}`}>
                                        <div className={`rounded-lg p-0.5 flex items-center justify-center transition-colors duration-500 flex-shrink-0 ${loginMode === 'email' ? 'bg-white' : 'bg-blue-50'}`}>
                                            <FaShieldCat className="text-blue-600 text-[14px]" />
                                        </div>
                                        <span className={`transition-all duration-500 overflow-hidden ${loginMode === 'email' ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                                            Sign In
                                        </span>
                                    </div>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (loginMode === 'google') {
                                        handleGoogleLogin();
                                    } else {
                                        setLoginMode('google');
                                    }
                                }}
                                disabled={loading}
                                style={{
                                    flexGrow: loginMode === 'google' ? 1 : 0,
                                    flexBasis: '56px',
                                    flexShrink: 0
                                }}
                                className={`h-14 rounded-xl text-sm transition-all duration-500 ease-in-out cursor-pointer flex items-center justify-center overflow-hidden whitespace-nowrap active:scale-[0.98] ${loginMode === 'google'
                                    ? 'bg-white border border-slate-200 text-slate-700 px-6 font-medium'
                                    : 'bg-white border border-slate-200 px-0 font-bold'
                                    }`}
                                title="Sign in with Google"
                            >
                                {loading && loginMode === 'google' ? (
                                    <div className="w-4 h-4" />
                                ) : (
                                    <div className={`flex items-center justify-center transition-all duration-500 ${loginMode === 'google' ? 'gap-3' : 'gap-0'}`}>
                                        <FcGoogle size={24} className="flex-shrink-0" />
                                        <span className={`transition-all duration-500 overflow-hidden ${loginMode === 'google' ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                                            Sign in with Google
                                        </span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-0 px-1">
                        <button
                            onClick={() => console.log('Forgot password clicked')}
                            className="flex items-center gap-2.5 text-slate-500 font-medium text-sm cursor-pointer group whitespace-nowrap"
                        >
                            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 transition-all group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100">
                                <BsKey size={18} />
                            </div>
                            Forgot Password?
                        </button>

                        <button
                            onClick={() => navigate('/register')}
                            className="flex items-center gap-2.5 text-blue-600 font-medium text-sm cursor-pointer group whitespace-nowrap"
                        >
                            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                                <BsPersonPlus size={18} />
                            </div>
                            Register Now
                        </button>
                    </div>
                </div>

                {/* Right Side: Blurred Image Carousel - Separated Container */}
                <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900 items-center justify-center rounded-2xl border border-slate-200 p-8 shadow-sm min-h-[600px]">
                    {SLIDES.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <img
                                src={slide.url}
                                alt="Slide"
                                className="w-full h-full object-cover blur-[1px] opacity-40"
                            />
                            <div className="absolute inset-0 flex items-end justify-start p-12">
                                <div className="max-w-xs transition-all duration-500 transform translate-y-0">
                                    <h2 className="text-2xl font-bold text-white leading-tight tracking-tight drop-shadow-md mb-2">
                                        {slide.text}
                                    </h2>
                                    <p className="text-sm font-normal text-white/80 leading-relaxed drop-shadow-sm">
                                        {slide.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Slide indicators */}
                    <div className="absolute bottom-8 left-12 flex gap-1.5 z-10">
                        {SLIDES.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
