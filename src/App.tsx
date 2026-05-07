import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingOverlay from './components/LoadingOverlay';
import TopProgressBar from './components/TopProgressBar';
import LoaderTest from './pages/LoaderTest';

// Pages
import SuperAdminDashboard from './roles/superadmin/pages/Dashboard';
import SuperAdminTenants from './roles/superadmin/pages/Tenants';
import SuperAdminAnalytics from './roles/superadmin/pages/Analytics';
import SuperAdminUsers from './roles/superadmin/pages/Users';
import SuperAdminSettings from './roles/superadmin/pages/Settings';
import AdminDashboard from './roles/admin/pages/Dashboard';
import EmployeeDashboard from './roles/employee/pages/Dashboard';
import ClientDashboard from './roles/client/pages/Dashboard';

import SuperAdminLayout from './roles/superadmin/layouts/SuperAdminLayout';

const ROUTE_TRANSITION_MS = 1000;

function PublicRoutes() {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (location.pathname === displayedLocation.pathname) return;

    setShowProgress(true);
    const timer = setTimeout(() => {
      setDisplayedLocation(location);
      setShowProgress(false);
    }, ROUTE_TRANSITION_MS);

    return () => clearTimeout(timer);
  }, [location, displayedLocation.pathname]);

  return (
    <>
      {showProgress && <TopProgressBar />}
      <Routes location={displayedLocation}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/loader-test" element={<LoaderTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!user) {
    return <PublicRoutes />;
  }

  // Dashboard component based on role
  const getDashboardContent = () => {
    switch (role) {
      case 'superadmin': return <SuperAdminDashboard />;
      case 'admin': return <AdminDashboard />;
      case 'employee': return <EmployeeDashboard />;
      case 'client': return <ClientDashboard />;
      default: return (
        <div className="p-8 text-center text-slate-500 font-bold uppercase text-xs">
          Warning: No role assigned. Contact System Admin.
        </div>
      );
    }
  };

  // Wrapper based on role for separate layouts
  if (role === 'superadmin') {
    return (
      <SuperAdminLayout>
        <Routes>
          <Route path="/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/tenants" element={<SuperAdminTenants />} />
          <Route path="/analytics" element={<SuperAdminAnalytics />} />
          <Route path="/users" element={<SuperAdminUsers />} />
          <Route path="/settings" element={<SuperAdminSettings />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SuperAdminLayout>
    );
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/dashboard" element={getDashboardContent()} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
