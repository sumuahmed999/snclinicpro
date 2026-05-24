import React, { useState } from 'react';
import { useBookAppointment } from '../../hooks/useAppointments';
import Button from '../common/Button';
import Modal from '../common/Modal';
import type { Doctor, Slot, FamilyMember } from '../../types';

interface BookingConfirmationProps {
  doctor: Doctor;
  slot: Slot;
  familyMember: FamilyMember | null;
  onConfirm: (appointmentId: number) => void;
  onBack: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  doctor,
  slot,
  familyMember,
  onConfirm,
  onBack,
}) => {
  const [notes, setNotes] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const bookAppointment = useBookAppointment();

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleConfirm = async () => {
    try {
      const response = await bookAppointment.mutateAsync({
        slot_id: slot.id,
        family_member_id: familyMember?.id,
        notes: notes || undefined,
      });

      if (response.data?.id) {
        onConfirm(response.data.id);
      }
    } catch (error: any) {
      // Show error modal instead of inline error
      setShowErrorModal(true);
      console.error('Booking failed:', error);
    }
  };

  const getErrorDetails = () => {
    const error = bookAppointment.error as any;
    const errorMessage = error?.response?.data?.message;
    const errorCode = error?.response?.data?.error;
    
    // Handle specific error cases with user-friendly messages
    if (errorCode === 'duplicate_booking' || errorMessage?.includes('already have an active booking')) {
      return {
        title: 'Appointment Already Exists',
        message: errorMessage || 'You already have an active booking for this time slot.',
        suggestions: [
          'Check your existing appointments in the dashboard',
          'Cancel your existing appointment if you want to rebook',
          'Select a different time slot',
        ],
        icon: 'info',
      };
    }
    
    if (errorCode === 'slot_full' || errorMessage?.includes('full') || errorMessage?.includes('no longer available')) {
      return {
        title: 'Slot No Longer Available',
        message: 'This time slot has been filled by another patient.',
        suggestions: [
          'Go back and select a different time slot',
          'Check other available dates',
          'Consider booking with a different doctor',
        ],
        icon: 'warning',
      };
    }
    
    if (errorCode === 'past_slot' || errorMessage?.includes('past')) {
      return {
        title: 'Invalid Time Slot',
        message: 'This slot is in the past and cannot be booked.',
        suggestions: [
          'Select a future time slot',
          'Refresh the page to see current availability',
        ],
        icon: 'error',
      };
    }
    
    // Default error
    return {
      title: 'Booking Failed',
      message: errorMessage || 'Unable to book appointment. The slot may be full or no longer available.',
      suggestions: [
        'Try selecting a different time slot',
        'Refresh the page and try again',
        'Contact support if the issue persists',
      ],
      icon: 'error',
    };
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Confirm Your Appointment
      </h2>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          {/* Doctor Info */}
          <div className="flex items-start">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">Doctor</div>
              <div className="font-semibold text-gray-900">{doctor.name}</div>
              <div className="text-sm text-gray-600">{doctor.specialization}</div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-green-600"
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
            </div>
            <div>
              <div className="text-sm text-gray-600">Date & Time</div>
              <div className="font-semibold text-gray-900">{formatDate(slot.date)}</div>
              <div className="text-sm text-gray-600">
                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
              </div>
            </div>
          </div>

          {/* Patient */}
          <div className="flex items-start">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">Patient</div>
              <div className="font-semibold text-gray-900">
                {familyMember ? familyMember.name : 'Myself'}
              </div>
              {familyMember && (
                <div className="text-sm text-gray-600">{familyMember.relationship}</div>
              )}
            </div>
          </div>

          {/* Consultation Fee */}
          <div className="flex items-start">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">Consultation Fee</div>
              <div className="font-semibold text-gray-900 text-lg">
                ₹{doctor.consultation_fee}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any specific concerns or information for the doctor..."
        />
      </div>

      {/* Error Message */}
      {bookAppointment.isError && (
        <Modal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title={getErrorDetails().title}
        >
          <div className="space-y-4">
            {/* Error Icon */}
            <div className="flex justify-center">
              {getErrorDetails().icon === 'info' ? (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : getErrorDetails().icon === 'warning' ? (
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Error Message */}
            <div className="text-center">
              <p className="text-gray-700 text-lg">{getErrorDetails().message}</p>
            </div>

            {/* Suggestions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">What you can do:</p>
              <ul className="space-y-2">
                {getErrorDetails().suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700">
                    <svg className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowErrorModal(false);
                  onBack();
                }}
                className="flex-1"
              >
                Select Different Slot
              </Button>
              <Button
                onClick={() => setShowErrorModal(false)}
                className="flex-1"
              >
                Got It
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={bookAppointment.isPending}>
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          isLoading={bookAppointment.isPending}
          disabled={bookAppointment.isPending}
        >
          Confirm & Proceed to Payment
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
