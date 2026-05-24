import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Appointment } from '../../types';
import { medicalRecordService } from '../../services/medicalRecords';
import { feedbackService, type SubmitFeedbackData } from '../../services/feedback';
import { paymentService } from '../../services/payments';
import { useCancelAppointment } from '../../hooks/useAppointments';
import { Button, Loader } from '../common';

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
}

export const AppointmentDetails = ({ appointment, onClose }: AppointmentDetailsProps) => {
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');

  // Fetch medical records
  const { data: medicalRecordsData, isLoading: loadingRecords } = useQuery({
    queryKey: ['medicalRecords', appointment.id],
    queryFn: () => medicalRecordService.getRecords(appointment.id),
  });

  // Cancel appointment mutation
  const cancelMutation = useCancelAppointment();

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: (data: SubmitFeedbackData) =>
      feedbackService.submitFeedback(appointment.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowFeedbackForm(false);
      setRating(0);
      setComments('');
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const handleCancelAppointment = async () => {
    try {
      await cancelMutation.mutateAsync({
        id: appointment.id,
        data: { reason: cancelReason },
      });
      setShowCancelConfirm(false);
      onClose();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const blob = await paymentService.downloadInvoice(appointment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${appointment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  const handleDownloadRecord = async (recordId: number, fileName: string) => {
    try {
      const blob = await medicalRecordService.downloadRecord(recordId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download record:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        rating,
        comments: comments.trim() || undefined,
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const canCancel = appointment.status === 'confirmed' || appointment.status === 'pending';
  const canProvideFeedback = appointment.status === 'completed' || appointment.status === 'confirmed';

  const medicalRecords = medicalRecordsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Appointment Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Appointment Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Doctor:</span>
            <span className="font-medium text-gray-900">{appointment.doctor?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Specialization:</span>
            <span className="font-medium text-gray-900">{appointment.doctor?.specialization}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium text-gray-900">
              {appointment.slot ? formatDate(appointment.slot.date) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-gray-900">
              {appointment.slot ? formatTime(appointment.slot.start_time) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Token Number:</span>
            <span className="font-medium text-blue-600">{appointment.token_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium text-gray-900 capitalize">{appointment.status}</span>
          </div>
          {appointment.family_member && (
            <div className="flex justify-between">
              <span className="text-gray-600">For:</span>
              <span className="font-medium text-gray-900">{appointment.family_member.name}</span>
            </div>
          )}
          {appointment.notes && (
            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-600">Notes:</span>
              <p className="mt-1 text-gray-900">{appointment.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium text-gray-900">
              ₹{appointment.doctor?.consultation_fee || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Status:</span>
            <span className="font-medium text-gray-900 capitalize">
              {appointment.payment_status}
            </span>
          </div>
          {appointment.payment?.payment_method && (
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium text-gray-900 capitalize">
                {appointment.payment.payment_method}
              </span>
            </div>
          )}
        </div>
        {appointment.payment_status === 'paid' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadInvoice}
            className="mt-3 w-full"
          >
            Download Invoice
          </Button>
        )}
      </div>

      {/* Medical Records */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Medical Records</h3>
        {loadingRecords ? (
          <div className="flex justify-center py-4">
            <Loader size="sm" />
          </div>
        ) : medicalRecords.length === 0 ? (
          <p className="text-sm text-gray-600">No medical records available</p>
        ) : (
          <div className="space-y-2">
            {medicalRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{record.file_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{record.record_type.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => handleDownloadRecord(record.id, record.file_name)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Section */}
      {canProvideFeedback && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Feedback</h3>
          {!showFeedbackForm ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFeedbackForm(true)}
              className="w-full"
            >
              Provide Feedback
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Share your experience..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitFeedback}
                  disabled={submitFeedbackMutation.isPending}
                  className="flex-1"
                >
                  {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setRating(0);
                    setComments('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              {submitFeedbackMutation.isError && (
                <p className="text-sm text-red-600 mt-2">
                  {(submitFeedbackMutation.error as any)?.response?.data?.message || 'Failed to submit feedback. Please try again.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {canCancel && !showCancelConfirm && (
          <Button
            variant="danger"
            size="md"
            onClick={() => setShowCancelConfirm(true)}
            className="flex-1"
          >
            Cancel Appointment
          </Button>
        )}
        
        {showCancelConfirm && (
          <div className="w-full space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please provide a reason..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelAppointment}
                disabled={cancelMutation.isPending}
                className="flex-1"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelReason('');
                }}
                className="flex-1"
              >
                Keep Appointment
              </Button>
            </div>
          </div>
        )}

        {!showCancelConfirm && (
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
};
