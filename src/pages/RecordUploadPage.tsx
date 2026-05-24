import { Layout } from '../components/layout';
import { RecordUpload } from '../components/staff';

export const RecordUploadPage = () => {
  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload and manage patient medical records
          </p>
        </div>

        <RecordUpload />
      </div>
    </Layout>
  );
};
