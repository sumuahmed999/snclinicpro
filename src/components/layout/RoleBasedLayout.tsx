import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layout } from './Layout';

interface RoleBasedLayoutProps {
  children: ReactNode;
  allowedRoles: Array<'patient' | 'staff' | 'admin'>;
  showSidebar?: boolean;
  showFooter?: boolean;
}

export const RoleBasedLayout = ({
  children,
  allowedRoles,
  showSidebar = true,
  showFooter = true,
}: RoleBasedLayoutProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = {
      patient: '/patient/dashboard',
      staff: '/staff/dashboard',
      admin: '/admin/dashboard',
    }[user.role];

    return <Navigate to={redirectPath} replace />;
  }

  // Render layout with children if authorized
  return (
    <Layout showSidebar={showSidebar} showFooter={showFooter}>
      {children}
    </Layout>
  );
};

// Convenience wrappers for specific roles
export const PatientLayout = ({ children, ...props }: Omit<RoleBasedLayoutProps, 'allowedRoles'>) => (
  <RoleBasedLayout allowedRoles={['patient']} {...props}>
    {children}
  </RoleBasedLayout>
);

export const StaffLayout = ({ children, ...props }: Omit<RoleBasedLayoutProps, 'allowedRoles'>) => (
  <RoleBasedLayout allowedRoles={['staff']} {...props}>
    {children}
  </RoleBasedLayout>
);

export const AdminLayout = ({ children, ...props }: Omit<RoleBasedLayoutProps, 'allowedRoles'>) => (
  <RoleBasedLayout allowedRoles={['admin']} {...props}>
    {children}
  </RoleBasedLayout>
);

export const StaffOrAdminLayout = ({ children, ...props }: Omit<RoleBasedLayoutProps, 'allowedRoles'>) => (
  <RoleBasedLayout allowedRoles={['staff', 'admin']} {...props}>
    {children}
  </RoleBasedLayout>
);
