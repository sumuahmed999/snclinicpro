import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../../components/layout';
import { PaymentStatusModal } from '../../components/staff';
import { appointmentService } from '../../services/appointments';
import { reportService } from '../../services/reports';
import { formatTime } from '../../utils/formatters';

export const DailyReportsPage = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: appointmentsData, isLoading, refetch } = useQuery({
    queryKey: ['daily-reports', selectedDate],
    queryFn: () => appointmentService.getAllAppointments({ date: selectedDate }),
  });

  const appointments = appointmentsData?.data || [];

  const handleUpdatePayment = (appointment: any) => {
    setSelectedAppointment({
      id: appointment.id,
      token_number: appointment.token_number,
      patient_name: appointment.family_member?.name || appointment.user?.name || 'N/A',
      payment_status: appointment.payment_status,
      payment: appointment.payment,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => { refetch(); };

  const handlePrintReceipt = (apt: any) => {
    const patientName = apt.family_member?.name || apt.user?.name || 'N/A';
    const amount = apt.payment?.amount ? Number(apt.payment.amount).toFixed(2) : '0.00';
    const method = apt.payment?.payment_method
      ? apt.payment.payment_method.charAt(0).toUpperCase() + apt.payment.payment_method.slice(1)
      : '—';
    const slotDate = apt.slot?.date
      ? new Date(apt.slot.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';
    const slotTime = apt.slot?.start_time ? formatTime(apt.slot.start_time) : '—';
    const doctorName = apt.doctor?.name || 'N/A';
    const invoiceNo = `INV-${apt.id.toString().padStart(6, '0')}`;
    const printedAt = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${invoiceNo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;background:#fff;padding:40px}
    .page{max-width:680px;margin:0 auto}
    /* Header */
    .inv-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #1a4d3e}
    .brand{font-size:22px;font-weight:700;color:#1a4d3e;letter-spacing:-0.5px}
    .brand-sub{font-size:11px;color:#6b7280;margin-top:2px}
    .inv-meta{text-align:right}
    .inv-title{font-size:20px;font-weight:700;color:#1a4d3e;text-transform:uppercase;letter-spacing:2px}
    .inv-no{font-size:12px;color:#6b7280;margin-top:4px}
    .inv-date{font-size:12px;color:#6b7280;margin-top:2px}
    /* Bill to */
    .section{margin-top:28px}
    .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;margin-bottom:8px}
    .bill-to-name{font-size:15px;font-weight:700;color:#111}
    .bill-to-sub{font-size:12px;color:#6b7280;margin-top:2px}
    /* Details grid */
    .details-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px;padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb}
    .detail-item{}
    .detail-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:3px}
    .detail-value{font-size:13px;font-weight:600;color:#111}
    /* Line items table */
    .table-wrap{margin-top:28px}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#1a4d3e;color:#fff}
    thead th{padding:10px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px}
    thead th:last-child{text-align:right}
    tbody tr{border-bottom:1px solid #f3f4f6}
    tbody td{padding:12px 14px;font-size:13px;color:#374151}
    tbody td:last-child{text-align:right;font-weight:600}
    /* Totals */
    .totals{margin-top:0;display:flex;justify-content:flex-end}
    .totals-box{width:260px}
    .total-row{display:flex;justify-content:space-between;padding:8px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6}
    .total-row.grand{background:#1a4d3e;color:#fff;font-size:15px;font-weight:700;border-radius:0 0 6px 6px;border-bottom:none}
    /* Status stamp */
    .stamp-wrap{margin-top:28px;display:flex;align-items:center;gap:12px}
    .stamp{display:inline-block;border:2.5px solid #16a34a;color:#16a34a;font-size:14px;font-weight:700;letter-spacing:3px;padding:6px 18px;border-radius:4px;text-transform:uppercase;transform:rotate(-3deg)}
    .payment-note{font-size:12px;color:#6b7280;margin-left:4px}
    /* Footer */
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center}
    .footer-left{font-size:11px;color:#9ca3af}
    .footer-right{font-size:11px;color:#9ca3af;text-align:right}
    @media print{body{padding:20px}.page{max-width:100%}}
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="inv-header">
    <div>
      <div class="brand">ClinicPortal</div>
      <div class="brand-sub">Healthcare Excellence</div>
    </div>
    <div class="inv-meta">
      <div class="inv-title">Invoice</div>
      <div class="inv-no">${invoiceNo}</div>
      <div class="inv-date">Date: ${printedAt}</div>
    </div>
  </div>

  <!-- Bill To -->
  <div class="section">
    <div class="section-label">Bill To</div>
    <div class="bill-to-name">${patientName}</div>
    <div class="bill-to-sub">Token: ${apt.token_number}</div>
  </div>

  <!-- Appointment Details -->
  <div class="details-grid">
    <div class="detail-item">
      <div class="detail-label">Doctor</div>
      <div class="detail-value">${doctorName}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Specialization</div>
      <div class="detail-value">${apt.doctor?.specialization || 'General Medicine'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Appointment Date</div>
      <div class="detail-value">${slotDate}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Appointment Time</div>
      <div class="detail-value">${slotTime}</div>
    </div>
  </div>

  <!-- Line Items -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>Consultation Fee — ${doctorName}</td>
          <td>1</td>
          <td>₹${amount}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>₹${amount}</span></div>
      <div class="total-row"><span>Tax (0%)</span><span>₹0.00</span></div>
      <div class="total-row grand"><span>Total Paid</span><span>₹${amount}</span></div>
    </div>
  </div>

  <!-- Paid Stamp -->
  <div class="stamp-wrap">
    <div class="stamp">✓ Paid</div>
    <div class="payment-note">Payment received via ${method} on ${printedAt}</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">ClinicPortal · Healthcare Excellence<br/>This is a computer-generated invoice.</div>
    <div class="footer-right">Thank you for your visit!<br/>We look forward to serving you again.</div>
  </div>
</div>
<script>window.onload=function(){window.print()};</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=760,height=900');
    if (win) {
      win.document.write(receiptHtml);
      win.document.close();
    }
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const blob = await reportService.downloadExcel(selectedDate);
      if (!blob || blob.size === 0) throw new Error('Empty response from server');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily_report_${selectedDate}.csv`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
    } catch (error: any) {
      alert(`Failed to download: ${error?.message || 'Unknown error'}`);
    } finally { setIsDownloading(false); }
  };

  // Stats
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled' || a.status === 'rejected').length;
  const pendingAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
  const paidAppointments = appointments.filter(a => a.payment_status === 'paid');
  const totalRevenue = paidAppointments.reduce((s, a) => s + (Number(a.payment?.amount) || 0), 0);
  const cashRevenue = paidAppointments.filter(a => a.payment?.payment_method === 'cash').reduce((s, a) => s + (Number(a.payment?.amount) || 0), 0);
  const onlineRevenue = paidAppointments.filter(a => a.payment?.payment_method === 'online').reduce((s, a) => s + (Number(a.payment?.amount) || 0), 0);
  const manualRevenue = paidAppointments.filter(a => a.payment?.payment_method === 'manual').reduce((s, a) => s + (Number(a.payment?.amount) || 0), 0);

  // Doctor stats
  const doctorStats = appointments.reduce((acc, apt) => {
    const name = apt.doctor?.name || 'Unknown';
    const spec = apt.doctor?.specialization || '';
    if (!acc[name]) acc[name] = { total: 0, completed: 0, revenue: 0, specialization: spec };
    acc[name].total++;
    if (apt.status === 'completed') acc[name].completed++;
    if (apt.payment_status === 'paid') acc[name].revenue += Number(apt.payment?.amount) || 0;
    return acc;
  }, {} as Record<string, { total: number; completed: number; revenue: number; specialization: string }>);

  // Filtered appointments
  const filteredAppointments = appointments.filter(apt => {
    const name = (apt.family_member?.name || apt.user?.name || '').toLowerCase();
    const token = (apt.token_number || '').toLowerCase();
    const doctor = (apt.doctor?.name || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || name.includes(q) || token.includes(q) || doctor.includes(q);
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
      confirmed: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const paymentBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* Breadcrumb + Header */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">REPORTS · OPERATIONS</p>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Daily appointments report</h1>
                <p className="text-sm text-gray-500 mt-1">Detailed activity overview for {displayDate}.</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                  <span className="text-xs text-gray-400">Live data · refreshed just now</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh
                </button>
                <button onClick={handleDownloadExcel} disabled={isDownloading} className="flex items-center gap-1.5 px-3 py-2 bg-[#1a4d3e] text-white text-sm font-semibold rounded-xl hover:bg-[#153d31] transition-colors shadow-sm disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {isDownloading ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/30 focus:border-[#1a4d3e]"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a4d3e]"></div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Appointments', value: totalAppointments, sub: `Across ${Object.keys(doctorStats).length} doctors`, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-[#1a4d3e] bg-[#1a4d3e]/10' },
                  { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, sub: `${paidAppointments.length} paid invoices`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Completed', value: completedAppointments, sub: `${totalAppointments > 0 ? ((completedAppointments/totalAppointments)*100).toFixed(0) : 0}% completion`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-600 bg-blue-50' },
                  { label: 'Pending', value: pendingAppointments, sub: `${totalAppointments > 0 ? ((pendingAppointments/totalAppointments)*100).toFixed(0) : 0}% of total`, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-amber-600 bg-amber-50' },
                  { label: 'Cancelled', value: cancelledAppointments, sub: `${totalAppointments > 0 ? ((cancelledAppointments/totalAppointments)*100).toFixed(0) : 0}% of total`, icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-red-500 bg-red-50' },
                ].map(({ label, value, sub, icon, color }) => (
                  <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Revenue by Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Revenue by payment method</h2>
                    <p className="text-xs text-gray-400 mt-0.5">All transactions today</p>
                  </div>
                  <span className="text-sm font-bold text-gray-700">₹{totalRevenue.toFixed(2)} total</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Cash payments', amount: cashRevenue, count: paidAppointments.filter(a => a.payment?.payment_method === 'cash').length, icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', color: 'text-green-600 bg-green-50' },
                    { label: 'Online payments', amount: onlineRevenue, count: paidAppointments.filter(a => a.payment?.payment_method === 'online').length, icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'text-blue-600 bg-blue-50' },
                    { label: 'Manual payments', amount: manualRevenue, count: paidAppointments.filter(a => a.payment?.payment_method === 'manual').length, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'text-purple-600 bg-purple-50' },
                  ].map(({ label, amount, count, icon, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-400">{count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{totalRevenue > 0 ? ((amount/totalRevenue)*100).toFixed(0) : 0}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor-wise Performance */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Doctor-wise performance</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Activity per practitioner for this period</p>
                  </div>
                  <span className="text-xs text-gray-400">↑ {Object.keys(doctorStats).length} practitioners</span>
                </div>
                {Object.keys(doctorStats).length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">No data for this date</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                          <th className="px-5 py-3">Doctor</th>
                          <th className="px-5 py-3">Specialization</th>
                          <th className="px-5 py-3">Total</th>
                          <th className="px-5 py-3">Completed</th>
                          <th className="px-5 py-3">Completion</th>
                          <th className="px-5 py-3">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {Object.entries(doctorStats).map(([name, stats]) => {
                          const pct = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : '0';
                          return (
                            <tr key={name} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs font-bold text-[#1a4d3e]">
                                    {name.charAt(0)}
                                  </div>
                                  <span className="font-medium text-gray-900">{name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{stats.specialization || '—'}</span>
                              </td>
                              <td className="px-5 py-3.5 font-medium text-gray-900">{stats.total}</td>
                              <td className="px-5 py-3.5 text-gray-600">{stats.completed}</td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#1a4d3e] rounded-full" style={{ width: `${pct}%` }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500">{pct}%</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-gray-900">₹{stats.revenue.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Appointments Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Appointments for {displayDate}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{filteredAppointments.length} of {appointments.length} entries</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search token, patient, doctor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/30 focus:border-[#1a4d3e] w-56"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/30 focus:border-[#1a4d3e]"
                    >
                      <option value="all">All statuses</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                {filteredAppointments.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">No appointments found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                          <th className="px-5 py-3">Token</th>
                          <th className="px-5 py-3">Time</th>
                          <th className="px-5 py-3">Patient</th>
                          <th className="px-5 py-3">Doctor</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Payment</th>
                          <th className="px-5 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredAppointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-700">{apt.token_number}</td>
                            <td className="px-5 py-3.5 text-gray-600">{apt.slot?.start_time ? formatTime(apt.slot.start_time) : '—'}</td>
                            <td className="px-5 py-3.5 font-medium text-gray-900">{apt.family_member?.name || apt.user?.name || 'N/A'}</td>
                            <td className="px-5 py-3.5 text-gray-600">{apt.doctor?.name || 'N/A'}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(apt.status)}`}>{apt.status}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${paymentBadge(apt.payment_status)}`}>{apt.payment_status}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdatePayment(apt)}
                                  className="text-xs font-semibold text-[#1a4d3e] hover:underline"
                                >
                                  {apt.payment_status === 'paid' ? 'View' : 'Update'}
                                </button>
                                {apt.payment_status === 'paid' && (
                                  <button
                                    onClick={() => handlePrintReceipt(apt)}
                                    title="Print receipt"
                                    className="p-1 text-gray-400 hover:text-[#1a4d3e] hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {selectedAppointment && (
        <PaymentStatusModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          appointment={selectedAppointment}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Layout>
  );
};