import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import api from '../services/api';
import PaymentGateway from '../components/patient/PaymentGateway';
import Modal from '../components/common/Modal';

interface Payment {
  id: number;
  appointment_id: number;
  amount: number;
  payment_method: 'online' | 'cash' | 'manual';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transaction_id?: string;
  paid_at?: string;
  refunded_at?: string;
  created_at: string;
  appointment: {
    id: number;
    token_number: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    doctor: {
      name: string;
      specialization: string;
    };
    slot: {
      date: string;
      start_time: string;
    };
    family_member?: {
      name: string;
      relationship: string;
    };
  };
}

export const PaymentHistory = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [payingAppointmentId, setPayingAppointmentId] = useState<number | null>(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/payments/history');
      setPayments(response.data.data.payments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '₹0.00';
    }
    return `₹${numAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string): string => {
    return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getAppointmentStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'online':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'cash':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const handleDownloadInvoice = async (appointmentId: number) => {
    try {
      const response = await api.get(`/payments/${appointmentId}/invoice`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${appointmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (selectedStatus !== 'all' && payment.status !== selectedStatus) {
      return false;
    }
    if (selectedMethod !== 'all' && payment.payment_method !== selectedMethod) {
      return false;
    }
    return true;
  });

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Page Header */}
        <div className="mb-6 sm:mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-gold-500/10 rounded-3xl blur-3xl"></div>
          <div className="relative flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                Payment History
              </h1>
              <p className="text-sage-600 mt-1 text-sm sm:text-base lg:text-lg">
                View all your payment transactions and invoices
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-sage-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-charcoal-600 mb-2 sm:mb-3 flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Filter by Status</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white border-2 border-sage-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:border-primary-300"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-charcoal-600 mb-2 sm:mb-3 flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Filter by Method</span>
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white border-2 border-sage-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:border-primary-300"
              >
                <option value="all">All Methods</option>
                <option value="online">Online</option>
                <option value="cash">Cash</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl mb-4 sm:mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-8 sm:p-12 border border-sage-200">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-sage-600 text-sm sm:text-base">Loading payment history...</p>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-8 sm:p-12 border border-sage-200">
            <div className="text-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-sage-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-base sm:text-lg font-semibold text-charcoal-600 mb-2">No Payment History Found</h3>
              <p className="text-sage-600 text-sm sm:text-base">
                Your payment transactions will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 border border-sage-200 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                    {/* Payment Method Icon */}
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary-50 rounded-lg sm:rounded-xl flex items-center justify-center text-primary-500">
                      {getPaymentMethodIcon(payment.payment_method)}
                    </div>

                    {/* Payment Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-primary-500">
                          {formatCurrency(payment.amount)}
                        </h3>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                          <span className="text-xs text-gray-600 font-semibold">Payment:</span>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg">
                          <span className="text-xs text-blue-700 font-semibold">Appointment:</span>
                          {getAppointmentStatusBadge(payment.appointment.status)}
                        </div>
                        {payment.appointment.family_member && (
                          <span className="px-2 py-1 bg-gold-100 text-gold-800 text-xs font-medium rounded-lg">
                            {payment.appointment.family_member.name}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-sage-600 mb-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate">Dr. {payment.appointment.doctor.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">
                            {formatDate(payment.appointment.slot.date)} at {formatTime(payment.appointment.slot.start_time)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="truncate">Token: {payment.appointment.token_number}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="capitalize">{payment.payment_method}</span>
                        </div>
                      </div>

                      {payment.transaction_id && (
                        <div className="text-xs text-sage-500 truncate">
                          Transaction ID: {payment.transaction_id}
                        </div>
                      )}

                      <div className="mt-2 text-xs text-sage-500">
                        {payment.paid_at ? `Paid on ${formatDate(payment.paid_at)}` : `Created on ${formatDate(payment.created_at)}`}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {payment.status === 'pending' && 
                     payment.payment_method === 'online' && 
                     payment.appointment.status !== 'cancelled' && 
                     payment.appointment.status !== 'rejected' && (
                      <button
                        onClick={() => setPayingAppointmentId(payment.appointment_id)}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center justify-center space-x-2 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>Pay Now</span>
                      </button>
                    )}
                    {payment.status === 'paid' && (
                      <button
                        onClick={() => handleDownloadInvoice(payment.appointment_id)}
                        className="flex-shrink-0 w-full sm:w-auto px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 text-sm"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pay Now Modal */}
      {payingAppointmentId && (
        <Modal
          isOpen={true}
          onClose={() => setPayingAppointmentId(null)}
          title="Complete Payment"
          size="md"
        >
          <PaymentGateway
            appointmentId={payingAppointmentId}
            onComplete={() => {
              setPayingAppointmentId(null);
              fetchPaymentHistory();
            }}
          />
        </Modal>
      )}
    </Layout>
  );
};
