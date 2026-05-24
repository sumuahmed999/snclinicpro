import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { useDoctors } from '../hooks/useDoctors';
import { useQuery } from '@tanstack/react-query';
import { slotService } from '../services/slots';
import { useAuth } from '../context/AuthContext';
import heroBackground from '../assets/home.png';
import type { Slot } from '../types';

// Component to fetch and display available slots for a doctor
const DoctorAvailableSlots = ({ doctorId }: { doctorId: number }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['doctor-slots', doctorId],
    queryFn: () => slotService.getDoctorSlots(doctorId, {
      start_date: today.toISOString().split('T')[0],
      end_date: next7Days.toISOString().split('T')[0],
    }),
  });

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between text-xs animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const slots = slotsData?.data || [];
  
  // Filter available slots (not fully booked, active, and strictly in the future)
  const availableSlots = slots
    .filter((slot: Slot) => {
      if (!slot.is_active || slot.booked_count >= slot.max_capacity) return false;
      // Parse date as local date to avoid UTC timezone shift
      const [year, month, day] = slot.date.split('-').map(Number);
      const slotDate = new Date(year, month - 1, day);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate >= today;
    })
    .slice(0, 3); // Show only first 3

  if (availableSlots.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        No available slots in the next 7 days
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {availableSlots.map((slot: Slot, index: number) => {
        // Parse as local date to avoid UTC timezone shift
        const [year, month, day] = slot.date.split('-').map(Number);
        const slotDate = new Date(year, month - 1, day);
        const dayName = slotDate.toLocaleDateString('en-US', { weekday: 'short' });
        const formattedDate = slotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Convert 24-hour time to 12-hour AM/PM format
        const [hours, minutes] = slot.start_time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const formattedTime = `${displayHour}:${minutes} ${ampm}`;
        
        return (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {dayName} ({formattedDate})
            </span>
            <span className="font-medium text-gray-900">
              {formattedTime}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const Home = () => {
  const { data: doctorsData, isLoading } = useDoctors({ is_active: true });
  const { user, isAuthenticated } = useAuth();

  const doctors = doctorsData?.data || [];

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen bg-gradient-to-b from-white via-cream-50 to-white">
        {/* Hero Section - Exact Match */}
        <section id="home" className="relative overflow-hidden bg-[#F5F5F0]">
          {/* Background Image with Blur */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${heroBackground})`,
              filter: 'blur(3px)',
              transform: 'scale(1)'
            }}
          ></div>
          
          {/* Content Overlay */}
          <div className="relative w-full py-12 sm:py-16 lg:py-20">
            <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
              {/* Left Content */}
              <div>
                {/* Trust Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-primary-700 rounded-md mb-6 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Trusted by Thousands of Patients</span>
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gray-900">
                  Manage Your Health Easily, <span className="relative inline-block">
                    <span className="text-primary-600">Anytime</span>
                    <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 6C50 2 150 2 198 6" stroke="#5BA8A0" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </span>
                </h1>
                
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Book appointments, access your health records, and stay on top of your health — all in one place.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'staff' ? '/staff/dashboard' : '/patient/dashboard'}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go to Dashboard
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Book Appointment
                      </Link>
                      
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:border-primary-300 hover:bg-gray-50 transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
                
                {/* Feature Pills - Beautiful Aligned Design */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl">
                  {/* Item 1 */}
                  <div className="flex flex-col items-center text-center sm:items-start sm:text-left relative">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-md">
                      <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 00-9.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">For You & Your Family</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Manage your health and your family members in one account.</p>
                    
                    {/* Vertical Divider - Right Side */}
                    <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-px bg-gray-300"></div>
                  </div>
                  
                  {/* Item 2 */}
                  <div className="flex flex-col items-center text-center sm:items-start sm:text-left relative">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-md">
                      <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Stay Updated</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Get reminders for appointments, medicines and check-ups.</p>
                    
                    {/* Vertical Divider - Right Side */}
                    <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-px bg-gray-300"></div>
                  </div>
                  
                  {/* Item 3 */}
                  <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-md">
                      <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Support 24/7</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">We're here to help you anytime, anywhere.</p>
                  </div>
                </div>
              </div>
              
              {/* Right - Feature Cards Only */}
              <div className="relative hidden lg:flex items-center justify-end">
                {/* Floating Feature Cards - Vertically Stacked */}
                <div className="flex flex-col gap-6 w-80">
                  {/* Card 1 - Easy Appointments */}
                  <div className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 animate-float">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base mb-2">Easy Appointments</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Book with your preferred doctor in just a few clicks.</p>
                      </div>
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card 2 - Health Records */}
                  <div className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 animate-float animation-delay-2000">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base mb-2">Health Records</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Access your medical history, reports and prescriptions anytime.</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card 3 - Secure & Confidential */}
                  <div className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 animate-float animation-delay-4000">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base mb-2">Secure & Confidential</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Your health data is protected with top-level security.</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* Features Section - Minimal & Clean */}
        <section id="features" className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Comprehensive healthcare management at your fingertips
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: 'Easy Booking',
                  description: 'Book appointments in seconds'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Digital Records',
                  description: 'Access records anytime, anywhere'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  ),
                  title: 'Secure Payments',
                  description: 'Multiple payment options'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: 'Family Care',
                  description: 'Manage family appointments'
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 mb-4 group-hover:bg-primary-100 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Doctors Section - Clean List Design */}
        <section id="doctors" className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-sm text-gray-500 mb-2">Find a doctor</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                  Trusted specialists, ready when you need them
                </h2>
                <p className="text-gray-600 max-w-2xl">
                  Browse verified doctors by specialty, see real patient reviews, and book the next available slot in seconds.
                </p>
              </div>
              {doctors.length > 3 && (
                <Link
                  to={isAuthenticated ? (user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'staff' ? '/staff/dashboard' : '/patient/dashboard') : "/register"}
                  className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {isAuthenticated ? "Go to Dashboard" : "View all doctors →"}
                </Link>
              )}
            </div>
            
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div className="flex gap-4 mb-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.slice(0, 6).map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 p-6"
                  >
                    {/* Doctor Header */}
                    <div className="flex gap-4 mb-4">
                      {/* Avatar with Photo or Initials */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-teal-100 overflow-hidden flex items-center justify-center">
                          {doctor.profile_photo ? (
                            <img
                              src={doctor.profile_photo}
                              alt={`${doctor.name}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-xl font-bold text-teal-700">${doctor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-xl font-bold text-teal-700">
                              {doctor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          )}
                        </div>
                        {/* Online Status Indicator */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      
                      {/* Doctor Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {doctor.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{doctor.specialization}</span>
                        </div>
                        <p className="text-xs text-gray-500">{doctor.qualification}</p>
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">4.8</span>
                      </div>
                      <span className="text-xs text-gray-500">(248 reviews)</span>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">City Clinic, Downtown</span>
                    </div>
                    
                    {/* Next Available - Show Real Slots */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium text-gray-900">Next available:</span>
                      </div>
                      
                      {/* Real Available Slots */}
                      <DoctorAvailableSlots doctorId={doctor.id} />
                    </div>
                    
                    {/* Footer - Fee and Book Button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">CONSULTATION</p>
                        <p className="text-lg font-bold text-gray-900">₹{doctor.consultation_fee}</p>
                      </div>
                      <Link
                        to={isAuthenticated && user?.role === 'patient' ? '/book-appointment' : isAuthenticated ? (user?.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard') : "/register"}
                        className="px-6 py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
                      >
                        {isAuthenticated && user?.role === 'patient' ? "Book Appointment" : isAuthenticated ? "Go to Dashboard" : "Book now"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No doctors available at the moment</p>
              </div>
            )}
            
            {/* Mobile View All Button */}
            {doctors.length > 6 && (
              <div className="text-center mt-8 lg:hidden">
                <Link
                  to={isAuthenticated ? (user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'staff' ? '/staff/dashboard' : '/patient/dashboard') : "/register"}
                  className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {isAuthenticated ? "Go to Dashboard" : "View all doctors →"}
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* How It Works - Horizontal 5-Step Flow */}
        <section id="how-it-works" className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
                How it works
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                From booking to follow-up in 5 simple steps
              </h2>
            </div>
            
            {/* Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
              {[
                {
                  number: '1',
                  title: 'Create account',
                  description: 'Sign up in under a minute — no paperwork.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )
                },
                {
                  number: '2',
                  title: 'Book a slot',
                  description: 'Pick your doctor, date, and time.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  number: '3',
                  title: 'Get your token',
                  description: 'Receive a live digital token & queue position.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  )
                },
                {
                  number: '4',
                  title: 'Visit on time',
                  description: 'Walk in when it\'s your turn — no waiting room.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                },
                {
                  number: '5',
                  title: 'Access records',
                  description: 'View prescriptions and reports anytime.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )
                }
              ].map((step, index) => (
                <div key={index} className="relative text-center group">
                  {/* Connecting Line (hidden on mobile and last item) */}
                  {index < 4 && (
                    <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-200 -z-10">
                      <div className="h-full bg-primary-300 w-0 group-hover:w-full transition-all duration-500"></div>
                    </div>
                  )}
                  
                  {/* Step Circle */}
                  <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6 mx-auto">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 rounded-full bg-primary-100 group-hover:bg-primary-200 transition-colors duration-300"></div>
                    
                    {/* Inner Circle with Icon */}
                    <div className="relative w-16 h-16 rounded-full bg-white border-2 border-primary-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 text-primary-600">
                      {step.icon}
                    </div>
                    
                    {/* Number Badge - Bottom Right */}
                    <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-sm font-bold">{step.number}</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed px-2">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom CTA */}
            {/* <div className="text-center mt-12">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>Get Started Now</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div> */}
          </div>
        </section>

        {/* Patient Testimonials Section */}
        <section id="testimonials" className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
                Loved by patients
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Real people. Real time saved.
              </h2>
            </div>
            
            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  quote: "I booked, got my token, and walked in right when it was my turn. No waiting room, no chaos — finally.",
                  name: "Aanya Sharma",
                  location: "Patient · Bengaluru",
                  initial: "A",
                  color: "bg-teal-600"
                },
                {
                  quote: "Having all my prescriptions and lab reports in one app changed how I manage my parents' care.",
                  name: "Rohan Mehta",
                  location: "Patient · Mumbai",
                  initial: "R",
                  color: "bg-primary-600"
                },
                {
                  quote: "Booking a doctor used to mean phone calls and luck. Now it takes thirty seconds and I'm done.",
                  name: "Priya Singh",
                  location: "Patient · Delhi",
                  initial: "P",
                  color: "bg-teal-700"
                }
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Quote */}
                  <div className="mb-6">
                    <svg className="w-10 h-10 text-primary-200 mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <p className="text-gray-700 leading-relaxed text-base">
                      "{testimonial.quote}"
                    </p>
                  </div>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {testimonial.initial}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Modern Dark Green */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-teal-800 to-teal-900 rounded-3xl p-12 sm:p-16 text-center shadow-2xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                {isAuthenticated ? "Your next doctor visit, without the wait" : "Your next doctor visit, without the wait"}
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                {isAuthenticated 
                  ? "Manage your appointments and health records easily." 
                  : "Create your free patient account and book your first appointment in under a minute."}
              </p>
              
              <div className="flex flex-col gap-3 justify-center max-w-sm mx-auto">
                <Link
                  to={isAuthenticated ? (user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'staff' ? '/staff/dashboard' : '/patient/dashboard') : "/register"}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-teal-900 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {isAuthenticated ? "Go to Dashboard" : "Book Appointment"}
                </Link>
                
                {!isAuthenticated && (
                  <Link
                    to="/register"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-700/50 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/20 hover:bg-teal-700/70 transition-all duration-300 text-sm"
                  >
                    Create free account
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};
