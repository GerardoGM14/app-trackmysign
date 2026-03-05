import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';
import countryList from 'react-select-country-list';
import ReactCountryFlag from "react-country-flag";
import { auth, googleProvider, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BsEye, BsEyeSlash, BsArrowLeft, BsLightningCharge, BsRocketTakeoff } from 'react-icons/bs';
import { RiInformation2Fill } from "react-icons/ri";
import { FaShieldCat } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import logo from '../assets/Login/logo-trackmysign.png';
import LoadingOverlay from '../components/LoadingOverlay';
import { useToast } from '../context/ToastContext';

const SLIDES = [
    {
        url: "https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?auto=format&fit=crop&q=80&w=1000",
        text: "Expand your global reach",
        desc: "Connect your business to international markets with our multitenant network."
    },
    {
        url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000",
        text: "Professional Onboarding",
        desc: "Set up your organization's hierarchy and operational regions in minutes."
    },
    {
        url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000",
        text: "Enterprise Management",
        desc: "Control every aspect of your fleet and personnel from a single dashboard."
    },
    {
        url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000",
        text: "Real-time Analytics",
        desc: "Make data-driven decisions with insights from all your active territories."
    }
];

export default function Register() {
    const navigate = useNavigate();
    const options = useMemo(() => countryList().getData(), []);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');
    const [country, setCountry] = useState('');
    const [region, setRegion] = useState('');
    const [city, setCity] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [registerMode, setRegisterMode] = useState<'email' | 'google'>('email');
    const [showPricing, setShowPricing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'starter' | 'enterprise' | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.includes('@')) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }

        // Instead of immediate register, show pricing
        setShowPricing(true);
    };

    const completeRegistration = async () => {
        if (!selectedPlan) return;

        setLoading(true);
        try {
            let user;
            if (registerMode === 'email') {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                user = cred.user;
            } else {
                const cred = await signInWithPopup(auth, googleProvider);
                user = cred.user;
            }

            // Save extended profile to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                fullName,
                email: user.email,
                company,
                country,
                region,
                city,
                planId: selectedPlan,
                role: 'admin', // User who registers is usually the admin of their tenant
                createdAt: serverTimestamp(),
                status: 'active'
            });

            showToast('Account created successfully!', 'success');
            navigate('/dashboard');
        } catch (err: any) {
            showToast(err.message || 'Registration failed.', 'error');
            console.error(err);
            setShowPricing(false);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        // Show pricing first to let user choose a plan
        setShowPricing(true);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-4 md:p-8">
            {loading && <LoadingOverlay />}
            <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-stretch">

                {/* Left Side: Blurred Image Carousel - Mirroring Login */}
                <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900 items-center justify-center rounded-2xl border border-slate-200 p-8 shadow-sm min-h-[700px]">
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
                                <div className="max-w-xs transition-all duration-500 transform translate-y-0 text-left">
                                    <h2 className="text-3xl font-bold text-white leading-tight tracking-tight drop-shadow-md mb-3">
                                        {slide.text}
                                    </h2>
                                    <p className="text-base font-normal text-white/80 leading-relaxed drop-shadow-sm">
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

                {/* Right Side: Register Form - Expanded with more fields */}
                <div className="w-full lg:w-[540px] bg-white border border-slate-200 rounded-2xl p-8 md:p-10 flex flex-col shadow-sm overflow-y-auto max-h-[90vh] lg:max-h-none">
                    <div className="flex flex-col mb-6">
                        <div className="h-24 w-auto flex items-center justify-center lg:justify-start mb-4">
                            <img src={logo} alt="TrackSign Logo" className="h-full w-auto object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Register</h1>
                        <p className="text-slate-700 text-sm mt-1">
                            Create your account to start managing your global operation with TrackMySign.
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                                    placeholder="e.g. Global Tech Inc."
                                    required
                                />
                            </div>
                        </div>

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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Country</label>
                                <Select
                                    options={options}
                                    value={options.find((opt: any) => opt.label === country)}
                                    onChange={(opt: any) => setCountry(opt?.label || '')}
                                    placeholder="Select..."
                                    className="text-sm"
                                    maxMenuHeight={200}
                                    components={{
                                        Option: (props) => (
                                            <components.Option {...props}>
                                                <div className="flex items-center gap-2">
                                                    <ReactCountryFlag
                                                        countryCode={props.data.value}
                                                        svg
                                                        style={{
                                                            width: '20px',
                                                            height: '15px'
                                                        }}
                                                    />
                                                    {props.data.label}
                                                </div>
                                            </components.Option>
                                        ),
                                        SingleValue: (props) => (
                                            <components.SingleValue {...props}>
                                                <div className="flex items-center gap-2">
                                                    <ReactCountryFlag
                                                        countryCode={props.data.value}
                                                        svg
                                                        style={{
                                                            width: '20px',
                                                            height: '15px'
                                                        }}
                                                    />
                                                    {props.data.label}
                                                </div>
                                            </components.SingleValue>
                                        )
                                    }}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: '#f8fafc',
                                            borderColor: state.isFocused ? '#2563eb' : '#e2e8f0',
                                            borderRadius: '0.25rem',
                                            minHeight: '48px',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                borderColor: state.isFocused ? '#2563eb' : '#cbd5e1'
                                            }
                                        }),
                                        valueContainer: (base) => ({
                                            ...base,
                                            padding: '0 16px'
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: '#94a3b8'
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            borderRadius: '0.5rem',
                                            marginTop: '4px',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                            border: '1px border-slate-200'
                                        }),
                                        menuList: (base) => ({
                                            ...base,
                                            padding: '4px'
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            borderRadius: '0.25rem',
                                            backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#f1f5f9' : 'transparent',
                                            color: state.isSelected ? 'white' : '#1e293b',
                                            cursor: 'pointer',
                                            '&:active': {
                                                backgroundColor: '#2563eb'
                                            }
                                        })
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Region</label>
                                <input
                                    type="text"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                                    placeholder="e.g. Lima"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                                    placeholder="e.g. Miraflores"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded outline-none focus:border-blue-600 transition-all text-sm pr-12"
                                    placeholder="Create a strong password"
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


                        <div className="flex gap-3 items-center w-full pt-4">
                            <button
                                type={registerMode === 'email' ? 'submit' : 'button'}
                                onClick={(e) => {
                                    if (registerMode !== 'email') {
                                        e.preventDefault();
                                        setRegisterMode('email');
                                    }
                                }}
                                disabled={loading}
                                style={{
                                    flexGrow: registerMode === 'email' ? 1 : 0,
                                    flexBasis: '56px',
                                    flexShrink: 0
                                }}
                                className={`h-14 rounded-xl font-bold text-sm transition-all duration-500 ease-in-out cursor-pointer flex items-center justify-center overflow-hidden whitespace-nowrap active:scale-[0.98] ${registerMode === 'email'
                                    ? 'bg-blue-600 text-white px-6'
                                    : 'bg-white border border-slate-200 text-blue-600 px-0'
                                    }`}
                            >
                                {loading && registerMode === 'email' ? (
                                    <div className="w-4 h-4" />
                                ) : (
                                    <div className={`flex items-center justify-center transition-all duration-500 ${registerMode === 'email' ? 'gap-3' : 'gap-0'}`}>
                                        <div className={`rounded-lg p-0.5 flex items-center justify-center transition-colors duration-500 flex-shrink-0 ${registerMode === 'email' ? 'bg-white' : 'bg-blue-50'}`}>
                                            <FaShieldCat className="text-blue-600 text-[14px]" />
                                        </div>
                                        <span className={`transition-all duration-500 overflow-hidden ${registerMode === 'email' ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                                            Register Now
                                        </span>
                                    </div>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (registerMode === 'google') {
                                        handleGoogleRegister();
                                    } else {
                                        setRegisterMode('google');
                                    }
                                }}
                                disabled={loading}
                                style={{
                                    flexGrow: registerMode === 'google' ? 1 : 0,
                                    flexBasis: '56px',
                                    flexShrink: 0
                                }}
                                className={`h-14 rounded-xl text-sm transition-all duration-500 ease-in-out cursor-pointer flex items-center justify-center overflow-hidden whitespace-nowrap active:scale-[0.98] ${registerMode === 'google'
                                    ? 'bg-white border border-slate-200 text-slate-700 px-6 font-medium'
                                    : 'bg-white border border-slate-200 px-0 font-bold'
                                    }`}
                                title="Sign up with Google"
                            >
                                {loading && registerMode === 'google' ? (
                                    <div className="w-4 h-4" />
                                ) : (
                                    <div className={`flex items-center justify-center transition-all duration-500 ${registerMode === 'google' ? 'gap-3' : 'gap-0'}`}>
                                        <FcGoogle size={24} className="flex-shrink-0" />
                                        <span className={`transition-all duration-500 overflow-hidden ${registerMode === 'google' ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                                            Sign up with Google
                                        </span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 flex flex-col items-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium text-sm group"
                        >
                            <BsArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            Already have an account? Login
                        </button>
                    </div>
                </div>
            </div>

            {/* Pricing Modal */}
            {showPricing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col relative px-4 pt-8 md:px-0 md:pt-0">
                        <div className="flex flex-col items-center mb-8 md:hidden text-center">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Choose your plan</h2>
                            <p className="text-slate-500 text-xs font-medium">Select the best option for your operational needs.</p>
                        </div>
                        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto pb-48 sm:pb-32 md:pb-24">
                            {/* Starter Plan */}
                            <div className={`flex-1 p-8 md:p-12 transition-all duration-300 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 ${selectedPlan === 'starter' ? 'bg-blue-50/50 ring-2 ring-blue-600 ring-inset' : 'hover:bg-slate-50'}`}>
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                                    <BsLightningCharge size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
                                <p className="text-slate-500 text-sm mb-6 max-w-[280px]">Perfect for small teams and startups starting their tracking journey. Get all the essentials to manage your logistics with precision and ease, ensuring a smooth takeoff for your operations.</p>
                                <div className="text-4xl font-extrabold text-slate-900 mb-8">$0<span className="text-sm font-medium text-slate-400">/mo</span></div>

                                <ul className="space-y-4 mb-10 text-left w-full text-sm font-medium text-slate-600">
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        Up to 3 Active Users
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        Standard Document Tracking
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        Basic Logistics Metrics
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        4 Pre-defined Roles
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        5GB Cloud Storage (Firebase)
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        7-Day History Access
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <FaCheckCircle className="text-slate-200 text-lg flex-shrink-0" />
                                        Priority Core Support
                                    </li>
                                </ul>

                                <button
                                    onClick={() => setSelectedPlan('starter')}
                                    className={`w-full py-4 rounded-xl font-bold transition-all active:scale-[0.98] ${selectedPlan === 'starter' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {selectedPlan === 'starter' ? 'Plan Selected' : 'Choose Starter'}
                                </button>
                            </div>

                            {/* Enterprise Plan */}
                            <div className={`flex-1 p-8 md:p-12 transition-all duration-300 flex flex-col items-center text-center relative ${selectedPlan === 'enterprise' ? 'bg-blue-50/50 ring-2 ring-blue-600 ring-inset' : 'hover:bg-slate-50'}`}>
                                <div className="absolute top-6 right-6 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide shadow-lg animate-pulse z-10 font-sans">Most Popular</div>
                                <div className="w-16 h-16 min-w-[64px] min-h-[64px] bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                                    <BsRocketTakeoff size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
                                <p className="text-slate-500 text-sm mb-6 max-w-[280px]">Unlimited power for global organizations and complex fleets. Scale your business with advanced analytics, custom integrations, and dedicated support designed for high-performance enterprise management.</p>
                                <div className="text-4xl font-extrabold text-slate-900 mb-8">$99<span className="text-sm font-medium text-slate-400">/mo</span></div>

                                <ul className="space-y-4 mb-10 text-left w-full text-sm font-medium text-slate-600">
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        Up to 30 Active Users
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        Bulk Document Management
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        Advanced Analytics & Exports
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        Custom Role Management
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        30GB Cloud Storage (Firebase)
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        Full History Log (Unlimited)
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        API Access (Beta)
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-600">
                                        <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                                        Personalized Support (24h Response)
                                    </li>
                                </ul>

                                <button
                                    onClick={() => setSelectedPlan('enterprise')}
                                    className={`w-full py-4 rounded-xl font-bold transition-all active:scale-[0.98] ${selectedPlan === 'enterprise' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {selectedPlan === 'enterprise' ? 'Plan Selected' : 'Choose Enterprise'}
                                </button>
                            </div>
                        </div>

                        {/* Flexible Plan Info Bar (Cookie style from reference image) */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white p-3 md:p-4 flex flex-col md:flex-row items-center gap-4 md:gap-0 z-20">
                            <div className="flex flex-1 items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    <RiInformation2Fill size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 leading-tight">Plan Flexibility</h4>
                                    <p className="text-xs text-slate-500 leading-normal">You can change your plan later in settings. At any time.</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                                <button
                                    onClick={() => setShowPricing(false)}
                                    className="px-8 py-2.5 bg-slate-50 text-slate-600 font-bold text-sm rounded-full hover:bg-slate-100 transition-all active:scale-95 border border-slate-200 w-full sm:w-auto"
                                >
                                    Rechazar
                                </button>
                                <button
                                    disabled={!selectedPlan || loading}
                                    onClick={completeRegistration}
                                    className={`px-10 py-2.5 text-white rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${selectedPlan ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300'}`}
                                >
                                    {loading ? 'Processing...' : 'Aceptar todo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
