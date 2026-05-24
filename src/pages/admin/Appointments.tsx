import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../../components/layout';
import { Loader } from '../../components/common';
import { appointmentService } from '../../services/appointments';
import type { Appointment } from '../../types';

export const AdminAppointments = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Applied filters (only these trigger API calls)
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-all-appointments', appliedStatusFilter, appliedStartDate, appliedEndDate, currentPage],
    queryFn: () => appointmentService.getAllAppointments({
      status: appliedStatusFilter || undefined,
      start_date: appliedStartDate || undefined,
      end_date: appliedEndDate || undefined,
      page: currentPage,
      per_page: 20,
    }),
  });

  // Mutation for updating appointment status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: 'approve' | 'reject'; reason?: string }) =>
      appointmentService.updateStatus(id, { action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-appointments'] });
      alert('Appointment status updated successfully');
    },
    onError: (error: any) => {
      console.error('Status update error:', error);
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.response?.data?.message || 
                          'Failed to update appointment status';
      alert(errorMessage);
    },
  });

  const handleApprove = (appointment: Appointment) => {
    if (appointment.status !== 'pending') {
      alert('Only pending appointments can be approved');
      return;
    }
    if (confirm('Are you sure you want to approve this appointment?')) {
      updateStatusMutation.mutate({ id: appointment.id, action: 'approve' });
    }
  };

  const handleReject = (appointment: Appointment) => {
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      alert('Only pending or confirmed appointments can be rejected');
      return;
    }
    const reason = prompt('Please enter the reason for rejection:');
    if (reason && reason.trim()) {
      updateStatusMutation.mutate({ 
        id: appointment.id, 
        action: 'reject',
        reason: reason.trim()
      });
    } else if (reason !== null) {
      alert('Rejection reason is required');
    }
  };

  const handleApplyFilters = () => {
    setAppliedStatusFilter(statusFilter);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setAppliedStatusFilter('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setCurrentPage(1);
  };

  const appointments = data?.data || [];
  const pagination = data?.pagination;

  // Calculate unique patients count
  const uniquePatients = appointments.length > 0 
    ? new Set(appointments.map((apt: Appointment) => apt.user_id)).size 
    : 0;

  // Helper function to format date as D/M/Y
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to convert 24-hour time to 12-hour with AM/PM
  const formatTime = (time24: string | undefined) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gold-100 text-gold-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const paymentStatusColors: Record<string, string> = {
    pending: 'bg-gold-100 text-gold-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-primary-500">Appointments Management</h1>
          <p className="mt-2 text-sage-600">View and manage all appointments</p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>

            <div className="flex items-center gap-2">
              <label className="text-sm text-sage-700 font-medium whitespace-nowrap">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-sage-700 font-medium whitespace-nowrap">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm"
            >
              Apply Filters
            </button>

            {(appliedStatusFilter || appliedStartDate || appliedEndDate) && (
              <button
                onClick={handleClearFilters}
                className="px-6 py-2 bg-sage-100 text-sage-700 rounded-lg hover:bg-sage-200 transition-colors font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {!isLoading && pagination && (
          <div className="mb-6 p-4 bg-sage-50 rounded-lg border border-sage-200">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sage-700">
                  <span className="font-semibold text-primary-500">{pagination.total}</span> Total Appointments
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sage-700">
                  <span className="font-semibold text-gold-500">{uniquePatients}</span> Unique Patients
                </span>
              </div>
              {(appliedStatusFilter || appliedStartDate || appliedEndDate) && (
                <div className="flex items-center gap-2 ml-auto">
                  <svg className="w-5 h-5 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-sage-600 italic">Filters applied</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointments Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 text-sage-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sage-600">No appointments found</p>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sage-200">
                  <thead className="bg-sage-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                        Token
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sage-200">
                    {appointments.map((appointment: Appointment) => (
                      <tr key={appointment.id} className="transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-500">
                          {appointment.token_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-sage-900">{appointment.user?.name}</div>
                          <div className="text-sm text-sage-500">{appointment.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-sage-900">Dr. {appointment.doctor?.name}</div>
                          <div className="text-sm text-sage-500">{appointment.doctor?.specialization}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-sage-900">
                            {appointment.slot?.date ? formatDate(appointment.slot.date) : 'N/A'}
                          </div>
                          <div className="text-sm text-sage-500">
                            {formatTime(appointment.slot?.start_time)} - {formatTime(appointment.slot?.end_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status] || 'bg-sage-100 text-sage-700'}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatusColors[appointment.payment_status] || 'bg-sage-100 text-sage-700'}`}>
                            {appointment.payment_status.charAt(0).toUpperCase() + appointment.payment_status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-sage-900">
                          Rs {Number(appointment.payment?.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {appointment.status === 'pending' ? (
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(appointment);
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(appointment);
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-sage-500 italic">No actions</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.total > pagination.per_page && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-sage-600">
                  Showing {pagination.from} to {pagination.to} of {pagination.total} appointments
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-sage-300 rounded-lg text-sm font-medium text-sage-700 hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === pagination.last_page}
                    className="px-4 py-2 border border-sage-300 rounded-lg text-sm font-medium text-sage-700 hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminAppointments;
