import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

/**
 * Smart redirect component that sends users to their role-specific dashboard
 */
export const DashboardRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  const dashboardPath = {
    patient: '/patient/dashboard',
    staff: '/staff/dashboard',
    admin: '/admin/dashboard',
  }[user.role];

  return <Navigate to={dashboardPath} replace />;
};
