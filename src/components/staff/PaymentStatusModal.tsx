import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { paymentService } from '../../services/payments';

interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: number;
    token_number: string;
    patient_name: string;
    payment_status: string;
    payment?: {
      amount: number | string;
      payment_method: string;
    };
  };
  onSuccess: () => void;
}

export const PaymentStatusModal = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: PaymentStatusModalProps) => {
  // ALL hooks declared first — before any early return
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'manual'>('cash');
  const [customAmount, setCustomAmount] = useState('');
  const [cashReceived, setCashReceived] = useState(false);
  const [done, setDone] = useState(false);

  const handleClose = () => {
    setCashReceived(false);
    setCustomAmount('');
    setPaymentMethod('cash');
    setDone(false);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: (data: { payment_method: 'cash' | 'manual'; amount?: number }) =>
      paymentService.recordManualPayment(appointment.id, data),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    },
  });

  // Early return AFTER all hooks
  if (!isOpen) return null;

  const defaultAmount = appointment.payment?.amount
    ? Number(appointment.payment.amount).toFixed(2)
    : '—';

  const displayAmount = customAmount.trim()
    ? Number(customAmount).toFixed(2)
    : defaultAmount;

  const isPaid = appointment.payment_status === 'paid';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaid || !cashReceived) return;
    const amountVal = customAmount.trim() ? Number(customAmount) : undefined;
    if (amountVal !== undefined && (isNaN(amountVal) || amountVal <= 0)) return;
    mutation.mutate({ payment_method: paymentMethod, amount: amountVal });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xs p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Record Payment</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{appointment.patient_name}</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success state */}
        {done ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800">Payment recorded!</p>
          </div>
        ) : isPaid ? (
          /* Already paid view */
          <div className="space-y-2">
            <div className="bg-green-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-600">Token</span>
              <span className="text-xs font-mono font-semibold text-gray-800">{appointment.token_number}</span>
            </div>
            <div className="bg-green-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-600">Amount</span>
              <span className="text-xs font-semibold text-gray-800">₹{defaultAmount}</span>
            </div>
            <div className="bg-green-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-600">Method</span>
              <span className="text-xs font-semibold text-green-700 capitalize">
                {appointment.payment?.payment_method || '—'}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-semibold text-green-700">Paid</span>
            </div>
            <button
              onClick={handleClose}
              className="w-full mt-2 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* Payment form */
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Token + amount summary */}
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">{appointment.token_number}</span>
              <span className="text-sm font-bold text-gray-900">₹{defaultAmount}</span>
            </div>

            {/* Method toggle */}
            <div className="grid grid-cols-2 gap-1.5">
              {(['cash', 'manual'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    paymentMethod === m
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m === 'cash' ? '💵 Cash' : '📱 UPI/Card'}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <input
              type="number"
              step="0.01"
              min="0"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={`Custom amount (default ₹${defaultAmount})`}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            {/* Confirmation checkbox */}
            <label
              className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                cashReceived ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50'
              }`}
            >
              <input
                type="checkbox"
                checked={cashReceived}
                onChange={(e) => setCashReceived(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0"
              />
              <span className="text-xs text-gray-700 leading-snug">
                I confirm ₹{displayAmount} received via{' '}
                {paymentMethod === 'cash' ? 'cash' : 'UPI/card'}
              </span>
            </label>

            {mutation.isError && (
              <p className="text-xs text-red-600">Failed. Please try again.</p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!cashReceived || mutation.isPending}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  cashReceived && !mutation.isPending
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {mutation.isPending ? 'Saving...' : 'Record Payment'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={mutation.isPending}
                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
