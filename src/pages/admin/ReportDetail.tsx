import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { reportService } from '../../services/reports';
import api from '../../services/api';
import { todayLocalDate } from '../../utils/formatters';

interface ReportData {
  date: string;
  clinic_name: string;
  summary: {
    total_appointments: number;
    completed: number;
    cancelled: number;
    pending: number;
    total_revenue: number;
    pending_amount: number;
    total_billed: number;
    cash_revenue: number;
    online_revenue: number;
    manual_revenue: number;
    cash_count: number;
    online_count: number;
    manual_count: number;
  };
  doctor_stats: Array<{
    name: string;
    specialization: string;
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    revenue: number;
    pending_amount: number;
  }>;
  transactions: Array<{
    token_number: string;
    date: string | null;
    time: string;
    patient_name: string;
    doctor_name: string;
    status: string;
    payment_status: string;
    amount: number;
    payment_method: string;
  }>;
}

const ReportDetail: React.FC = () => {
  const { reportType } = useParams<{ reportType: string }>();
  const navigate = useNavigate();
  
  const currentDate = new Date();
  const isDailyReport = reportType === 'daily-appointments';
  const isDoctorWise = reportType === 'doctor-wise';
  const isPatientVisit = reportType === 'patient-visit';
  const isPendingPayments = reportType === 'pending-payments';
  const isFeedback = reportType === 'feedback';

  // For daily reports: use a date picker; for others: use month/year
  const [selectedDate, setSelectedDate] = useState<string>(todayLocalDate());
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (currentDate.getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<string>(currentDate.getFullYear().toString());
  
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [doctors, setDoctors] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [patientVisitData, setPatientVisitData] = useState<any | null>(null);
  const [pendingPaymentsData, setPendingPaymentsData] = useState<any | null>(null);
  const [feedbackData, setFeedbackData] = useState<any | null>(null);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily-appointments':
        return 'Daily Appointments Report';
      case 'monthly-revenue':
        return 'Monthly Revenue Report';
      case 'doctor-wise':
        return 'Doctor-wise Report';
      case 'patient-visit':
        return 'Patient Visit Report';
      case 'pending-payments':
        return 'Pending Payments Report';
      case 'appointment-status':
        return 'Appointment Status Report';
      case 'no-show':
        return 'No-show Report';
      case 'feedback':
        return 'Feedback Report';
      default:
        return 'Report';
    }
  };

  const handleGenerateReport = async () => {
    const date = isDailyReport ? selectedDate : `${selectedYear}-${selectedMonth}-01`;
    const doctorId = selectedDoctor ? parseInt(selectedDoctor) : undefined;
    const monthly = !isDailyReport;
    setLoadingReport(true);
    setError(null);
    
    try {
      if (isPatientVisit) {
        const data = await reportService.getPatientVisitReport(date, doctorId);
        setPatientVisitData(data);
        setReportData(null);
        setPendingPaymentsData(null);
        setFeedbackData(null);
      } else if (isPendingPayments) {
        const data = await reportService.getPendingPaymentsReport(date, doctorId);
        setPendingPaymentsData(data);
        setPatientVisitData(null);
        setReportData(null);
        setFeedbackData(null);
      } else if (isFeedback) {
        const data = await reportService.getFeedbackReport(date, doctorId);
        setFeedbackData(data);
        setReportData(null);
        setPatientVisitData(null);
        setPendingPaymentsData(null);
      } else {
        const data = await reportService.getDailyReport(date, doctorId, monthly);
        setReportData(data);
        setPatientVisitData(null);
        setPendingPaymentsData(null);
        setFeedbackData(null);
      }
    } catch (err: any) {
      console.error('Report generation error:', err);
      if (err.response?.status === 401) {
        setError('You must be logged in to view reports. Please log in and try again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view reports.');
      } else {
        setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to generate report. Please try again.');
      }
    } finally {
      setLoadingReport(false);
    }
  };

  const handleExportCSV = async () => {
    const date = isDailyReport ? selectedDate : `${selectedYear}-${selectedMonth}-01`;
    const doctorId = selectedDoctor ? parseInt(selectedDoctor) : undefined;
    const monthly = !isDailyReport;
    try {
      setLoadingExport(true);

      if (isPatientVisit && patientVisitData) {
        const rows: string[] = ['Patient Name,Mobile,Email,Total Visits,Completed,Pending,Cancelled,Total Paid,Pending Dues'];
        patientVisitData.patients.forEach((p: any) => {
          rows.push([`"${p.patient_name}"`, p.mobile || '', p.email || '', p.total_visits, p.completed_visits, p.pending_visits, p.cancelled_visits, p.total_paid.toFixed(2), p.total_pending.toFixed(2)].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `patient_visit_report_${selectedYear}_${selectedMonth}.csv`);
        document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
      } else if (isPendingPayments && pendingPaymentsData) {
        const rows: string[] = ['Token,Patient Name,Mobile,Doctor,Specialization,Date,Time,Appointment Status,Amount Due'];
        pendingPaymentsData.pending_list.forEach((p: any) => {
          const dateStr = p.date ? new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const timeStr = p.time ? (() => { const [h, m] = p.time.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; })() : '';
          rows.push([p.token_number, `"${p.patient_name}"`, p.patient_mobile || '', `"Dr. ${p.doctor_name}"`, p.specialization, dateStr, timeStr, p.appointment_status, p.amount_due.toFixed(2)].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `pending_payments_report_${selectedYear}_${selectedMonth}.csv`);
        document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
      } else if (isFeedback && feedbackData) {
        const rows: string[] = ['Patient Name,Mobile,Doctor,Specialization,Rating,Comments,Token,Submitted At'];
        feedbackData.feedback_list.forEach((f: any) => {
          rows.push([
            `"${f.patient_name}"`,
            f.patient_mobile || '',
            `"${f.doctor_name}"`,
            f.specialization || '',
            f.rating,
            f.comments ? `"${f.comments.replace(/"/g, '""')}"` : '',
            f.token_number || '',
            f.submitted_at || '',
          ].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `feedback_report_${selectedYear}_${selectedMonth}.csv`);
        document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
      } else {
        const blob = await reportService.downloadExcel(date, doctorId, monthly);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${reportType}_report_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV');
    } finally {
      setLoadingExport(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Load doctors and report on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/reports/doctors');
        const data = response.data;
        if (data.success && data.data) {
          setDoctors(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
      }
    };
    
    fetchDoctors();
    handleGenerateReport();
  }, []);

  // Auto-regenerate when filters change (skip on first mount since useEffect above handles it)
  const isFirstMount = React.useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    handleGenerateReport();
  }, [selectedDate, selectedMonth, selectedYear, selectedDoctor]);

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Breadcrumb + Header */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">REPORTS · OPERATIONS</p>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <button onClick={() => navigate('/admin/reports')} className="mt-1 p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{getReportTitle()}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {isDailyReport
                      ? `Detailed report for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : `Detailed report for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    }
                  </p>
                </div>
              </div>
              <button onClick={handleExportCSV} disabled={loadingExport || (!reportData && !patientVisitData && !pendingPaymentsData && !feedbackData)} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a4d3e] text-white text-sm font-semibold rounded-xl hover:bg-[#153d31] transition-colors shadow-sm disabled:opacity-50 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {loadingExport ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-end gap-4">
              {!isDoctorWise && (
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Doctor</label>
                  <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/30 focus:border-[#1a4d3e]">
                    <option value="">All Doctors</option>
                    {doctors.map((doctor) => (<option key={doctor.id} value={doctor.id}>{doctor.name}</option>))}
                  </select>
                </div>
              )}
              {isDailyReport ? (
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/30 focus:border-[#1a4d3e]"
                  />
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Month</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/30 focus:border-[#1a4d3e]">
                      {months.map((month) => (<option key={month.value} value={month.value}>{month.label}</option>))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Year</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/30 focus:border-[#1a4d3e]">
                      {years.map((year) => (<option key={year.value} value={year.value}>{year.label}</option>))}
                    </select>
                  </div>
                </>
              )}
              {isPatientVisit && (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Search Patient</label>
                  <div className="relative">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Name or mobile..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/30 focus:border-[#1a4d3e]"
                    />
                  </div>
                </div>
              )}
              <button onClick={handleGenerateReport} disabled={loadingReport} className="flex items-center gap-2 px-5 py-2 bg-[#1a4d3e] text-white text-sm font-semibold rounded-xl hover:bg-[#153d31] transition-colors shadow-sm disabled:opacity-50">
                {loadingReport ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Generating...</>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>Generate report</>)}
              </button>
            </div>
          </div>

          {error && (<div className="bg-red-50 border border-red-200 rounded-2xl p-4"><p className="text-red-700 text-sm">{error}</p></div>)}
          {loadingReport && !reportData && !patientVisitData && !pendingPaymentsData && !feedbackData && (<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a4d3e]"></div></div>)}

          {/* Patient Visit Report */}
          {patientVisitData && !loadingReport && (
            <div className="space-y-6 animate-fadeIn">
              {patientVisitData.summary.total_appointments === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <p className="text-gray-400 text-sm">No patient visits found for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Unique Patients', value: patientVisitData.summary.unique_patients, sub: 'Visited this month', color: 'text-[#1a4d3e] bg-[#1a4d3e]/10' },
                      { label: 'Total Visits', value: patientVisitData.summary.total_appointments, sub: `${patientVisitData.summary.completed} completed`, color: 'text-blue-600 bg-blue-50' },
                      { label: 'Revenue Collected', value: `₹${patientVisitData.summary.total_revenue.toFixed(2)}`, sub: 'Paid appointments', color: 'text-emerald-600 bg-emerald-50' },
                      { label: 'Pending Dues', value: `₹${patientVisitData.summary.pending_revenue.toFixed(2)}`, sub: `${patientVisitData.summary.pending} unpaid`, color: 'text-amber-600 bg-amber-50' },
                    ].map(({ label, value, sub }) => (
                      <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className="text-xl font-bold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Patient List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Patient Visit Details</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{patientVisitData.summary.unique_patients} patients · {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                      </div>
                      <div className="relative">
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search by name or mobile..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/30 focus:border-[#1a4d3e] w-56"
                        />
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {patientVisitData.patients
                        .filter((p: any) => {
                          if (!patientSearch) return true;
                          const q = patientSearch.toLowerCase();
                          return (
                            p.patient_name?.toLowerCase().includes(q) ||
                            p.mobile?.toLowerCase().includes(q) ||
                            p.email?.toLowerCase().includes(q)
                          );
                        })
                        .map((patient: any, idx: number) => (
                        <details key={idx} className="group">
                          <summary className="px-5 py-4 hover:bg-gray-50 cursor-pointer list-none transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-sm font-bold text-[#1a4d3e] flex-shrink-0">
                                  {patient.patient_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{patient.patient_name}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-400">
                                    {patient.mobile && <span>{patient.mobile}</span>}
                                    {patient.email && <span className="truncate">{patient.email}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="text-center hidden sm:block">
                                  <p className="text-sm font-bold text-gray-900">{patient.total_visits}</p>
                                  <p className="text-xs text-gray-400">Visits</p>
                                </div>
                                <div className="text-center hidden sm:block">
                                  <p className="text-sm font-bold text-green-700">{patient.completed_visits}</p>
                                  <p className="text-xs text-gray-400">Done</p>
                                </div>
                                <div className="text-center hidden sm:block">
                                  <p className="text-sm font-bold text-amber-600">{patient.pending_visits}</p>
                                  <p className="text-xs text-gray-400">Pending</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-900">₹{patient.total_paid.toFixed(2)}</p>
                                  {patient.total_pending > 0 && (
                                    <p className="text-xs text-amber-600">₹{patient.total_pending.toFixed(2)} due</p>
                                  )}
                                </div>
                                <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </summary>
                          {/* Visit details */}
                          <div className="px-5 pb-4 bg-gray-50">
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                              <table className="min-w-full text-xs">
                                <thead>
                                  <tr className="text-left text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-white">
                                    <th className="px-4 py-2">Token</th>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Time</th>
                                    <th className="px-4 py-2">Doctor</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Payment</th>
                                    <th className="px-4 py-2">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                  {patient.visits.map((visit: any, vi: number) => ( 
                                    <tr key={vi} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 font-mono font-semibold text-[#1a4d3e]">{visit.token_number}</td>
                                      <td className="px-4 py-2 text-gray-700">{visit.date ? new Date(visit.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                                      <td className="px-4 py-2 text-gray-600">{visit.time ? (() => { const [h, m] = visit.time.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; })() : '—'}</td>
                                      <td className="px-4 py-2 text-gray-700">{visit.doctor_name}</td>
                                      <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${visit.status === 'completed' ? 'bg-green-100 text-green-700' : visit.status === 'cancelled' ? 'bg-red-100 text-red-600' : visit.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          {visit.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${visit.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          {visit.payment_status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 font-semibold text-gray-900">{visit.amount > 0 ? `₹${visit.amount.toFixed(2)}` : '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pending Payments Report */}
          {pendingPaymentsData && !loadingReport && (
            <div className="space-y-6 animate-fadeIn">
              {pendingPaymentsData.summary.total_pending === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-semibold">No pending payments!</p>
                  <p className="text-gray-400 text-sm mt-1">All appointments for {months.find(m => m.value === selectedMonth)?.label} {selectedYear} are paid.</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <p className="text-xs text-gray-400 mb-1">Total Pending</p>
                      <p className="text-3xl font-bold text-amber-600">{pendingPaymentsData.summary.total_pending}</p>
                      <p className="text-xs text-gray-400 mt-1">Unpaid appointments</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <p className="text-xs text-gray-400 mb-1">Total Amount Due</p>
                      <p className="text-3xl font-bold text-red-600">₹{pendingPaymentsData.summary.total_amount_due.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1">Outstanding balance</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <p className="text-xs text-gray-400 mb-1">Doctors Affected</p>
                      <p className="text-3xl font-bold text-gray-900">{pendingPaymentsData.summary.by_doctor.length}</p>
                      <p className="text-xs text-gray-400 mt-1">With pending dues</p>
                    </div>
                  </div>

                  {/* By Doctor breakdown */}
                  {pendingPaymentsData.summary.by_doctor.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <h2 className="text-base font-bold text-gray-900 mb-4">Pending by Doctor</h2>
                      <div className="space-y-3">
                        {pendingPaymentsData.summary.by_doctor.map((d: any, i: number) => {
                          const pct = pendingPaymentsData.summary.total_amount_due > 0
                            ? ((d.amount / pendingPaymentsData.summary.total_amount_due) * 100).toFixed(0)
                            : '0';
                          return (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">{d.doctor_name.charAt(0)}</div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Dr. {d.doctor_name}</p>
                                  <p className="text-xs text-gray-400">{d.specialization} · {d.count} appointment{d.count > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-red-600">₹{d.amount.toFixed(2)}</p>
                                <p className="text-xs text-gray-400">{pct}% of total</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pending list table */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-base font-bold text-gray-900">Pending Payment Details</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{pendingPaymentsData.pending_list.length} appointments with outstanding dues</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                            <th className="px-5 py-3">Token</th>
                            <th className="px-5 py-3">Patient</th>
                            <th className="px-5 py-3">Mobile</th>
                            <th className="px-5 py-3">Doctor</th>
                            <th className="px-5 py-3">Date</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Amount Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {pendingPaymentsData.pending_list.map((p: any, i: number) => {
                            const dateStr = p.date ? new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
                            const timeStr = p.time ? (() => { const [h, m] = p.time.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; })() : '';
                            return (
                              <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#1a4d3e]">{p.token_number}</td>
                                <td className="px-5 py-3.5 font-medium text-gray-900">{p.patient_name}</td>
                                <td className="px-5 py-3.5 text-gray-500 text-xs">{p.patient_mobile || '—'}</td>
                                <td className="px-5 py-3.5 text-gray-600">Dr. {p.doctor_name}</td>
                                <td className="px-5 py-3.5 text-gray-600">{dateStr} {timeStr && <span className="text-gray-400 text-xs">{timeStr}</span>}</td>
                                <td className="px-5 py-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${p.appointment_status === 'confirmed' ? 'bg-blue-100 text-blue-700' : p.appointment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {p.appointment_status}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 font-bold text-red-600">₹{p.amount_due.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                          <tr>
                            <td colSpan={6} className="px-5 py-3 text-sm font-bold text-gray-700 text-right">Total Outstanding:</td>
                            <td className="px-5 py-3 font-bold text-red-600 text-base">₹{pendingPaymentsData.summary.total_amount_due.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Feedback Report */}
          {feedbackData && !loadingReport && (
            <div className="space-y-6 animate-fadeIn">
              {feedbackData.summary.total_reviews === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p className="text-gray-400 text-sm">No feedback found for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Average Rating — big card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold text-[#1a4d3e] mb-1">{feedbackData.summary.average_rating.toFixed(1)}</div>
                      <div className="flex items-center gap-0.5 mb-1">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className={`w-4 h-4 ${s <= Math.round(feedbackData.summary.average_rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">{feedbackData.summary.total_reviews} reviews</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{feedbackData.summary.positive_reviews}</p>
                      <p className="text-xs text-gray-400 mt-1">Positive (4–5 ★)</p>
                      <p className="text-xs text-emerald-500 mt-0.5">{feedbackData.summary.total_reviews > 0 ? ((feedbackData.summary.positive_reviews / feedbackData.summary.total_reviews) * 100).toFixed(0) : 0}%</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                      <p className="text-2xl font-bold text-amber-500">{feedbackData.summary.neutral_reviews}</p>
                      <p className="text-xs text-gray-400 mt-1">Neutral (3 ★)</p>
                      <p className="text-xs text-amber-400 mt-0.5">{feedbackData.summary.total_reviews > 0 ? ((feedbackData.summary.neutral_reviews / feedbackData.summary.total_reviews) * 100).toFixed(0) : 0}%</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                      <p className="text-2xl font-bold text-red-500">{feedbackData.summary.negative_reviews}</p>
                      <p className="text-xs text-gray-400 mt-1">Negative (1–2 ★)</p>
                      <p className="text-xs text-red-400 mt-0.5">{feedbackData.summary.total_reviews > 0 ? ((feedbackData.summary.negative_reviews / feedbackData.summary.total_reviews) * 100).toFixed(0) : 0}%</p>
                    </div>
                  </div>

                  {/* Rating Distribution Bar */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Rating distribution</h2>
                    <div className="space-y-2.5">
                      {[5,4,3,2,1].map(star => {
                        const d = feedbackData.summary.rating_distribution[star];
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-12 flex-shrink-0">
                              <span className="text-sm font-medium text-gray-700">{star}</span>
                              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${star >= 4 ? 'bg-emerald-400' : star === 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${d.percentage}%` }}
                              />
                            </div>
                            <div className="w-20 text-right flex-shrink-0">
                              <span className="text-sm font-semibold text-gray-700">{d.count}</span>
                              <span className="text-xs text-gray-400 ml-1">({d.percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Doctor-wise Ratings */}
                  {feedbackData.doctor_stats.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-bold text-gray-900">Doctor-wise ratings</h2>
                          <p className="text-xs text-gray-400 mt-0.5">Ranked by average rating</p>
                        </div>
                        <span className="text-xs text-gray-400">{feedbackData.doctor_stats.length} doctors</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {feedbackData.doctor_stats.map((doc: any, idx: number) => {
                          const maxReviews = Math.max(...feedbackData.doctor_stats.map((d: any) => d.total_reviews), 1);
                          return (
                            <div key={idx} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-sm font-bold text-[#1a4d3e] flex-shrink-0">
                                  {doc.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
                                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{doc.specialization}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-0.5">
                                      {[1,2,3,4,5].map(s => (
                                        <svg key={s} className={`w-3 h-3 ${s <= Math.round(doc.average_rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{doc.average_rating.toFixed(1)}</span>
                                    <span className="text-xs text-gray-400">{doc.total_reviews} review{doc.total_reviews !== 1 ? 's' : ''}</span>
                                    <span className="text-xs text-emerald-600">{doc.positive_reviews} positive</span>
                                    {doc.negative_reviews > 0 && <span className="text-xs text-red-500">{doc.negative_reviews} negative</span>}
                                  </div>
                                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                                    <div
                                      className={`h-full rounded-full ${doc.average_rating >= 4 ? 'bg-emerald-400' : doc.average_rating >= 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                                      style={{ width: `${(doc.total_reviews / maxReviews) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className={`text-2xl font-bold ${doc.average_rating >= 4 ? 'text-emerald-600' : doc.average_rating >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
                                    {doc.average_rating.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-gray-400">/ 5.0</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Individual Feedback List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">All feedback</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{feedbackData.feedback_list.length} entries · {feedbackData.summary.with_comments} with comments</p>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {feedbackData.feedback_list.map((f: any, idx: number) => (
                        <div key={idx} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mt-0.5">
                              {f.patient_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900 text-sm">{f.patient_name}</p>
                                {f.patient_mobile && <span className="text-xs text-gray-400">{f.patient_mobile}</span>}
                                {f.token_number && <span className="text-xs font-mono text-[#1a4d3e] bg-[#1a4d3e]/5 px-1.5 py-0.5 rounded">{f.token_number}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <svg key={s} className={`w-3.5 h-3.5 ${s <= f.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">for <span className="font-medium text-gray-700">{f.doctor_name}</span></span>
                                {f.submitted_at && <span className="text-xs text-gray-400">{new Date(f.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                              </div>
                              {f.comments && (
                                <p className="mt-1.5 text-sm text-gray-600 italic">"{f.comments}"</p>
                              )}
                            </div>
                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${f.rating >= 4 ? 'bg-emerald-100 text-emerald-700' : f.rating === 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                              {f.rating}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {reportData && !loadingReport && (            <div className="space-y-6 animate-fadeIn">
              {reportData.summary.total_appointments === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <p className="text-gray-400 text-sm">No appointments found for {isDailyReport ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}</p>
                </div>
              ) : (
                <>
                  {/* Doctor-wise: Show doctor cards prominently */}
                  {isDoctorWise && reportData.doctor_stats && reportData.doctor_stats.length > 0 && (() => {
                    const maxRevenue = Math.max(...reportData.doctor_stats.map(d => d.revenue), 1);
                    const sortedDoctors = [...reportData.doctor_stats].sort((a, b) => b.revenue - a.revenue);
                    return (
                      <div className="space-y-6">
                        {/* Summary row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { label: 'Total Doctors', value: reportData.doctor_stats.length, sub: 'Active this period', color: 'text-[#1a4d3e] bg-[#1a4d3e]/10' },
                            { label: 'Total Appointments', value: reportData.summary.total_appointments, sub: 'Across all doctors', color: 'text-blue-600 bg-blue-50' },
                            { label: 'Revenue Collected', value: `₹${reportData.summary.total_revenue.toFixed(2)}`, sub: `${reportData.summary.cash_count + reportData.summary.online_count + reportData.summary.manual_count} paid`, color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Pending Dues', value: `₹${reportData.summary.pending_amount.toFixed(2)}`, sub: `${reportData.summary.pending} unpaid`, color: 'text-amber-600 bg-amber-50' },
                          ].map(({ label, value, sub }) => (
                            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                              <p className="text-xs text-gray-400 mb-1">{label}</p>
                              <p className="text-xl font-bold text-gray-900">{value}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                            </div>
                          ))}
                        </div>

                        {/* Doctor cards grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sortedDoctors.map((doctor, index) => {
                            const completionPct = doctor.total > 0 ? ((doctor.completed / doctor.total) * 100) : 0;
                            const revenuePct = maxRevenue > 0 ? ((doctor.revenue / maxRevenue) * 100) : 0;
                            const rank = index + 1;
                            const rankColors = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-700', 'bg-amber-600 text-amber-100'];
                            void revenuePct; // used in progress bar width
                            return (
                              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-[#1a4d3e]/10 flex items-center justify-center text-lg font-bold text-[#1a4d3e]">
                                      {doctor.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900 text-sm">{doctor.name}</p>
                                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{doctor.specialization || 'General'}</span>
                                    </div>
                                  </div>
                                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rankColors[index] || 'bg-gray-100 text-gray-600'}`}>
                                    #{rank}
                                  </span>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                                    <p className="text-lg font-bold text-gray-900">{doctor.total}</p>
                                    <p className="text-xs text-gray-400">Total</p>
                                  </div>
                                  <div className="text-center p-2 bg-green-50 rounded-xl">
                                    <p className="text-lg font-bold text-green-700">{doctor.completed}</p>
                                    <p className="text-xs text-gray-400">Done</p>
                                  </div>
                                  <div className="text-center p-2 bg-amber-50 rounded-xl">
                                    <p className="text-lg font-bold text-amber-700">{doctor.total - doctor.completed}</p>
                                    <p className="text-xs text-gray-400">Pending</p>
                                  </div>
                                </div>

                                {/* Revenue */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-400">Collected</span>
                                    <span className="text-sm font-bold text-emerald-700">₹{doctor.revenue.toFixed(2)}</span>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#1a4d3e] rounded-full transition-all duration-500" style={{ width: `${revenuePct}%` }}></div>
                                  </div>
                                </div>

                                {/* Pending amount */}
                                {doctor.pending_amount > 0 && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-400">Pending dues</span>
                                      <span className="text-sm font-bold text-amber-600">₹{doctor.pending_amount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Completion rate */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-400">Completion rate</span>
                                    <span className="text-xs font-semibold text-gray-700">{completionPct.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${completionPct >= 70 ? 'bg-green-500' : completionPct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${completionPct}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Comparison table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                              <h2 className="text-base font-bold text-gray-900">Performance comparison</h2>
                              <p className="text-xs text-gray-400 mt-0.5">Ranked by revenue for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                            </div>
                            <span className="text-xs text-gray-400">{reportData.doctor_stats.length} doctors</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                  <th className="px-5 py-3">Rank</th>
                                  <th className="px-5 py-3">Doctor</th>
                                  <th className="px-5 py-3">Specialization</th>
                                  <th className="px-5 py-3">Appointments</th>
                                  <th className="px-5 py-3">Completed</th>
                                  <th className="px-5 py-3">Completion %</th>
                                  <th className="px-5 py-3">Collected</th>
                                  <th className="px-5 py-3">Pending</th>
                                  <th className="px-5 py-3">Share</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {sortedDoctors.map((doctor, index) => {
                                  const pct = doctor.total > 0 ? ((doctor.completed / doctor.total) * 100).toFixed(0) : '0';
                                  const share = reportData.summary.total_revenue > 0 ? ((doctor.revenue / reportData.summary.total_revenue) * 100).toFixed(1) : '0';
                                  return (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-5 py-3.5">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>
                                          {index + 1}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs font-bold text-[#1a4d3e]">{doctor.name.charAt(0)}</div>
                                          <span className="font-medium text-gray-900">{doctor.name}</span>
                                        </div>
                                      </td>
                                      <td className="px-5 py-3.5"><span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{doctor.specialization || '—'}</span></td>
                                      <td className="px-5 py-3.5 font-medium text-gray-900">{doctor.total}</td>
                                      <td className="px-5 py-3.5 text-gray-600">{doctor.completed}</td>
                                      <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${Number(pct) >= 70 ? 'bg-green-500' : Number(pct) >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }}></div>
                                          </div>
                                          <span className="text-xs text-gray-500">{pct}%</span>
                                        </div>
                                      </td>
                                      <td className="px-5 py-3.5 font-semibold text-emerald-700">₹{doctor.revenue.toFixed(2)}</td>
                                      <td className="px-5 py-3.5 font-semibold text-amber-600">{doctor.pending_amount > 0 ? `₹${doctor.pending_amount.toFixed(2)}` : '—'}</td>
                                      <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${share}%` }}></div>
                                          </div>
                                          <span className="text-xs text-gray-500">{share}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Non-doctor-wise: Stats */}
                  {!isDoctorWise && <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {[
                      { label: 'Total Appointments', value: reportData.summary.total_appointments, sub: `Across ${reportData.doctor_stats?.length || 0} doctors`, color: 'text-[#1a4d3e] bg-[#1a4d3e]/10', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                      { label: 'Revenue Collected', value: `₹${reportData.summary.total_revenue.toFixed(2)}`, sub: `${reportData.summary.cash_count + reportData.summary.online_count + reportData.summary.manual_count} paid`, color: 'text-emerald-600 bg-emerald-50', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { label: 'Pending Dues', value: `₹${reportData.summary.pending_amount.toFixed(2)}`, sub: `${reportData.summary.pending} unpaid`, color: 'text-amber-600 bg-amber-50', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { label: 'Completed', value: reportData.summary.completed, sub: `${reportData.summary.total_appointments > 0 ? ((reportData.summary.completed / reportData.summary.total_appointments) * 100).toFixed(0) : 0}% completion`, color: 'text-blue-600 bg-blue-50', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { label: 'Pending', value: reportData.summary.pending, sub: `${reportData.summary.total_appointments > 0 ? ((reportData.summary.pending / reportData.summary.total_appointments) * 100).toFixed(0) : 0}% of total`, color: 'text-orange-500 bg-orange-50', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { label: 'Cancelled', value: reportData.summary.cancelled, sub: `${reportData.summary.total_appointments > 0 ? ((reportData.summary.cancelled / reportData.summary.total_appointments) * 100).toFixed(0) : 0}% of total`, color: 'text-red-500 bg-red-50', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
                    ].map(({ label, value, sub, color, icon }) => (
                      <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                        </div>
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-xl font-bold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>}

                  {/* Revenue by Payment Method */}
                  {!isDoctorWise && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div><h2 className="text-base font-bold text-gray-900">Revenue by payment method</h2><p className="text-xs text-gray-400 mt-0.5">All transactions for the period</p></div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-700">₹{reportData.summary.total_revenue.toFixed(2)} collected</p>
                        {reportData.summary.pending_amount > 0 && (
                          <p className="text-xs text-amber-600">₹{reportData.summary.pending_amount.toFixed(2)} pending</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Cash payments', amount: reportData.summary.cash_revenue, count: reportData.summary.cash_count, color: 'text-green-600 bg-green-50', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                        { label: 'Online payments', amount: reportData.summary.online_revenue, count: reportData.summary.online_count, color: 'text-blue-600 bg-blue-50', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                        { label: 'Manual payments', amount: reportData.summary.manual_revenue, count: reportData.summary.manual_count, color: 'text-purple-600 bg-purple-50', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                      ].map(({ label, amount, count, color, icon }) => (
                        <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                            </div>
                            <div><p className="text-sm font-medium text-gray-900">{label}</p><p className="text-xs text-gray-400">{count} transactions</p></div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">₹{amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">{reportData.summary.total_revenue > 0 ? ((amount / reportData.summary.total_revenue) * 100).toFixed(0) : 0}%</p>
                          </div>
                        </div>
                      ))}
                      {/* Pending dues row */}
                      {reportData.summary.pending_amount > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-600 bg-amber-100">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div><p className="text-sm font-medium text-amber-800">Pending dues</p><p className="text-xs text-amber-600">Unpaid confirmed appointments</p></div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-amber-700">₹{reportData.summary.pending_amount.toFixed(2)}</p>
                            <p className="text-xs text-amber-500">outstanding</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>}

                  {/* Doctor-wise Performance (for non-doctor-wise reports) */}
                  {!isDoctorWise && reportData.doctor_stats && reportData.doctor_stats.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div><h2 className="text-base font-bold text-gray-900">Doctor-wise performance</h2><p className="text-xs text-gray-400 mt-0.5">Activity per practitioner for this period</p></div>
                        <span className="text-xs text-gray-400">↑ {reportData.doctor_stats.length} practitioners</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead><tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                            <th className="px-5 py-3">Doctor</th><th className="px-5 py-3">Specialization</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Completed</th><th className="px-5 py-3">Completion</th><th className="px-5 py-3">Collected</th><th className="px-5 py-3">Pending</th>
                          </tr></thead>
                          <tbody className="divide-y divide-gray-50">
                            {reportData.doctor_stats.map((doctor, index) => {
                              const pct = doctor.total > 0 ? ((doctor.completed / doctor.total) * 100).toFixed(0) : '0';
                              return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-5 py-3.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs font-bold text-[#1a4d3e]">{doctor.name.charAt(0)}</div><span className="font-medium text-gray-900">{doctor.name}</span></div></td>
                                  <td className="px-5 py-3.5"><span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{doctor.specialization || '—'}</span></td>
                                  <td className="px-5 py-3.5 font-medium text-gray-900">{doctor.total}</td>
                                  <td className="px-5 py-3.5 text-gray-600">{doctor.completed}</td>
                                  <td className="px-5 py-3.5"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#1a4d3e] rounded-full" style={{ width: `${pct}%` }}></div></div><span className="text-xs text-gray-500">{pct}%</span></div></td>
                                  <td className="px-5 py-3.5 font-semibold text-emerald-700">₹{doctor.revenue.toFixed(2)}</td>
                                  <td className="px-5 py-3.5 font-semibold text-amber-600">{doctor.pending_amount > 0 ? `₹${doctor.pending_amount.toFixed(2)}` : '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Transactions Table */}
                  {!isDoctorWise && reportData.transactions && reportData.transactions.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900">Appointments for {isDailyReport ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{reportData.transactions.length} of {reportData.summary.total_appointments} entries</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead><tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                            <th className="px-5 py-3">Token</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Patient</th><th className="px-5 py-3">Doctor</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Method</th>
                          </tr></thead>
                          <tbody className="divide-y divide-gray-50">
                            {reportData.transactions.map((txn, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#1a4d3e]">{txn.token_number}</td>
                                <td className="px-5 py-3.5 text-gray-600">{txn.time}</td>
                                <td className="px-5 py-3.5 font-medium text-gray-900">{txn.patient_name}</td>
                                <td className="px-5 py-3.5 text-gray-600">{txn.doctor_name}</td>
                                <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(txn.status)}`}>{txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}</span></td>
                                <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${txn.payment_status === 'paid' ? 'bg-green-100 text-green-700' : txn.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{txn.payment_status.charAt(0).toUpperCase() + txn.payment_status.slice(1)}</span></td>
                                <td className="px-5 py-3.5 font-semibold text-gray-900">₹{txn.amount.toFixed(2)}</td>
                                <td className="px-5 py-3.5 text-gray-500 capitalize">{txn.payment_method}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReportDetail;
