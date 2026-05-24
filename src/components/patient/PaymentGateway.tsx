import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { paymentService } from '../../services/payments';
import Button from '../common/Button';
import Loader from '../common/Loader';
import SuccessAnimation from '../common/SuccessAnimation';

interface PaymentGatewayProps {
  appointmentId: number;
  onComplete: () => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  appointmentId,
  onComplete,
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'skipped' | 'failed' | 'gateway_down'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState<{ amount: number; order_id: string } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  const initiatePayment = useMutation({
    mutationFn: () => paymentService.initiatePayment(appointmentId),
  });

  const verifyPayment = useMutation({
    mutationFn: (data: any) => paymentService.verifyPayment(appointmentId, data),
  });

  // Load payment info on mount
  useEffect(() => {
    let cancelled = false;
    paymentService.initiatePayment(appointmentId)
      .then(response => {
        if (!cancelled) {
          const amt = parseFloat(String(response.data.amount));
          setPaymentInfo({ amount: isNaN(amt) ? 0 : amt, order_id: response.data.order_id });
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          const code = err?.response?.data?.error?.code;
          const fallbackAllowed = err?.response?.data?.error?.fallback_allowed;
          if (code === 'PAYMENT_GATEWAY_UNAVAILABLE' || fallbackAllowed) {
            setPaymentStatus('gateway_down');
          }
          // Otherwise leave as 'pending' — user can retry on Pay click
        }
      });
    return () => { cancelled = true; };
  }, [appointmentId]);

  const handlePayment = async () => {
    try {
      setPaymentStatus('processing');

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify with backend using simulated data
      const result = await verifyPayment.mutateAsync({
        razorpay_order_id: paymentInfo?.order_id || `order_${appointmentId}`,
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_signature: `sig_sim_${Date.now()}`,
      });

      // Handle already_paid idempotency response
      if ((result as any)?.data?.already_paid || (result as any)?.already_paid) {
        setPaymentStatus('success');
        setTimeout(() => onComplete(), 2000);
        return;
      }

      setPaymentStatus('success');
      setTimeout(() => onComplete(), 2000);
    } catch (error: any) {
      const code = error?.response?.data?.error?.code;
      const fallbackAllowed = error?.response?.data?.error?.fallback_allowed;

      if (code === 'PAYMENT_GATEWAY_UNAVAILABLE' || fallbackAllowed) {
        setPaymentStatus('gateway_down');
      } else {
        setPaymentStatus('failed');
        setErrorMessage(error?.response?.data?.message || error?.response?.data?.error?.message || 'Payment failed. Please try again.');
      }
    }
  };

  const handleSkipPayment = () => {
    setPaymentStatus('skipped');
  };

  if (paymentStatus === 'processing') {
    return (
      <div className="text-center py-12">
        <Loader />
        <p className="text-gray-600 mt-4">Processing payment...</p>
        <p className="text-sm text-gray-500 mt-2">
          Please do not close this window or press the back button
        </p>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <SuccessAnimation
        title="Payment Successful!"
        message="Your appointment has been confirmed and payment received."
        onComplete={onComplete}
        autoRedirectSeconds={3}
      />
    );
  }

  if (paymentStatus === 'skipped') {
    return (
      <SuccessAnimation
        title="Appointment Confirmed!"
        message="Your appointment has been successfully booked. You can complete payment later."
        onComplete={onComplete}
        autoRedirectSeconds={3}
      />
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h3>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleSkipPayment}>
            Complete Later
          </Button>
          <Button onClick={() => setPaymentStatus('pending')}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Gateway is down — appointment is already booked, offer pay-at-clinic fallback
  if (paymentStatus === 'gateway_down') {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Online Payment Unavailable</h3>
        <p className="text-gray-600 mb-2">
          Our payment gateway is temporarily unavailable.
        </p>
        <p className="text-gray-600 mb-6">
          <strong>Your appointment is confirmed.</strong> You can pay at the clinic when you arrive.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-amber-800 font-medium mb-1">What to do next:</p>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>Your slot is reserved — no action needed</li>
            <li>Bring cash or card to the clinic</li>
            <li>Staff will record your payment on arrival</li>
          </ul>
        </div>
        <Button onClick={handleSkipPayment} variant="primary">
          Continue to Confirmation
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h2>

      {paymentInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Amount to Pay</p>
              <p className="text-2xl font-bold text-gray-900">₹{paymentInfo.amount.toFixed(2)}</p>            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Order ID</p>
              <p className="text-xs font-mono text-gray-700">{paymentInfo.order_id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
        <div className="grid grid-cols-3 gap-3">
          {(['upi', 'card', 'netbanking'] as const).map((method) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                selectedMethod === method
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="text-lg mb-1">
                {method === 'upi' ? '📱' : method === 'card' ? '💳' : '🏦'}
              </div>
              <div className="text-xs font-medium uppercase">{method === 'netbanking' ? 'Net Banking' : method.toUpperCase()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pay Button */}
      <div className="space-y-3">
        <button
          onClick={handlePayment}
          disabled={verifyPayment.isPending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Pay Now {paymentInfo ? `₹${Number(paymentInfo.amount).toFixed(2)}` : ''}
        </button>

        <button
          onClick={handleSkipPayment}
          className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-600 font-medium rounded-lg transition-all"
        >
          Pay Later at Clinic
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        🔒 Secured payment simulation for demo purposes
      </p>

      {initiatePayment.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-red-800">
            {(initiatePayment.error as any)?.response?.data?.message || 'Failed to initiate payment. Please try again.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentGateway;
