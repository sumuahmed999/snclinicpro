import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { AppointmentQueue } from '../components/staff';
import { Button } from '../components/common';

export const AppointmentQueuePage = () => {
  const { slotId } = useParams<{ slotId: string }>();
  const navigate = useNavigate();

  if (!slotId) {
    return (
      <Layout showSidebar={true} showFooter={false}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm sm:text-base">Invalid slot ID</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true} showFooter={false}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointment Queue</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage appointments for this slot
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/staff/dashboard')} className="w-full sm:w-auto">
            <svg
              className="w-5 h-5 sm:mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        <AppointmentQueue slotId={parseInt(slotId)} />
      </div>
    </Layout>
  );
};
