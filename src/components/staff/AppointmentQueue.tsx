import { useState, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader } from '../common';
import { appointmentService, type UpdateStatusData } from '../../services/appointments';
import { formatTime } from '../../utils/formatters';
import type { Appointment } from '../../types';

interface AppointmentQueueProps {
  slotId: number;
}

// ─── Reject reason modal — isolated so its state never causes the list to re-render ───
interface RejectModalProps {
  appointment: Appointment;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: boolean;
}

const RejectModal = memo(({ appointment, onConfirm, onCancel, isLoading, error }: RejectModalProps) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Reject Appointment</h3>

        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 text-sm">
          <p className="font-medium text-gray-800">
            {appointment.family_member?.name || appointment.user?.name}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">Token: {appointment.token_number}</p>
        </div>

        <label className="block text-xs font-medium text-gray-700 mb-1">
          Reason <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          autoFocus
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
          placeholder="Enter reason for rejection..."
        />

        {error && (
          <p className="text-xs text-red-600 mt-1">Failed to reject. Please try again.</p>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className="flex-1 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {isLoading ? 'Rejecting...' : 'Confirm Reject'}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Complete confirmation modal ───
interface CompleteModalProps {
  appointment: Appointment;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error: boolean;
}

const CompleteModal = memo(({ appointment, onConfirm, onCancel, isLoading, error }: CompleteModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Complete Appointment</h3>

      <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 text-sm">
        <p className="font-medium text-gray-800">
          {appointment.family_member?.name || appointment.user?.name}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">Token: {appointment.token_number}</p>
      </div>

      <p className="text-sm text-gray-600 mb-4">Mark this appointment as completed?</p>

      {error && (
        <p className="text-xs text-red-600 mb-2">Failed to complete. Please try again.</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isLoading ? 'Completing...' : 'Confirm'}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
));

// ─── Queue item row ───
interface QueueItemProps {
  appointment: Appointment;
  onComplete: () => void;
  onReject: () => void;
}

const QueueItem = memo(({ appointment, onComplete, onReject }: QueueItemProps) => {
  const token = appointment.token_number.split('-').pop() || '0';
  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled' || appointment.status === 'rejected';
  const canAct = appointment.status === 'confirmed' || appointment.status === 'pending';
  const patientName = appointment.family_member?.name || appointment.user?.name || 'Unknown';

  const statusBadge: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected:  'bg-gray-100 text-gray-700',
  };

  const paymentBadge: Record<string, string> = {
    pending:  'bg-yellow-50 text-yellow-700',
    paid:     'bg-green-50 text-green-700',
    failed:   'bg-red-50 text-red-700',
    refunded: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${
      isCompleted ? 'bg-green-50/40' : isCancelled ? 'bg-gray-50/60' : 'hover:bg-gray-50'
    }`}>
      {/* Token badge */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        isCompleted ? 'bg-green-100 text-green-700' :
        isCancelled ? 'bg-gray-100 text-gray-500' :
        'bg-blue-100 text-blue-700'
      }`}>
        {token}
      </div>

      {/* Patient info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{patientName}</p>
        <p className="text-xs text-gray-500">{appointment.user?.mobile}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[appointment.status] || 'bg-gray-100 text-gray-700'}`}>
            {appointment.status}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${paymentBadge[appointment.payment_status] || 'bg-gray-50 text-gray-600'}`}>
            {appointment.payment_status}
          </span>
          {appointment.family_member_id && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">family</span>
          )}
        </div>
        {appointment.notes && (
          <p className="text-xs text-gray-500 mt-1 italic truncate">"{appointment.notes}"</p>
        )}
      </div>

      {/* Actions */}
      {canAct && (
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={onComplete}
            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            ✓ Done
          </button>
          <button
            onClick={onReject}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            ✕ Reject
          </button>
        </div>
      )}

      {isCompleted && (
        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full flex-shrink-0">
          ✓ Done
        </span>
      )}
    </div>
  );
});

// ─── Main component ───
export const AppointmentQueue = ({ slotId }: AppointmentQueueProps) => {
  const queryClient = useQueryClient();

  // Which appointment is pending an action
  const [pendingAction, setPendingAction] = useState<{
    appointment: Appointment;
    type: 'complete' | 'reject';
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['slot-appointments', slotId],
    queryFn: () => appointmentService.getAllAppointments({ slot_id: slotId }),
    refetchInterval: 15000,
    staleTime: 5000,
  });

  const appointments = data?.data || [];

  const sorted = [...appointments].sort((a, b) => {
    const ta = parseInt(a.token_number.split('-').pop() || '0');
    const tb = parseInt(b.token_number.split('-').pop() || '0');
    return ta - tb;
  });

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStatusData }) =>
      appointmentService.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-appointments', slotId] });
      queryClient.invalidateQueries({ queryKey: ['staff-appointments'] });
      setPendingAction(null);
    },
  });

  const handleComplete = useCallback((appointment: Appointment) => {
    setPendingAction({ appointment, type: 'complete' });
  }, []);

  const handleReject = useCallback((appointment: Appointment) => {
    setPendingAction({ appointment, type: 'reject' });
  }, []);

  const confirmComplete = useCallback(() => {
    if (!pendingAction) return;
    mutation.mutate({ id: pendingAction.appointment.id, data: { action: 'complete' } });
  }, [pendingAction, mutation]);

  const confirmReject = useCallback((reason: string) => {
    if (!pendingAction) return;
    mutation.mutate({ id: pendingAction.appointment.id, data: { action: 'reject', reason: reason || undefined } });
  }, [pendingAction, mutation]);

  const cancelAction = useCallback(() => {
    setPendingAction(null);
    mutation.reset();
  }, [mutation]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
        Failed to load queue. Please refresh.
      </div>
    );
  }

  const slotDetails = appointments[0]?.slot;
  const total     = appointments.length;
  const pending   = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  return (
    <>
      {/* Slot info bar */}
      {slotDetails && (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Slot Information</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Doctor</p>
              <p className="font-medium text-gray-900">{slotDetails.doctor?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{slotDetails.date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Time</p>
              <p className="font-medium text-gray-900">
                {slotDetails.start_time ? formatTime(slotDetails.start_time) : '—'} – {slotDetails.end_time ? formatTime(slotDetails.end_time) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Capacity</p>
              <p className="font-medium text-gray-900">{slotDetails.booked_count}/{slotDetails.max_capacity}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total',     value: total,     color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Pending',   value: pending,   color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', value: completed, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Queue list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Appointment Queue</h2>
          <span className="text-xs text-gray-400">Auto-refreshes every 15s</span>
        </div>

        {sorted.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No appointments in this slot</div>
        ) : (
          <div>
            {sorted.map(apt => (
              <QueueItem
                key={apt.id}
                appointment={apt}
                onComplete={() => handleComplete(apt)}
                onReject={() => handleReject(apt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals — rendered outside the list so they don't cause list re-renders */}
      {pendingAction?.type === 'complete' && (
        <CompleteModal
          appointment={pendingAction.appointment}
          onConfirm={confirmComplete}
          onCancel={cancelAction}
          isLoading={mutation.isPending}
          error={mutation.isError}
        />
      )}

      {pendingAction?.type === 'reject' && (
        <RejectModal
          appointment={pendingAction.appointment}
          onConfirm={confirmReject}
          onCancel={cancelAction}
          isLoading={mutation.isPending}
          error={mutation.isError}
        />
      )}
    </>
  );
};
