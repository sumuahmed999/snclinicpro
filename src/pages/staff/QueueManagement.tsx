import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Loader, Button } from '../../components/common';
import { appointmentService } from '../../services/appointments';
import { todayLocalDate } from '../../utils/formatters';

// Helper function to convert 24-hour time to 12-hour format with AM/PM
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const QueueManagementPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(todayLocalDate());

  // Fetch appointments for selected date
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['queue-appointments', selectedDate],
    queryFn: () => appointmentService.getAllAppointments({ date: selectedDate }),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const appointments = appointmentsData?.data || [];

  // Group appointments by slot
  const slotGroups = appointments.reduce((acc, apt) => {
    const slotId = apt.slot_id;
    if (!acc[slotId]) {
      acc[slotId] = {
        slot: apt.slot,
        doctor: apt.doctor,
        appointments: [],
      };
    }
    acc[slotId].appointments.push(apt);
    return acc;
  }, {} as Record<number, { slot: any; doctor: any; appointments: any[] }>);

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary-500">Queue Management</h1>
            <p className="mt-2 text-sage-600">View and manage appointment queues by slot</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="queue-date" className="text-sm font-medium text-gray-700">
              Date:
            </label>
            <input
              id="queue-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : Object.keys(slotGroups).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-4">No appointments for this date</p>
            <Button variant="primary" onClick={() => navigate('/staff/manual-booking')}>
              Create Manual Booking
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(slotGroups).map(([slotId, group]) => {
              const pendingCount = group.appointments.filter(
                (apt) => apt.status === 'pending' || apt.status === 'confirmed'
              ).length;
              const completedCount = group.appointments.filter((apt) => apt.status === 'completed')
                .length;
              const totalCount = group.appointments.length;

              return (
                <div
                  key={slotId}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/staff/queue/${slotId}`)}
                >
                  <div className="p-6">
                    {/* Slot Time */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-primary-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-lg font-bold text-gray-900">
                          {group.slot?.start_time && formatTime12Hour(group.slot.start_time)} - {group.slot?.end_time && formatTime12Hour(group.slot.end_time)}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        {totalCount} patients
                      </span>
                    </div>

                    {/* Doctor Info */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Doctor</p>
                      <p className="font-semibold text-gray-900">Dr. {group.doctor?.name}</p>
                      <p className="text-sm text-gray-600">{group.doctor?.specialization}</p>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                        <p className="text-xs text-gray-600">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary-600">{totalCount}</p>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                    </div>

                    {/* View Queue Button */}
                    <Button fullWidth variant="primary" size="sm">
                      View Queue
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};
