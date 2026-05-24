import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppointments } from '../hooks/useAppointments';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout';
import { Loader } from '../components/common';
import { formatTime } from '../utils/formatters';
import { messageService } from '../services/messages';
import type { Appointment } from '../types';

export const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: appointmentsData, isLoading, error } = useAppointments();

  // Fetch real unread message count
  const { data: messagesData } = useQuery({
    queryKey: ['messages-unread-count'],
    queryFn: () => messageService.getMessages(),
    staleTime: 30000,
  });
  const unreadMessageCount = (messagesData?.data || []).filter(
    (msg: any) => !msg.is_read && msg.recipient_id === user?.id
  ).length;

  const appointments = appointmentsData?.data || [];
  const now = new Date();

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate statistics
  const upcomingAppointments = appointments.filter(appointment => {
    if (appointment.status === 'cancelled' || appointment.status === 'rejected') return false;
    if (!appointment.slot) return false;
    const appointmentDateTime = new Date(`${appointment.slot.date} ${appointment.slot.start_time}`);
    return appointmentDateTime >= now;
  });

  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  
  // Calculate total pending payments - exclude cancelled/rejected appointments
  const pendingPaymentAppointments = appointments
    .filter(apt => apt.payment_status === 'pending' && !['cancelled', 'rejected'].includes(apt.status));
  const totalPendingPayments = pendingPaymentAppointments
    .reduce((sum, apt) => sum + (Number(apt.doctor?.consultation_fee) || 0), 0);
  const pendingInvoiceCount = pendingPaymentAppointments.length;

  // Calculate appointments this week
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const appointmentsThisWeek = appointments.filter(apt => {
    if (!apt.slot?.date) return false;
    const aptDate = new Date(apt.slot.date);
    return aptDate >= startOfWeek && aptDate <= endOfWeek && !['cancelled', 'rejected'].includes(apt.status);
  }).length;

  // Calculate last visit days ago
  const lastCompletedVisit = completedAppointments
    .filter(apt => apt.slot?.date)
    .sort((a, b) => new Date(b.slot!.date).getTime() - new Date(a.slot!.date).getTime())[0];

  const lastVisitSubtitle = (() => {
    if (!lastCompletedVisit?.slot?.date) return 'No visits yet';
    const diffMs = now.getTime() - new Date(lastCompletedVisit.slot.date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Last visit today';
    if (diffDays === 1) return 'Last visit yesterday';
    return `Last visit ${diffDays} days ago`;
  })();
  const recentAppointments = [...appointments]
    .sort((a, b) => {
      const dateA = new Date(`${a.slot?.date} ${a.slot?.start_time}`);
      const dateB = new Date(`${b.slot?.date} ${b.slot?.start_time}`);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  // Get today's token (if any)
  const todayAppointment = appointments.find(apt => {
    if (!apt.slot) return false;
    const aptDate = new Date(apt.slot.date).toDateString();
    return aptDate === now.toDateString() && apt.status !== 'cancelled';
  });

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">Failed to load dashboard data. Please try again.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                {currentDate}
              </p>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                Hello, {user?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Here's a quick look at your appointments and health activity.
              </p>
              <button
                onClick={() => navigate('/health-records')}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                View health summary
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Upcoming Appointments"
                value={upcomingAppointments.length}
                subtitle={appointmentsThisWeek > 0 ? `+${appointmentsThisWeek} this week` : 'None this week'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
              />
              <StatCard
                title="Completed Visits"
                value={completedAppointments.length}
                subtitle={lastVisitSubtitle}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                iconBg="bg-green-50"
                iconColor="text-green-600"
              />
              <StatCard
                title="Pending Payments"
                value={`₹${totalPendingPayments.toLocaleString('en-IN')}`}
                subtitle={pendingInvoiceCount > 0 ? `${pendingInvoiceCount} invoice${pendingInvoiceCount > 1 ? 's' : ''} due` : 'No pending payments'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick actions</h2>
              <p className="text-sm text-gray-600 mb-4">Jump straight into common tasks</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickActionButton
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  label="Book Appointment"
                  subtitle="Find a doctor"
                  onClick={() => navigate('/book-appointment')}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                />
                <QuickActionButton
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                  label="Family Members"
                  subtitle="Manage profiles"
                  onClick={() => navigate('/family-members')}
                  iconBg="bg-teal-50"
                  iconColor="text-teal-600"
                />
                <QuickActionButton
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  label="Medical Records"
                  subtitle="View & download"
                  onClick={() => navigate('/health-records')}
                  iconBg="bg-purple-50"
                  iconColor="text-purple-600"
                />
                <QuickActionButton
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  }
                  label="Messages"
                  subtitle={unreadMessageCount > 0 ? `${unreadMessageCount} unread` : 'No new messages'}
                  onClick={() => navigate('/messages')}
                  iconBg="bg-gray-50"
                  iconColor="text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Appointments */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Recent appointments</h2>
                    <p className="text-sm text-gray-600">Your latest 5 bookings</p>
                  </div>
                  <button
                    onClick={() => navigate('/appointments')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                  >
                    View all
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {recentAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 mb-4">No appointments yet</p>
                    <button
                      onClick={() => navigate('/book-appointment')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Book Your First Appointment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onClick={() => navigate(`/appointments/${appointment.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Today's Token */}
                {todayAppointment ? (
                  <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium opacity-90">Today's live token</h3>
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        Live
                      </span>
                    </div>
                    <div className="text-center py-4">
                      <p className="text-sm opacity-90 mb-2">YOUR TOKEN</p>
                      <p className="text-5xl font-bold mb-2">#{todayAppointment.token_number.split('-').pop()}</p>
                      <p className="text-sm opacity-75">2 patients ahead of you</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
                      <div>
                        <p className="text-xs opacity-75 mb-1">NOW SERVING</p>
                        <p className="text-lg font-semibold">#012</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-75 mb-1">EST. WAIT</p>
                        <p className="text-lg font-semibold">12 min</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-600">No appointments today</p>
                  </div>
                )}

                {/* Health Tip */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Health tip</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Stay hydrated — aim for 8 glasses of water daily to support heart and kidney function.
                  </p>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
                    Read more tips
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const StatCard = ({ title, value, subtitle, icon, iconBg, iconColor }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Quick Action Button
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  onClick: () => void;
  iconBg: string;
  iconColor: string;
}

const QuickActionButton = ({ icon, label, subtitle, onClick, iconBg, iconColor }: QuickActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all text-left"
    >
      <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
    </button>
  );
};

// Appointment Card Component
interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

const AppointmentCard = ({ appointment, onClick }: AppointmentCardProps) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
    confirmed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Confirmed' },
    completed: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Completed' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
    rejected: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Rejected' },
  };

  const status = statusConfig[appointment.status] || statusConfig.pending;

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        {/* Token badge */}
        <div className="flex-shrink-0">
          <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-700">
              #{appointment.token_number.split('-').pop()}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-snug">
                {appointment.doctor?.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {appointment.doctor?.specialization}
              </p>
            </div>
            {/* Status + arrow on the right */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.bg} ${status.text}`}>
                {status.label}
              </span>
              <svg
                className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(appointment.slot?.date || '').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            {appointment.slot?.start_time ? ` · ${formatTime(appointment.slot.start_time)}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};
