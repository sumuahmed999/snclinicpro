import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../../components/layout';
import { Button, Input, Loader } from '../../components/common';
import { patientService } from '../../services/patients';
import { medicalRecordService } from '../../services/medicalRecords';
import { formatTime } from '../../utils/formatters';
import type { User, MedicalRecord } from '../../types';

// Extended MedicalRecord type with relations returned by the staff endpoint
interface MedicalRecordWithRelations extends MedicalRecord {
  appointment?: {
    token_number: string;
    slot?: { date: string };
    family_member?: { name: string; relationship: string };
  };
  uploader?: { name: string };
}

interface PatientProfile {
  id: number;
  name: string;
  email: string;
  mobile: string;
  is_active: boolean;
  created_at: string;
  appointment_history: Array<{
    id: number;
    token_number: string;
    status: string;
    payment_status: string;
    booking_type: string;
    created_at: string;
    slot: {
      date: string;
      start_time: string;
      end_time: string;
    };
    doctor: {
      id: number;
      name: string;
      specialization: string;
    };
    family_member: {
      id: number;
      name: string;
      relationship: string;
    } | null;
    payment: {
      amount: number;
      payment_method: string;
      status: string;
      paid_at: string;
    } | null;
    medical_records_count: number;
  }>;
  statistics: {
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    total_spent: number;
  };
}

export const PatientReportsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch patient profile when selected
  const { data: patientProfile, isLoading: profileLoading } = useQuery<PatientProfile>({
    queryKey: ['patient-profile', selectedPatientId],
    queryFn: () => patientService.getPatientProfile(selectedPatientId!),
    enabled: !!selectedPatientId,
  });

  // Fetch medical records for the selected patient
  const { data: medicalRecordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['patient-medical-records', selectedPatientId],
    queryFn: () => medicalRecordService.getUserRecords(selectedPatientId!),
    enabled: !!selectedPatientId,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await patientService.searchPatients(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (patientId: number) => {
    setSelectedPatientId(patientId);
  };

  const handleBackToSearch = () => {
    setSelectedPatientId(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleDownloadRecord = async (recordId: number, fileName: string) => {
    try {
      const blob = await medicalRecordService.downloadRecord(recordId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedPatientId ? (
          // Search View
          <div>
            <h1 className="text-3xl font-display font-bold text-primary-500 mb-6">
              Patient Reports
            </h1>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Patient
              </h2>

              <div className="flex space-x-2 mb-6">
                <Input
                  fullWidth
                  placeholder="Search by name, mobile, or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} isLoading={isSearching}>
                  Search
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg divide-y">
                  {searchResults.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectPatient(patient.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">
                            {patient.mobile} • {patient.email}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isSearching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8 border border-gray-200 rounded-lg">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-600">No patients found</p>
                </div>
              )}

              {/* Empty State */}
              {!searchQuery && (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="text-gray-600 text-lg">
                    Search for a patient to view their reports
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Patient Profile View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-display font-bold text-primary-500">
                Patient Report
              </h1>
              <Button variant="outline" onClick={handleBackToSearch}>
                ← Back to Search
              </Button>
            </div>

            {profileLoading ? (
              <div className="flex justify-center py-12">
                <Loader />
              </div>
            ) : patientProfile ? (
              <div className="space-y-6">
                {/* Patient Info Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Patient Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{patientProfile.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mobile</p>
                      <p className="font-medium text-gray-900">{patientProfile.mobile}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{patientProfile.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          patientProfile.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {patientProfile.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
                    <p className="text-3xl font-bold text-primary-500">
                      {patientProfile.statistics.total_appointments}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-600">
                      {patientProfile.statistics.completed_appointments}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                    <p className="text-3xl font-bold text-red-600">
                      {patientProfile.statistics.cancelled_appointments}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                    <p className="text-3xl font-bold text-gold-600">
                      ₹{patientProfile.statistics.total_spent}
                    </p>
                  </div>
                </div>

                {/* Appointment History */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Appointment History
                  </h2>

                  {patientProfile.appointment_history.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">
                      No appointments found
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Token
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Date & Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Doctor
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Patient
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Payment
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {patientProfile.appointment_history.map((appointment) => (
                            <tr key={appointment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{appointment.token_number}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                <div>
                                  <p>{appointment.slot.date}</p>
                                  <p className="text-xs text-gray-500">
                                    {appointment.slot.start_time ? formatTime(appointment.slot.start_time) : ''} - {appointment.slot.end_time ? formatTime(appointment.slot.end_time) : ''}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                <div>
                                  <p className="font-medium">Dr. {appointment.doctor.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {appointment.doctor.specialization}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {appointment.family_member ? (
                                  <div>
                                    <p className="font-medium">{appointment.family_member.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {appointment.family_member.relationship}
                                    </p>
                                  </div>
                                ) : (
                                  <p>{patientProfile.name}</p>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {appointment.payment ? (
                                  <div>
                                    <p className="font-medium">₹{appointment.payment.amount}</p>
                                    <p className="text-xs text-gray-500">
                                      {appointment.payment.payment_method}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Medical Records History */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Medical Records History
                  </h2>

                  {recordsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader />
                    </div>
                  ) : medicalRecordsData?.data && medicalRecordsData.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              File Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Record Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Appointment
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Patient
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Upload Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Uploaded By
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {medicalRecordsData.data.map((record: MedicalRecordWithRelations) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm text-gray-900">
                                <div className="flex items-center">
                                  <svg
                                    className="w-5 h-5 text-primary-500 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  <span className="font-medium">{record.file_name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {record.record_type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {record.appointment ? (
                                  <div>
                                    <p className="font-medium">#{record.appointment.token_number}</p>
                                    <p className="text-xs text-gray-500">
                                      {record.appointment.slot?.date}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {record.appointment?.family_member ? (
                                  <div>
                                    <p className="font-medium">{record.appointment.family_member.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {record.appointment.family_member.relationship}
                                    </p>
                                  </div>
                                ) : (
                                  <p>{patientProfile.name}</p>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(record.created_at).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {record.uploader?.name || 'Unknown'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => handleDownloadRecord(record.id, record.file_name)}
                                  className="text-primary-600 hover:text-primary-800 font-medium flex items-center"
                                >
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                  Download
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-gray-600">No medical records found for this patient</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Failed to load patient profile</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
