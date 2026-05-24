import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { appointmentService } from '../services/appointments';
import { doctorService } from '../services/doctors';
import { formatTime } from '../utils/formatters';
import type { Appointment } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  // Fetch appointments (only last 30 days for performance)
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: () => appointmentService.getAllAppointments({ per_page: 100 }),
  });

  // Fetch doctors
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorService.getDoctors({ all: true }),
  });

  const appointments = appointmentsData?.data || [];
  const doctors = doctorsData?.data || [];

  // Calculate current period statistics (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentPeriodAppointments = appointments.filter(apt => 
    new Date(apt.created_at) >= thirtyDaysAgo
  );
  const previousPeriodAppointments = appointments.filter(apt => 
    new Date(apt.created_at) >= sixtyDaysAgo && new Date(apt.created_at) < thirtyDaysAgo
  );

  // Calculate statistics
  const totalAppointments = currentPeriodAppointments.length;
  const previousTotalAppointments = previousPeriodAppointments.length;
  const appointmentsDelta = previousTotalAppointments > 0 
    ? ((totalAppointments - previousTotalAppointments) / previousTotalAppointments) * 100 
    : 0;

  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed').length;
  const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
  
  const totalRevenue = currentPeriodAppointments
    .filter(apt => apt.payment_status === 'paid')
    .reduce((sum, apt) => {
      const amount = Number(apt.payment?.amount) || 0;
      return sum + amount;
    }, 0);

  const previousRevenue = previousPeriodAppointments
    .filter(apt => apt.payment_status === 'paid')
    .reduce((sum, apt) => {
      const amount = Number(apt.payment?.amount) || 0;
      return sum + amount;
    }, 0);

  const revenueDelta = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  const pendingPaymentsAmount = currentPeriodAppointments
    .filter(apt => apt.payment_status === 'pending' && !['cancelled', 'rejected'].includes(apt.status))
    .reduce((sum, apt) => sum + (Number(apt.payment?.amount) || 0), 0);

  const activeDoctors = doctors.filter((doc: any) => doc.is_active).length;
  const totalDoctors = doctors.length;

  const isLoading = appointmentsLoading || doctorsLoading;

  // Get recent appointments
  const recentAppointments = appointments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const { user } = useAuth();
  const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const quickActions = [
    { label: 'Doctors', path: '/admin/doctors', color: 'bg-blue-500' },
    { label: 'Slots', path: '/admin/slots', color: 'bg-purple-500' },
    { label: 'Patients', path: '/admin/patients', color: 'bg-teal-500' },
    { label: 'Appointments', path: '/admin/appointments', color: 'bg-orange-500' },
    { label: 'Reports', path: '/admin/reports', color: 'bg-indigo-500' },
    { label: 'Settings', path: '/admin/settings', color: 'bg-gray-500' },
  ];

  // Prepare data for charts
  // Last 7 days appointments trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }).reverse();

  const appointmentsTrendData = last7Days.map(date => {
    const count = appointments.filter(apt => {
      const aptDate = new Date(apt.created_at).toISOString().split('T')[0];
      return aptDate === date;
    }).length;
    return { date, count };
  });

  // Revenue trend for last 7 days
  const revenueTrendData = last7Days.map(date => {
    const revenue = appointments
      .filter(apt => {
        const aptDate = new Date(apt.created_at).toISOString().split('T')[0];
        return aptDate === date && apt.payment_status === 'paid';
      })
      .reduce((sum, apt) => sum + (Number(apt.payment?.amount) || 0), 0);
    return { date, revenue };
  });

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* Header */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{currentDate}</p>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                Welcome back, <span className="text-[#1a4d3e]">{user?.name?.split(' ')[0] || 'Admin'}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">Here's what's happening at your clinic today.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/admin/doctors')}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a4d3e] text-white text-sm font-semibold rounded-xl hover:bg-[#153d31] transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="whitespace-nowrap">Manage Doctors</span>
              </button>
              <button
                onClick={() => navigate('/admin/slots')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="whitespace-nowrap">Manage Slots</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-5 animate-pulse border-l-4 border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 bg-gray-200 rounded-xl"></div>
                      <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">

              {/* Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Appointments"
                  value={totalAppointments.toString()}
                  subtitle="Last 30 days"
                  delta={appointmentsDelta}
                  showDelta
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  iconBg="bg-[#1a4d3e]"
                  borderColor="border-l-[#1a4d3e]"
                />
                <MetricCard
                  title="Total Revenue"
                  value={`₹${totalRevenue >= 1000 ? (totalRevenue/1000).toFixed(1)+'K' : totalRevenue.toFixed(0)}`}
                  subtitle={`${currentPeriodAppointments.filter(a => a.payment_status === 'paid').length} paid`}
                  delta={revenueDelta}
                  showDelta
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBg="bg-emerald-600"
                  borderColor="border-l-emerald-600"
                />
                <MetricCard
                  title="Active Doctors"
                  value={`${activeDoctors}/${totalDoctors}`}
                  subtitle="Currently active"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                  iconBg="bg-blue-600"
                  borderColor="border-l-blue-600"
                />
                <MetricCard
                  title="Pending Payments"
                  value={`₹${pendingPaymentsAmount >= 1000 ? (pendingPaymentsAmount/1000).toFixed(1)+'K' : pendingPaymentsAmount.toFixed(0)}`}
                  subtitle="Requires attention"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBg="bg-amber-500"
                  borderColor="border-l-amber-500"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Weekly Overview</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Appointments & revenue — last 7 days</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1a4d3e]"></div>
                        <span className="text-xs text-gray-500">Appointments</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                        <span className="text-xs text-gray-500">Revenue</span>
                      </div>
                    </div>
                  </div>
                  <WeeklyChart appointmentsData={appointmentsTrendData} revenueData={revenueTrendData} />
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-gray-900">Status Breakdown</h2>
                    <p className="text-xs text-gray-400 mt-0.5">All-time appointment statuses</p>
                  </div>
                  <StatusPieChart
                    confirmed={confirmedAppointments}
                    completed={completedAppointments}
                    cancelled={cancelledAppointments}
                    total={appointments.length}
                  />
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Appointments */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Recent Appointments</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Latest bookings</p>
                    </div>
                    <button onClick={() => navigate('/admin/appointments')} className="text-xs font-semibold text-[#1a4d3e] hover:underline">
                      View all →
                    </button>
                  </div>
                  {recentAppointments.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">No recent appointments</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {recentAppointments.map(appointment => (
                        <AppointmentRow key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {quickActions.map(action => (
                        <button
                          key={action.label}
                          onClick={() => navigate(action.path)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Doctor Performance */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-gray-900">Top Doctors</h2>
                      <button onClick={() => navigate('/admin/doctors')} className="text-xs font-semibold text-[#1a4d3e] hover:underline">View all →</button>
                    </div>
                    <DoctorPerformanceChart doctors={doctors} appointments={appointments} />
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  borderColor: string;
  subtitle: string;
  delta?: number;
  showDelta?: boolean;
}

const MetricCard = ({ title, value, icon, iconBg, borderColor, subtitle, delta = 0, showDelta = false }: MetricCardProps) => {
  const isPositive = delta >= 0;
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${borderColor} p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        {showDelta && (
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d={isPositive ? "M7 14l5-5 5 5H7z" : "M7 10l5 5 5-5H7z"} />
            </svg>
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 leading-tight">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5 leading-tight">{value}</p>
      <p className="text-xs text-gray-400 leading-tight">{subtitle}</p>
    </div>
  );
};

// Appointment Row Component
interface AppointmentRowProps {
  appointment: Appointment;
}

const AppointmentRow = ({ appointment }: AppointmentRowProps) => {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
    confirmed: { bg: 'bg-blue-50', text: 'text-blue-700' },
    completed: { bg: 'bg-green-50', text: 'text-green-700' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-600' },
    rejected: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const s = statusConfig[appointment.status] || { bg: 'bg-gray-50', text: 'text-gray-600' };

  return (
    <div className="px-6 py-3.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#1a4d3e]">
              {(appointment.user?.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{appointment.user?.name || 'Unknown Patient'}</p>
            <p className="text-xs text-gray-400 truncate">
              Dr. {appointment.doctor?.name} · {appointment.slot?.date ? new Date(appointment.slot.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'} {appointment.slot?.start_time ? formatTime(appointment.slot.start_time) : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
          <span className="text-sm font-bold text-gray-700">₹{Number(appointment.payment?.amount || 0).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

// Doctor Card removed - replaced by DoctorPerformanceChart in sidebar

// Weekly Chart Component - Advanced Smooth Animation
interface WeeklyChartProps {
  appointmentsData: Array<{ date: string; count?: number }>;
  revenueData: Array<{ date: string; revenue?: number }>;
}

const WeeklyChart = ({ appointmentsData, revenueData }: WeeklyChartProps) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = React.useState(0);
  
  const appointmentValues = appointmentsData.map(d => d.count || 0);
  const revenueValues = revenueData.map(d => d.revenue || 0);
  
  const maxAppointments = Math.max(...appointmentValues, 1);
  const maxRevenue = Math.max(...revenueValues, 1);
  
  const hasData = appointmentValues.some(v => v > 0) || revenueValues.some(v => v > 0);

  // Smooth animation on mount
  React.useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      setAnimationProgress(easeOutCubic(progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, []);

  // Generate smooth curve path using bezier curves
  const generateSmoothPath = (data: number[], max: number, isFilled: boolean) => {
    if (data.length === 0) return '';
    
    const points = data.map((value, i) => ({
      x: 50 + (i * 630 / (data.length - 1)),
      y: 180 - ((value / max) * 160 * animationProgress)
    }));

    // Create smooth bezier curve
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      
      path += ` Q ${controlX} ${current.y}, ${controlX} ${(current.y + next.y) / 2}`;
      path += ` Q ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    if (isFilled) {
      path += ` L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;
    }

    return path;
  };

  return (
    <div className="w-full h-64 relative">
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center bg-sage-50 rounded-lg border-2 border-dashed border-sage-300 z-10">
          <div className="text-center">
            <svg className="w-12 h-12 text-sage-400 mx-auto mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm text-sage-600">No data for the last 7 days</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end space-x-4 mb-4 hidden">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#1a4d3e] shadow-sm"></div>
          <span className="text-xs font-medium text-gray-600">Appointments</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm"></div>
          <span className="text-xs font-medium text-gray-600">Revenue</span>
        </div>
      </div>

      <svg className="w-full h-48" viewBox="0 0 700 200" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="appointmentsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a4d3e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1a4d3e" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/>
          </filter>
        </defs>

        {/* Grid lines with fade-in animation */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1="50"
            y1={20 + i * 40}
            x2="680"
            y2={20 + i * 40}
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity={animationProgress * 0.5}
          />
        ))}

        {/* Appointments Area with smooth animation */}
        {hasData && (
          <>
            <path
              d={generateSmoothPath(appointmentValues, maxAppointments, true)}
              fill="url(#appointmentsGradient)"
              opacity={animationProgress}
            />
            <path
              d={generateSmoothPath(appointmentValues, maxAppointments, false)}
              fill="none"
              stroke="#1a4d3e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#shadow)"
              opacity={animationProgress}
            />
          </>
        )}

        {/* Revenue Line with smooth animation */}
        {hasData && (
          <path
            d={generateSmoothPath(revenueValues, maxRevenue, false)}
            fill="none"
            stroke="#34D399"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#shadow)"
            opacity={animationProgress}
          />
        )}

        {/* Interactive data points */}
        {appointmentsData.map((d, i) => {
          const x = 50 + (i * 630 / (appointmentsData.length - 1));
          const yApp = 180 - ((d.count || 0) / maxAppointments) * 160 * animationProgress;
          const yRev = 180 - ((revenueData[i].revenue || 0) / maxRevenue) * 160 * animationProgress;
          const isHovered = hoveredIndex === i;

          return (
            <g key={i} opacity={animationProgress}>
              {/* Hover vertical line */}
              {isHovered && (
                <line
                  x1={x}
                  y1="20"
                  x2={x}
                  y2="180"
                  stroke="#CBD5E0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />
              )}

              {/* Appointments point with glow */}
              <circle
                cx={x}
                cy={yApp}
                r={isHovered ? 8 : 5}
                fill="#1a4d3e"
                stroke="white"
                strokeWidth="2"
                filter={isHovered ? "url(#glow)" : ""}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              
              {/* Revenue point with glow */}
              <circle
                cx={x}
                cy={yRev}
                r={isHovered ? 8 : 5}
                fill="#34D399"
                stroke="white"
                strokeWidth="3"
                filter={isHovered ? "url(#glow)" : ""}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Date label */}
              <text
                x={x}
                y="195"
                textAnchor="middle"
                className={`text-xs transition-all duration-300 ${isHovered ? 'fill-primary-500 font-semibold' : 'fill-sage-600'}`}
                style={{ fontSize: isHovered ? '11px' : '10px' }}
              >
                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>

              {/* Enhanced hover tooltip */}
              {isHovered && (
                <g className="animate-fade-in">
                  <rect
                    x={x - 60}
                    y={Math.min(yApp, yRev) - 65}
                    width="120"
                    height="55"
                    rx="8"
                    fill="white"
                    filter="url(#shadow)"
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={Math.min(yApp, yRev) - 45}
                    textAnchor="middle"
                    className="fill-sage-500 text-xs"
                    style={{ fontSize: '10px' }}
                  >
                    {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                  <circle cx={x - 40} cy={Math.min(yApp, yRev) - 28} r="3" fill="#9F7AEA" />
                  <text
                    x={x - 32}
                    y={Math.min(yApp, yRev) - 24}
                    textAnchor="start"
                    className="fill-sage-700 text-xs font-semibold"
                    style={{ fontSize: '11px' }}
                  >
                    {d.count || 0} appointments
                  </text>
                  <circle cx={x - 40} cy={Math.min(yApp, yRev) - 12} r="3" fill="#34D399" />
                  <text
                    x={x - 32}
                    y={Math.min(yApp, yRev) - 8}
                    textAnchor="start"
                    className="fill-sage-700 text-xs font-semibold"
                    style={{ fontSize: '11px' }}
                  >
                    ₹{(revenueData[i].revenue || 0).toFixed(0)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Doctor Performance Chart Component - Horizontal Bar Chart
interface DoctorPerformanceChartProps {
  doctors: any[];
  appointments: Appointment[];
}

const DoctorPerformanceChart = ({ doctors, appointments }: DoctorPerformanceChartProps) => {
  const [animationProgress, setAnimationProgress] = React.useState(0);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Smooth animation on mount
  React.useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      setAnimationProgress(easeOutCubic(progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, []);

  // Calculate doctor performance
  const doctorPerformance = doctors.map(doctor => {
    const doctorAppointments = appointments.filter(apt => apt.doctor_id === doctor.id);
    const revenue = doctorAppointments
      .filter(apt => apt.payment_status === 'paid')
      .reduce((sum, apt) => sum + (Number(apt.payment?.amount) || 0), 0);
    
    return {
      id: doctor.id,
      name: doctor.name,
      appointments: doctorAppointments.length,
      revenue,
    };
  }).sort((a, b) => b.appointments - a.appointments).slice(0, 5);

  const maxAppointments = Math.max(...doctorPerformance.map(d => d.appointments), 1);
  const hasData = doctorPerformance.some(d => d.appointments > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-8 bg-sage-50 rounded-lg border-2 border-dashed border-sage-300">
        <div className="text-center">
          <svg className="w-10 h-10 text-sage-400 mx-auto mb-2 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <p className="text-sm text-sage-600">No doctor performance data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {doctorPerformance.map((doctor, index) => {
        const percentage = (doctor.appointments / maxAppointments) * 100;
        const isHovered = hoveredIndex === index;
        
        return (
          <div
            key={doctor.id}
            className="group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isHovered ? 'bg-[#1a4d3e] scale-110' : 'bg-[#1a4d3e]/10'
                }`}>
                  <svg className={`w-4 h-4 transition-colors duration-300 ${
                    isHovered ? 'text-white' : 'text-[#1a4d3e]'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isHovered ? 'text-[#1a4d3e]' : 'text-gray-700'
                }`}>
                  {doctor.name}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-semibold transition-all duration-300 ${
                  isHovered ? 'text-[#1a4d3e] scale-110' : 'text-gray-700'
                }`}>
                  {doctor.appointments} apt
                </span>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isHovered ? 'text-green-600 scale-110' : 'text-sage-600'
                }`}>
                  ₹{doctor.revenue.toFixed(0)}
                </span>
              </div>
            </div>
            <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${
                  isHovered ? 'bg-gradient-to-r from-[#1a4d3e] to-emerald-400' : 'bg-[#1a4d3e]'
                }`}
                style={{ 
                  width: `${percentage * animationProgress}%`,
                  boxShadow: isHovered ? '0 0 12px rgba(99, 102, 241, 0.5)' : 'none'
                }}
              >
                {isHovered && (
                  <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Status Pie Chart Component - Animated Donut Chart
interface StatusPieChartProps {
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

const StatusPieChart = ({ confirmed, completed, cancelled, total }: StatusPieChartProps) => {
  const [animationProgress, setAnimationProgress] = React.useState(0);
  const [hoveredSlice, setHoveredSlice] = React.useState<string | null>(null);

  // Smooth animation on mount
  React.useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      setAnimationProgress(easeOutCubic(progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, []);

  const hasData = total > 0;
  
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 bg-sage-50 rounded-lg border-2 border-dashed border-sage-300">
        <div className="text-center">
          <svg className="w-10 h-10 text-sage-400 mx-auto mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p className="text-sm text-sage-600">No status data</p>
        </div>
      </div>
    );
  }

  const confirmedPercent = (confirmed / total) * 100;
  const completedPercent = (completed / total) * 100;
  const cancelledPercent = (cancelled / total) * 100;

  // Calculate donut chart segments
  const radius = 70;
  const innerRadius = 45;
  const centerX = 100;
  const centerY = 100;

  const createArc = (startAngle: number, endAngle: number, isHovered: boolean) => {
    const outerRadius = isHovered ? radius + 5 : radius;
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + outerRadius * Math.cos(start);
    const y1 = centerY + outerRadius * Math.sin(start);
    const x2 = centerX + outerRadius * Math.cos(end);
    const y2 = centerY + outerRadius * Math.sin(end);

    const x3 = centerX + innerRadius * Math.cos(end);
    const y3 = centerY + innerRadius * Math.sin(end);
    const x4 = centerX + innerRadius * Math.cos(start);
    const y4 = centerY + innerRadius * Math.sin(start);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  const confirmedAngle = (confirmedPercent / 100) * 360 * animationProgress;
  const completedAngle = confirmedAngle + (completedPercent / 100) * 360 * animationProgress;
  const cancelledAngle = completedAngle + (cancelledPercent / 100) * 360 * animationProgress;

  return (
    <div className="space-y-6">
      <svg className="w-full h-48" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="pieGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="confirmedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="cancelledGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
        </defs>

        {/* Confirmed slice */}
        {confirmedPercent > 0 && (
          <path
            d={createArc(0, confirmedAngle, hoveredSlice === 'confirmed')}
            fill="url(#confirmedGradient)"
            filter={hoveredSlice === 'confirmed' ? "url(#pieGlow)" : ""}
            className="cursor-pointer transition-all duration-300"
            onMouseEnter={() => setHoveredSlice('confirmed')}
            onMouseLeave={() => setHoveredSlice(null)}
            opacity={hoveredSlice && hoveredSlice !== 'confirmed' ? 0.5 : 1}
          />
        )}

        {/* Completed slice */}
        {completedPercent > 0 && (
          <path
            d={createArc(confirmedAngle, completedAngle, hoveredSlice === 'completed')}
            fill="url(#completedGradient)"
            filter={hoveredSlice === 'completed' ? "url(#pieGlow)" : ""}
            className="cursor-pointer transition-all duration-300"
            onMouseEnter={() => setHoveredSlice('completed')}
            onMouseLeave={() => setHoveredSlice(null)}
            opacity={hoveredSlice && hoveredSlice !== 'completed' ? 0.5 : 1}
          />
        )}

        {/* Cancelled slice */}
        {cancelledPercent > 0 && (
          <path
            d={createArc(completedAngle, cancelledAngle, hoveredSlice === 'cancelled')}
            fill="url(#cancelledGradient)"
            filter={hoveredSlice === 'cancelled' ? "url(#pieGlow)" : ""}
            className="cursor-pointer transition-all duration-300"
            onMouseEnter={() => setHoveredSlice('cancelled')}
            onMouseLeave={() => setHoveredSlice(null)}
            opacity={hoveredSlice && hoveredSlice !== 'cancelled' ? 0.5 : 1}
          />
        )}

        {/* Center circle */}
        <circle cx={centerX} cy={centerY} r={innerRadius} fill="white" />
        
        {/* Center text */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          className="fill-primary-500 font-bold"
          style={{ fontSize: '24px' }}
        >
          {total}
        </text>
        <text
          x={centerX}
          y={centerY + 12}
          textAnchor="middle"
          className="fill-sage-500 text-xs"
          style={{ fontSize: '11px' }}
        >
          Total
        </text>
      </svg>

      <div className="space-y-2">
        <div
          className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 cursor-pointer ${
            hoveredSlice === 'confirmed' ? 'bg-blue-50 scale-105' : 'hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('confirmed')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 shadow-md"></div>
            <span className="text-sm text-gray-700">Confirmed</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">{confirmed} ({confirmedPercent.toFixed(1)}%)</span>
        </div>
        
        <div
          className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 cursor-pointer ${
            hoveredSlice === 'completed' ? 'bg-green-50 scale-105' : 'hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('completed')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-green-400 shadow-md"></div>
            <span className="text-sm text-gray-700">Completed</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">{completed} ({completedPercent.toFixed(1)}%)</span>
        </div>
        
        <div
          className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 cursor-pointer ${
            hoveredSlice === 'cancelled' ? 'bg-red-50 scale-105' : 'hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('cancelled')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-400 shadow-md"></div>
            <span className="text-sm text-gray-700">Cancelled</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">{cancelled} ({cancelledPercent.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
