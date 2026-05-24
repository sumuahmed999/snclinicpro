import { useState } from 'react';
import type { Appointment } from '../../types';
import { AppointmentDetails } from './AppointmentDetails';
import { Modal } from '../common';

interface AppointmentListProps {
  appointments: Appointment[];
  isPast?: boolean;
}

export const AppointmentList = ({ appointments, isPast = false }: AppointmentListProps) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter appointments by status
  const filteredAppointments = statusFilter === 'all'
    ? appointments
    : appointments.filter(apt => apt.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const canCancelOrReschedule = (appointment: Appointment) => {
    if (isPast) return false;
    if (appointment.status === 'cancelled' || appointment.status === 'rejected' || appointment.status === 'completed') {
      return false;
    }
    return true;
  };

  return (
    <div>
      {/* Status Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('confirmed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'confirmed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Confirmed
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending
        </button>
        {isPast && (
          <>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </>
        )}
      </div>

      {/* Appointments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedAppointment(appointment)}
          >
            {/* Doctor Info */}
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 text-lg">
                {appointment.doctor?.name || 'Unknown Doctor'}
              </h3>
              <p className="text-sm text-gray-600">
                {appointment.doctor?.specialization}
              </p>
            </div>

            {/* Date and Time */}
            <div className="mb-3 space-y-1">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {appointment.slot ? formatDate(appointment.slot.date) : 'N/A'}
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {appointment.slot ? formatTime(appointment.slot.start_time) : 'N/A'}
              </div>
            </div>

            {/* Token Number */}
            <div className="mb-3">
              <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                Token: {appointment.token_number}
              </span>
            </div>

            {/* Status Badges */}
            <div className="flex gap-2 mb-3">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(appointment.payment_status)}`}>
                {appointment.payment_status.charAt(0).toUpperCase() + appointment.payment_status.slice(1)}
              </span>
            </div>

            {/* Action Buttons */}
            {canCancelOrReschedule(appointment) && (
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAppointment(appointment);
                  }}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  View Details
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAppointments.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No appointments found</p>
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAppointment(null)}
          title="Appointment Details"
          size="lg"
        >
          <AppointmentDetails
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
          />
        </Modal>
      )}
    </div>
  );
};
