import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingOverlay from './components/LoadingOverlay';
import LoaderTest from './pages/LoaderTest';

// Pages
import SuperAdminDashboard from './roles/superadmin/pages/Dashboard';
import AdminDashboard from './roles/admin/pages/Dashboard';
import EmployeeDashboard from './roles/employee/pages/Dashboard';
import ClientDashboard from './roles/client/pages/Dashboard';

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/loader-test" element={<LoaderTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Dashboard component based on role
  const getDashboard = () => {
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

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/dashboard" element={getDashboard()} />
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
