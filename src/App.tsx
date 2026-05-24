import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardRedirect } from './components/common';
import { useEffect, type ReactElement } from 'react';
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  PatientDashboard,
  Appointments,
  AppointmentDetailsPage,
  BookAppointment,
  FamilyMembers,
  AdminDashboard,
  StaffDashboard,
  ManualBookingPage,
  AppointmentQueuePage,
  RecordUploadPage,
  PatientReportsPage,
  DailyReportsPage,
  QueueManagementPage,
  Messages,
  Profile,
  HealthRecords,
  PaymentHistory,
  Home,
} from './pages';
import {
  DoctorManagement,
  SlotManagement,
  PatientManagement,
  PatientProfile,
  Settings,
} from './components/admin';
import Reports from './pages/admin/Reports';
import ReportDetail from './pages/admin/ReportDetail';
import { UserManagementPage } from './pages/admin/UserManagement';
import { AdminAppointments } from './pages/admin/Appointments';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Route guard: requires authentication + specific roles
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactElement;
  allowedRoles: string[];
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Wait for auth to resolve

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/patient/dashboard" replace />;
  }

  return children;
}

// Route guard: requires authentication (any role)
function AuthRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <a href="#main-content" className="skip-to-main">
            Skip to main content
          </a>

          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Patient-only routes */}
            <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute allowedRoles={['patient']}><Appointments /></ProtectedRoute>} />
            <Route path="/appointments/:id" element={<ProtectedRoute allowedRoles={['patient']}><AppointmentDetailsPage /></ProtectedRoute>} />
            <Route path="/book-appointment" element={<ProtectedRoute allowedRoles={['patient']}><BookAppointment /></ProtectedRoute>} />
            <Route path="/health-records" element={<ProtectedRoute allowedRoles={['patient']}><HealthRecords /></ProtectedRoute>} />
            <Route path="/payment-history" element={<ProtectedRoute allowedRoles={['patient']}><PaymentHistory /></ProtectedRoute>} />
            <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={['patient']}><Appointments /></ProtectedRoute>} />
            <Route path="/patient/book" element={<ProtectedRoute allowedRoles={['patient']}><BookAppointment /></ProtectedRoute>} />
            <Route path="/patient/family" element={<ProtectedRoute allowedRoles={['patient']}><FamilyMembers /></ProtectedRoute>} />
            <Route path="/family-members" element={<ProtectedRoute allowedRoles={['patient']}><FamilyMembers /></ProtectedRoute>} />

            {/* Shared authenticated routes (any logged-in user) */}
            <Route path="/messages" element={<AuthRoute><Messages /></AuthRoute>} />
            <Route path="/profile" element={<AuthRoute><Profile /></AuthRoute>} />

            {/* Staff-only routes */}
            <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><StaffDashboard /></ProtectedRoute>} />
            <Route path="/staff/manual-booking" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><ManualBookingPage /></ProtectedRoute>} />
            <Route path="/staff/queue" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><QueueManagementPage /></ProtectedRoute>} />
            <Route path="/staff/queue/:slotId" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><AppointmentQueuePage /></ProtectedRoute>} />
            <Route path="/staff/records" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><RecordUploadPage /></ProtectedRoute>} />
            <Route path="/staff/patient-reports" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><PatientReportsPage /></ProtectedRoute>} />
            <Route path="/staff/daily-reports" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><DailyReportsPage /></ProtectedRoute>} />
            <Route path="/staff/messages" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><Messages /></ProtectedRoute>} />

            {/* Admin-only routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><AdminAppointments /></ProtectedRoute>} />
            <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><DoctorManagement /></ProtectedRoute>} />
            <Route path="/admin/slots" element={<ProtectedRoute allowedRoles={['admin']}><SlotManagement /></ProtectedRoute>} />
            <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['admin']}><PatientManagement /></ProtectedRoute>} />
            <Route path="/admin/patients/:id" element={<ProtectedRoute allowedRoles={['admin']}><PatientProfile /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
            <Route path="/admin/reports/:reportType" element={<ProtectedRoute allowedRoles={['admin']}><ReportDetail /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['admin']}><Messages /></ProtectedRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

