import { useState } from 'react';
import { Layout } from '../components/layout';
import { AppointmentList } from '../components/patient/AppointmentList';
import { useAppointments } from '../hooks/useAppointments';

export const Appointments = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  // Fetch appointments from API
  const { data, isLoading } = useAppointments();
  const appointments = data?.data || [];

  // Filter appointments based on active tab
  const upcomingAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.slot?.date || '');
    return appointmentDate >= new Date() && apt.status !== 'completed' && apt.status !== 'cancelled';
  });

  const pastAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.slot?.date || '');
    return appointmentDate < new Date() || apt.status === 'completed' || apt.status === 'cancelled';
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-500 mb-2">
            My Appointments
          </h1>
          <p className="text-sage-600">
            View and manage your appointments
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-sage-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-sage-600 hover:text-primary-500 hover:border-sage-300'
              }`}
            >
              Upcoming
              {upcomingAppointments.length > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-primary-100 text-primary-600">
                  {upcomingAppointments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'past'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-sage-600 hover:text-primary-500 hover:border-sage-300'
              }`}
            >
              Past
              {pastAppointments.length > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-sage-100 text-sage-600">
                  {pastAppointments.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="card p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'upcoming' && (
                <>
                  {upcomingAppointments.length > 0 ? (
                    <AppointmentList appointments={upcomingAppointments} isPast={false} />
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-sage-900">No upcoming appointments</h3>
                      <p className="mt-1 text-sm text-sage-500">Get started by booking a new appointment.</p>
                      <div className="mt-6">
                        <a
                          href="/book-appointment"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gold-500 hover:bg-gold-600 hover:shadow-lg transition-all"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Book Appointment
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'past' && (
                <>
                  {pastAppointments.length > 0 ? (
                    <AppointmentList appointments={pastAppointments} isPast={true} />
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-sage-900">No past appointments</h3>
                      <p className="mt-1 text-sm text-sage-500">Your appointment history will appear here.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};
