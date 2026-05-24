import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { ManualBooking } from '../components/staff';

export const ManualBookingPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to staff dashboard after successful booking
    navigate('/staff/dashboard');
  };

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manual Booking</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create appointments for walk-in patients
          </p>
        </div>

        <ManualBooking onSuccess={handleSuccess} />
      </div>
    </Layout>
  );
};
