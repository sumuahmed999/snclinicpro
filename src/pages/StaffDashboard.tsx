import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Loader, Button } from '../components/common';
import { appointmentService } from '../services/appointments';
import { todayLocalDate } from '../utils/formatters';
import type { Appointment } from '../types';

// Helper function to convert 24-hour time to 12-hour format with AM/PM
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const StaffDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(todayLocalDate());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | 'all'>('all');

  // Fetch appointments for selected date with auto-refresh
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['staff-appointments', selectedDate],
    queryFn: () => appointmentService.getAllAppointments({ date: selectedDate }),
    refetchInterval: 10000,
  });

  const appointments = appointmentsData?.data || [];

  // Filter appointments by selected doctor
  const filteredAppointments = selectedDoctorId === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.doctor_id === selectedDoctorId);

  // Get unique doctors from appointments
  const uniqueDoctors = Array.from(
    new Map(appointments.map(apt => [apt.doctor_id, apt.doctor])).values()
  ).filter((doctor): doctor is NonNullable<typeof doctor> => doctor !== null && doctor !== undefined);

  // Calculate statistics based on filtered appointments
  const totalAppointments = filteredAppointments.length;
  const pendingAppointments = filteredAppointments.filter(apt => apt.status === 'pending' || apt.status === 'confirmed').length;
  const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed').length;
  const cancelledAppointments = filteredAppointments.filter(apt => apt.status === 'cancelled' || apt.status === 'rejected').length;

  // Get current serving appointment for selected doctor
  const currentServing = filteredAppointments.find(apt => apt.status === 'confirmed');
  const nextInQueue = filteredAppointments.filter(apt => apt.status === 'pending')[0];

  // Complete appointment mutation
  const completeMutation = useMutation({
    mutationFn: (appointmentId: number) =>
      appointmentService.updateStatus(appointmentId, { action: 'complete' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-appointments'] });
    },
  });

  // Reject appointment mutation
  const rejectMutation = useMutation({
    mutationFn: ({ appointmentId, reason }: { appointmentId: number; reason: string }) =>
      appointmentService.updateStatus(appointmentId, { action: 'reject', reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-appointments'] });
    },
  });

  const handleComplete = (appointmentId: number) => {
    if (confirm('Mark this appointment as completed?')) {
      completeMutation.mutate(appointmentId);
    }
  };

  const handleReject = (appointmentId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectMutation.mutate({ appointmentId, reason });
    }
  };

  return (
    <Layout showSidebar={true}>
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header with Search and Actions */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search patients, tokens, doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <Button
                  onClick={() => navigate('/staff/records')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload
                </Button>
                <Button
                  onClick={() => navigate('/staff/manual-booking')}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2 bg-[#1a4d3e] hover:bg-[#153d32]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Manual Booking
                </Button>
              </div>
            </div>

            {/* Title and Date */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase mb-1">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h1 className="text-3xl font-bold text-gray-900">Staff dashboard</h1>
                <p className="text-gray-600 mt-1">Manage appointments, queue and patient records.</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Doctor Filter */}
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="border-none focus:outline-none text-sm bg-transparent cursor-pointer"
                  >
                    <option value="all">All Doctors</option>
                    {uniqueDoctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Date Picker */}
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border-none focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <StatCard
                    title="Total Appointments"
                    value={totalAppointments}
                    subtitle="+3 today"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                    bgColor="bg-blue-50"
                    iconColor="text-blue-600"
                  />
                  <StatCard
                    title="Pending"
                    value={pendingAppointments}
                    subtitle="Awaiting action"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    bgColor="bg-yellow-50"
                    iconColor="text-yellow-600"
                  />
                  <StatCard
                    title="Completed"
                    value={completedAppointments}
                    subtitle="+2 vs yesterday"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    bgColor="bg-green-50"
                    iconColor="text-green-600"
                  />
                  <StatCard
                    title="Cancelled"
                    value={cancelledAppointments}
                    subtitle="-50% vs avg"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    bgColor="bg-red-50"
                    iconColor="text-red-600"
                  />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-1">Quick actions</h2>
                  <p className="text-sm text-gray-500 mb-4">Most-used staff workflows</p>
                  <div className="grid grid-cols-4 gap-3">
                    <QuickActionCard
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      }
                      label="Manual Booking"
                      subtitle="Create new appointment"
                      onClick={() => navigate('/staff/manual-booking')}
                    />
                    <QuickActionCard
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      }
                      label="Appointment Queue"
                      subtitle="Manage live queue"
                      onClick={() => navigate('/staff/queue')}
                    />
                    <QuickActionCard
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      }
                      label="Upload Records"
                      subtitle="Patient files & docs"
                      onClick={() => navigate('/staff/records')}
                    />
                    <QuickActionCard
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      }
                      label="Messages"
                      subtitle="Patient inbox"
                      onClick={() => navigate('/messages')}
                    />
                  </div>
                </div>

                {/* Appointments List */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {filteredAppointments.length} bookings
                        {selectedDoctorId !== 'all' && ` · ${uniqueDoctors.find(d => d.id === selectedDoctorId)?.name}`}
                        {' · LIVE'}
                      </p>
                    </div>
                    <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      View all
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {filteredAppointments.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-gray-500">
                        {selectedDoctorId === 'all' 
                          ? 'No appointments for this date' 
                          : `No appointments for ${uniqueDoctors.find(d => d.id === selectedDoctorId)?.name} on this date`}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredAppointments.slice(0, 5).map((appointment) => (
                        <AppointmentRow
                          key={appointment.id}
                          appointment={appointment}
                          onComplete={() => handleComplete(appointment.id)}
                          onReject={() => handleReject(appointment.id)}
                          onView={() => navigate(`/staff/queue`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Today's Queue */}
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg shadow-sm p-6 border border-teal-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      {selectedDoctorId === 'all' ? "Today's queue" : `${uniqueDoctors.find(d => d.id === selectedDoctorId)?.name}'s queue`}
                    </h3>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-700">Live</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Currently serving</p>
                  
                  {currentServing ? (
                    <div className="mb-6">
                      <div className="text-center mb-2 bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase mb-2 tracking-wide">Now Serving</p>
                        <p className="text-5xl font-bold text-teal-600">{currentServing.token_number.split('-').pop()}</p>
                        <p className="text-sm text-gray-700 mt-2 font-medium">{currentServing.doctor?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white rounded-xl text-gray-500">
                      {selectedDoctorId === 'all' ? 'No one being served' : 'No patients in queue'}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Next</p>
                      <p className="text-2xl font-bold text-blue-600">{nextInQueue?.token_number.split('-').pop() || '---'}</p>
                    </div>
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Waiting</p>
                      <p className="text-2xl font-bold text-amber-600">{pendingAppointments}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('/staff/queue')}
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 border-teal-200 hover:border-teal-300"
                  >
                    Open queue manager
                  </Button>
                </div>

                {/* Today's Progress */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-sm p-6 border border-purple-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Today's progress</h3>
                  <p className="text-sm text-gray-600 mb-4">{completedAppointments} of {totalAppointments} completed</p>
                  
                  <div className="mb-4">
                    <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                        style={{ width: `${totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-2xl font-bold text-green-600">{completedAppointments}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Done</p>
                    </div>
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-2xl font-bold text-amber-600">{pendingAppointments}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                    </div>
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-2xl font-bold text-red-600">{cancelledAppointments}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Cancel</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-2.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="font-medium">On track to hit daily target</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

const StatCard = ({ title, value, subtitle, icon, bgColor, iconColor }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
};

// Quick Action Card
interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  onClick: () => void;
}

const QuickActionCard = ({ icon, label, subtitle, onClick }: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-left group"
    >
      <div className="text-gray-700 group-hover:text-primary-600 mb-2">{icon}</div>
      <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
      <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-600 mt-2 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

// Appointment Row Component
interface AppointmentRowProps {
  appointment: Appointment;
  onComplete: () => void;
  onReject: () => void;
  onView: () => void;
}

const AppointmentRow = ({ appointment, onComplete, onReject, onView }: AppointmentRowProps) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-gray-100 text-gray-800',
  };

  const paymentColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const canComplete = appointment.status === 'confirmed';
  const canReject = appointment.status === 'pending' || appointment.status === 'confirmed';

  const patientName = appointment.family_member?.name || appointment.user?.name || 'Unknown Patient';
  const tokenNumber = appointment.token_number.split('-').pop() || '000';

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Token Number */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-base">{tokenNumber}</span>
          </div>
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{patientName}</p>
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{appointment.doctor?.name || 'Unknown'}</span>
            <span>•</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {appointment.slot?.start_time && formatTime12Hour(appointment.slot.start_time)} — {appointment.slot?.end_time && formatTime12Hour(appointment.slot.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
              {appointment.status}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentColors[appointment.payment_status]}`}>
              {appointment.payment_status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-2">
          {canComplete && (
            <Button
              size="sm"
              variant="primary"
              onClick={onComplete}
              className="flex items-center gap-1 bg-[#1a4d3e] hover:bg-[#153d32]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Complete
            </Button>
          )}
          {canReject && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onView}
            className="flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </Button>
        </div>
      </div>
    </div>
  );
};
