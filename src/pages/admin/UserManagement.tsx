import { Layout } from '../../components/layout';
import { UserManagement as UserManagementComponent } from '../../components/admin/UserManagement';

export const UserManagementPage = () => {
  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagementComponent />
      </div>
    </Layout>
  );
};
