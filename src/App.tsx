import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PlansProvider } from './context/PlansContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingOverlay from './components/LoadingOverlay';
import TopProgressBar from './components/TopProgressBar';
import LoaderTest from './pages/LoaderTest';
import { useRouteTransition } from './hooks/useRouteTransition';

import SuperAdminDashboard from './roles/superadmin/pages/Dashboard';
import SuperAdminTenants from './roles/superadmin/pages/Tenants';
import SuperAdminAnalytics from './roles/superadmin/pages/Analytics';
import SuperAdminUsers from './roles/superadmin/pages/Users';
import SuperAdminSettings from './roles/superadmin/pages/Settings';
import AdminDashboard from './roles/admin/pages/Dashboard';
import AdminDocuments from './roles/admin/pages/Documents';
import AdminQuotes from './roles/admin/pages/Quotes';
import AdminOrders from './roles/admin/pages/Orders';
import AdminEmployees from './roles/admin/pages/Employees';
import AdminReports from './roles/admin/pages/Reports';
import AdminSettings from './roles/admin/pages/Settings';
import EmployeeDashboard from './roles/employee/pages/Dashboard';
import EmployeeInbox from './roles/employee/pages/Inbox';
import EmployeeQuotes from './roles/employee/pages/Quotes';
import EmployeeOrders from './roles/employee/pages/Orders';
import EmployeeMyDocuments from './roles/employee/pages/MyDocuments';
import EmployeeActivity from './roles/employee/pages/Activity';
import EmployeeAccount from './roles/employee/pages/Account';
import ClientDashboard from './roles/client/pages/Dashboard';

import SuperAdminLayout from './roles/superadmin/layouts/SuperAdminLayout';
import AdminLayout from './roles/admin/layouts/AdminLayout';
import EmployeeLayout from './roles/employee/layouts/EmployeeLayout';

const PUBLIC_TRANSITION_MS = 1000;
const PRIVATE_TRANSITION_MS = 500;

function PublicRoutes() {
  const { displayedLocation, showProgress } = useRouteTransition(PUBLIC_TRANSITION_MS);

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

function SuperAdminRoutes() {
  const { displayedLocation, showProgress } = useRouteTransition(PRIVATE_TRANSITION_MS);

  return (
    <SuperAdminLayout>
      {showProgress && <TopProgressBar />}
      <Routes location={displayedLocation}>
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

function AdminRoutes() {
  const { displayedLocation, showProgress } = useRouteTransition(PRIVATE_TRANSITION_MS);

  return (
    <AdminLayout>
      {showProgress && <TopProgressBar />}
      <Routes location={displayedLocation}>
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/quotes" element={<AdminQuotes />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/documents" element={<AdminDocuments />} />
        <Route path="/employees" element={<AdminEmployees />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}

function EmployeeRoutes() {
  const { displayedLocation, showProgress } = useRouteTransition(PRIVATE_TRANSITION_MS);

  return (
    <EmployeeLayout>
      {showProgress && <TopProgressBar />}
      <Routes location={displayedLocation}>
        <Route path="/dashboard" element={<EmployeeDashboard />} />
        <Route path="/inbox" element={<EmployeeInbox />} />
        <Route path="/quotes" element={<EmployeeQuotes />} />
        <Route path="/orders" element={<EmployeeOrders />} />
        <Route path="/my-documents" element={<EmployeeMyDocuments />} />
        <Route path="/activity" element={<EmployeeActivity />} />
        <Route path="/account" element={<EmployeeAccount />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </EmployeeLayout>
  );
}

function RoleDashboardRoutes() {
  const { role } = useAuth();
  const { displayedLocation, showProgress } = useRouteTransition(PRIVATE_TRANSITION_MS);

  const dashboard = (() => {
    switch (role) {
      case 'client': return <ClientDashboard />;
      default:
        return (
          <div className="p-8 text-center text-slate-500 text-sm">
            No tienes un rol asignado. Contacta al administrador del sistema.
          </div>
        );
    }
  })();

  return (
    <DashboardLayout>
      {showProgress && <TopProgressBar />}
      <Routes location={displayedLocation}>
        <Route path="/dashboard" element={dashboard} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingOverlay />;
  if (!user) return <PublicRoutes />;
  if (role === 'superadmin') return <SuperAdminRoutes />;
  if (role === 'admin') return <AdminRoutes />;
  if (role === 'employee') return <EmployeeRoutes />;
  return <RoleDashboardRoutes />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <PlansProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </PlansProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
