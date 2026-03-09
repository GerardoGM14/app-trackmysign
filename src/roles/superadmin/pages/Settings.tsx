import React, { useState } from 'react';
import { BsCheck2, BsShieldLock, BsGlobe, BsCreditCard, BsEnvelope, BsPalette, BsDatabase, BsKey } from 'react-icons/bs';

// --- Settings Sections ---
type SettingsTab = 'general' | 'plans' | 'security' | 'email' | 'api' | 'storage' | 'appearance';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <BsGlobe size={16} /> },
    { id: 'plans', label: 'Plans & Billing', icon: <BsCreditCard size={16} /> },
    { id: 'security', label: 'Security', icon: <BsShieldLock size={16} /> },
    { id: 'email', label: 'Email & Notifications', icon: <BsEnvelope size={16} /> },
    { id: 'api', label: 'API & Integrations', icon: <BsKey size={16} /> },
    { id: 'storage', label: 'Storage', icon: <BsDatabase size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <BsPalette size={16} /> },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [saved, setSaved] = useState(false);

    // General
    const [platformName, setPlatformName] = useState('TrackMySign');
    const [domain, setDomain] = useState('app.trackmysign.com');
    const [timezone, setTimezone] = useState('UTC-5');
    const [language, setLanguage] = useState('en');

    // Plans
    const [plans] = useState([
        { name: 'Starter', price: 29, users: 10, storage: 16, features: ['Shipment Tracking', 'Basic Reports'] },
        { name: 'Professional', price: 49, users: 50, storage: 64, features: ['Shipment Tracking', 'Advanced Reports', 'API Access'] },
        { name: 'Enterprise', price: 99, users: -1, storage: 256, features: ['All Features', 'Custom Branding', 'Priority Support', 'SLA'] },
    ]);

    // Security
    const [minPasswordLength, setMinPasswordLength] = useState(8);
    const [require2FA, setRequire2FA] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

    // Email
    const [smtpHost, setSmtpHost] = useState('smtp.trackmysign.com');
    const [smtpPort, setSmtpPort] = useState('587');
    const [senderEmail, setSenderEmail] = useState('noreply@trackmysign.com');
    const [notifyNewTenant, setNotifyNewTenant] = useState(true);
    const [notifyNewUser, setNotifyNewUser] = useState(true);
    const [notifySuspension, setNotifySuspension] = useState(true);

    // API
    const [apiKeys] = useState([
        { name: 'Production Key', key: 'tmsk_prod_a8f29d...x4k1', created: '2024-01-15', lastUsed: '2 hours ago' },
        { name: 'Staging Key', key: 'tmsk_stag_b7e31c...m2p9', created: '2024-03-20', lastUsed: '3 days ago' },
    ]);
    const [webhookUrl, setWebhookUrl] = useState('https://hooks.example.com/trackmysign');

    // Storage
    const [maxStoragePerTenant, setMaxStoragePerTenant] = useState(256);
    const [backupFrequency, setBackupFrequency] = useState('daily');
    const [retentionDays, setRetentionDays] = useState(90);

    // Appearance
    const [primaryColor, setPrimaryColor] = useState('#2563eb');
    const [darkMode, setDarkMode] = useState(false);
    const [showBranding, setShowBranding] = useState(true);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Platform Settings</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Configure your SaaS platform's core settings.</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 self-start sm:self-auto cursor-pointer ${saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'}`}
                >
                    <BsCheck2 size={14} />
                    {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:w-56 shrink-0">
                    <div className="bg-white rounded-2xl border border-slate-100 p-2 lg:sticky lg:top-4">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-6 lg:p-8">

                    {/* GENERAL */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">General Settings</h2>
                                <p className="text-xs text-slate-400">Basic platform configuration and identity.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SettingsField label="Platform Name" value={platformName} onChange={setPlatformName} />
                                <SettingsField label="Custom Domain" value={domain} onChange={setDomain} />
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Timezone</label>
                                    <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer">
                                        <option value="UTC-5">UTC-5 (Eastern)</option>
                                        <option value="UTC-6">UTC-6 (Central)</option>
                                        <option value="UTC-8">UTC-8 (Pacific)</option>
                                        <option value="UTC+0">UTC+0 (London)</option>
                                        <option value="UTC+1">UTC+1 (Berlin)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Default Language</label>
                                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer">
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="de">German</option>
                                        <option value="fr">French</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PLANS */}
                    {activeTab === 'plans' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Plans & Billing</h2>
                                <p className="text-xs text-slate-400">Configure subscription tiers and pricing.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {plans.map((plan, i) => (
                                    <div key={i} className="border border-slate-200 rounded-2xl p-5 hover:border-blue-200 transition-colors">
                                        <h3 className="text-sm font-semibold text-slate-800 mb-1">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-2xl font-semibold text-slate-900">€{plan.price}</span>
                                            <span className="text-xs text-slate-400">/month</span>
                                        </div>
                                        <div className="space-y-2 text-xs text-slate-500">
                                            <p>Users: {plan.users === -1 ? 'Unlimited' : plan.users}</p>
                                            <p>Storage: {plan.storage} GB</p>
                                            <div className="pt-2 border-t border-slate-100 mt-3 space-y-1">
                                                {plan.features.map((f, fi) => (
                                                    <p key={fi} className="flex items-center gap-1.5"><BsCheck2 className="text-emerald-500" size={12} />{f}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECURITY */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Security Settings</h2>
                                <p className="text-xs text-slate-400">Password policies and access controls.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Min Password Length</label>
                                    <input type="number" value={minPasswordLength} onChange={(e) => setMinPasswordLength(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Session Timeout (minutes)</label>
                                    <input type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Max Login Attempts</label>
                                    <input type="number" value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Require 2FA</p>
                                        <p className="text-xs text-slate-400">Force two-factor authentication for all admins</p>
                                    </div>
                                    <button onClick={() => setRequire2FA(!require2FA)} className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${require2FA ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${require2FA ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EMAIL */}
                    {activeTab === 'email' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Email & Notifications</h2>
                                <p className="text-xs text-slate-400">SMTP configuration and notification preferences.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SettingsField label="SMTP Host" value={smtpHost} onChange={setSmtpHost} />
                                <SettingsField label="SMTP Port" value={smtpPort} onChange={setSmtpPort} />
                                <SettingsField label="Sender Email" value={senderEmail} onChange={setSenderEmail} />
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-800 mb-4">Notification Triggers</h3>
                                <div className="space-y-3">
                                    <ToggleRow label="New Tenant Created" desc="Send welcome email when a tenant is onboarded" value={notifyNewTenant} onChange={setNotifyNewTenant} />
                                    <ToggleRow label="New User Registered" desc="Notify admin when a user joins" value={notifyNewUser} onChange={setNotifyNewUser} />
                                    <ToggleRow label="Tenant Suspended" desc="Alert tenant admin on suspension" value={notifySuspension} onChange={setNotifySuspension} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API */}
                    {activeTab === 'api' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">API & Integrations</h2>
                                <p className="text-xs text-slate-400">Manage API keys and webhook endpoints.</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 mb-3">API Keys</h3>
                                <div className="space-y-3">
                                    {apiKeys.map((k, i) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">{k.name}</p>
                                                <p className="text-xs text-slate-400 font-mono mt-0.5">{k.key}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Created: {k.created}</p>
                                                <p className="text-xs text-slate-400">Last used: {k.lastUsed}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3">Webhook URL</h3>
                                <SettingsField label="Endpoint URL" value={webhookUrl} onChange={setWebhookUrl} />
                            </div>
                        </div>
                    )}

                    {/* STORAGE */}
                    {activeTab === 'storage' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Storage Settings</h2>
                                <p className="text-xs text-slate-400">Configure storage limits and backup policies.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Max Storage Per Tenant (GB)</label>
                                    <input type="number" value={maxStoragePerTenant} onChange={(e) => setMaxStoragePerTenant(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Backup Frequency</label>
                                    <select value={backupFrequency} onChange={(e) => setBackupFrequency(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer">
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Data Retention (Days)</label>
                                    <input type="number" value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                                </div>
                            </div>
                            {/* Usage Bar */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-semibold text-slate-700">Global Storage Usage</p>
                                    <p className="text-xs font-semibold text-slate-500">307.2 GB / 1024 GB</p>
                                </div>
                                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* APPEARANCE */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Appearance</h2>
                                <p className="text-xs text-slate-400">Customize the look and feel of your platform.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Primary Brand Color</label>
                                    <div className="flex items-center gap-3">
                                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                                        <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <ToggleRow label="Dark Mode Default" desc="Set dark mode as default for all tenants" value={darkMode} onChange={setDarkMode} />
                                <ToggleRow label="Show Platform Branding" desc="Display 'Powered by TrackMySign' in tenant dashboards" value={showBranding} onChange={setShowBranding} />
                            </div>
                            {/* Preview */}
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Color Preview</p>
                                <div className="flex gap-3">
                                    <div className="w-16 h-16 rounded-xl shadow-lg" style={{ backgroundColor: primaryColor }} />
                                    <div className="w-16 h-16 rounded-xl shadow-lg" style={{ backgroundColor: primaryColor, opacity: 0.7 }} />
                                    <div className="w-16 h-16 rounded-xl shadow-lg" style={{ backgroundColor: primaryColor, opacity: 0.4 }} />
                                    <div className="w-16 h-16 rounded-xl shadow-lg" style={{ backgroundColor: primaryColor, opacity: 0.15 }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Reusable Components
function SettingsField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
        </div>
    );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
            <div>
                <p className="text-sm font-semibold text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <button onClick={() => onChange(!value)} className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${value ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
        </div>
    );
}
