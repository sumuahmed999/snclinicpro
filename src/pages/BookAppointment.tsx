import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { BookingFlow } from '../components/patient';

const BookAppointment: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    // Navigate to appointments page after successful booking
    navigate('/appointments');
  };

  return (
    <Layout showSidebar={true}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-primary-500 mb-2">
            Book an Appointment
          </h1>
          <p className="text-sage-600">
            Follow the steps below to schedule your appointment with our healthcare professionals
          </p>
        </div>

        {/* Booking Flow */}
        <BookingFlow onComplete={handleComplete} />
      </div>
    </Layout>
  );
};

export default BookAppointment;
