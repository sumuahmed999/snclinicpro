import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../../services/patients';
import { medicalRecordService } from '../../services/medicalRecords';
import Button from '../common/Button';
import { formatDate, formatTime } from '../../utils/formatters';
import { Layout } from '../layout';

type TabKey = 'info' | 'appointments' | 'records' | 'payments' | 'family';

const SkeletonRow = () => (
  <div className="animate-pulse flex space-x-4 py-3 border-b border-gray-100">
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
  </div>
);

const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const { data, isLoading, error } = useQuery({
    queryKey: ['patient-profile', id],
    queryFn: () => patientService.getPatient(Number(id)),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // cache for 2 minutes
  });

  const patient = data?.data as any;

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
    } catch {
      alert('Failed to download file');
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'info', label: 'Personal Info' },
    { key: 'family', label: `Family Members (${patient?.family_members?.length ?? 0})` },
    { key: 'appointments', label: `Appointments (${patient?.appointment_history?.length ?? 0})` },
    { key: 'records', label: `Medical Records (${patient?.medical_records?.length ?? 0})` },
    { key: 'payments', label: `Payments (${patient?.payment_history?.length ?? 0})` },
  ];

  if (error) {
    return (
      <Layout showSidebar={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load patient profile</p>
            <Button onClick={() => navigate('/admin/patients')}>Back to Patients</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/admin/patients')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Patients
            </button>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-gray-200 rounded w-48 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{patient?.name}</h1>
                  {/* Main account badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Main Account
                  </span>
                  {patient?.family_members?.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {patient.family_members.length} Family Member{patient.family_members.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{patient?.email || patient?.mobile}</p>
              </div>
            )}
          </div>
          {!isLoading && patient && (
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${patient.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {patient.is_active ? 'Active' : 'Inactive'}
            </span>
          )}
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                <div className="h-7 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : patient?.statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 animate-fadeIn">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{patient.statistics.total_appointments}</p>
              <p className="text-sm text-gray-500 mt-1">Total Appointments</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{patient.statistics.completed_appointments}</p>
              <p className="text-sm text-gray-500 mt-1">Completed</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{patient.statistics.cancelled_appointments}</p>
              <p className="text-sm text-gray-500 mt-1">Cancelled</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">₹{Number(patient.statistics.total_spent).toFixed(0)}</p>
              <p className="text-sm text-gray-500 mt-1">Total Spent</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{patient.family_members?.length ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Family Members</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 animate-fadeIn" key={activeTab}>
            {/* Personal Info Tab */}
            {activeTab === 'info' && (
              isLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Main account holder section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                        {patient?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{patient?.name}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Main Account Holder
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Registered {formatDate(patient?.created_at)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'Full Name', value: patient?.name },
                        { label: 'Email', value: patient?.email || '-' },
                        { label: 'Mobile', value: patient?.mobile },
                        { label: 'Status', value: patient?.is_active ? 'Active' : 'Inactive' },
                        { label: 'Registered', value: formatDate(patient?.created_at) },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                          <p className="text-gray-900 font-medium">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Family Members Tab */}
            {activeTab === 'family' && (
              isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
              ) : (
                <div className="space-y-4">
                  {/* Main account holder card */}
                  <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-base flex-shrink-0">
                        {patient?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{patient?.name}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-600 text-white">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Main Account
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                          {patient?.email && <span>{patient.email}</span>}
                          {patient?.mobile && <span>{patient.mobile}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Family members list */}
                  {!patient?.family_members?.length ? (
                    <div className="text-center py-10 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm">No family members added yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patient.family_members.map((member: any, idx: number) => {
                        const age = member.date_of_birth
                          ? Math.floor((Date.now() - new Date(member.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                          : null;
                        const initials = member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                        const colors = ['bg-rose-100 text-rose-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700'];
                        const color = colors[idx % colors.length];
                        return (
                          <div key={member.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${color}`}>
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900">{member.name}</p>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                                    {member.relationship}
                                  </span>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                                  {member.gender && (
                                    <div className="flex items-center gap-1">
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="capitalize">{member.gender}</span>
                                    </div>
                                  )}
                                  {age !== null && (
                                    <div className="flex items-center gap-1">
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span>{age} yrs old</span>
                                    </div>
                                  )}
                                  {member.date_of_birth && (
                                    <div className="flex items-center gap-1 col-span-2">
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
                                      </svg>
                                      <span>DOB: {new Date(member.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                  )}
                                  {member.mobile && (
                                    <div className="flex items-center gap-1 col-span-2">
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                      <span>{member.mobile}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              isLoading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</div>
              ) : !patient?.appointment_history?.length ? (
                <p className="text-gray-500 text-center py-8">No appointment history</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="pb-3 pr-4">Token</th>
                        <th className="pb-3 pr-4">Patient</th>
                        <th className="pb-3 pr-4">Date &amp; Time</th>
                        <th className="pb-3 pr-4">Doctor</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {patient.appointment_history.map((apt: any) => (
                        <tr key={apt.id} className="hover:bg-gray-50">
                          <td className="py-3 pr-4 font-mono text-xs">{apt.token_number}</td>
                          <td className="py-3 pr-4">
                            {apt.family_member ? (
                              <div>
                                <div className="font-medium text-gray-900">{apt.family_member.name}</div>
                                <div className="text-xs text-purple-600 capitalize">{apt.family_member.relationship}</div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-gray-900">{patient.name}</div>
                                <div className="text-xs text-indigo-600">Main Account</div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <div>{apt.slot ? formatDate(apt.slot.date) : '-'}</div>
                            <div className="text-gray-400 text-xs">{apt.slot ? formatTime(apt.slot.start_time) : ''}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <div>{apt.doctor?.name || '-'}</div>
                            <div className="text-gray-400 text-xs">{apt.doctor?.specialization || ''}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                              apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>{apt.status}</span>
                          </td>
                          <td className="py-3">
                            {apt.payment ? (
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${apt.payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                ₹{apt.payment.amount}
                              </span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Medical Records Tab */}
            {activeTab === 'records' && (
              isLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
              ) : !patient?.medical_records?.length ? (
                <p className="text-gray-500 text-center py-8">No medical records</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Type</th>
                        <th className="pb-3 pr-4">File Name</th>
                        <th className="pb-3 pr-4">Size</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {patient.medical_records.map((record: any) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="py-3 pr-4">{formatDate(record.created_at)}</td>
                          <td className="py-3 pr-4 capitalize">{record.record_type?.replace('_', ' ')}</td>
                          <td className="py-3 pr-4 text-gray-600">{record.file_name}</td>
                          <td className="py-3 pr-4 text-gray-400">{(record.file_size / 1024).toFixed(1)} KB</td>
                          <td className="py-3">
                            <button onClick={() => handleDownloadRecord(record.id, record.file_name)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              isLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
              ) : !patient?.payment_history?.length ? (
                <p className="text-gray-500 text-center py-8">No payment history</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Amount</th>
                        <th className="pb-3 pr-4">Method</th>
                        <th className="pb-3 pr-4">Transaction ID</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {patient.payment_history.map((payment: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-3 pr-4">{formatDate(payment.paid_at)}</td>
                          <td className="py-3 pr-4 font-medium">₹{payment.amount}</td>
                          <td className="py-3 pr-4 capitalize">{payment.payment_method}</td>
                          <td className="py-3 pr-4 text-gray-400 text-xs font-mono">{payment.transaction_id || '-'}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PatientProfile;
