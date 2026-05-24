import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import api from '../services/api';

interface MedicalRecord {
  id: number;
  appointment_id: number;
  record_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploader: {
    id: number;
    name: string;
  };
  appointment: {
    id: number;
    token_number: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    doctor: {
      name: string;
      specialization: string;
    };
    family_member?: {
      id: number;
      name: string;
      relationship: string;
    };
  };
}

interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
  age: number;
  gender: string;
}

export const HealthRecords = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'self' | number>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchHealthRecords();
    fetchFamilyMembers();
  }, []);

  const fetchHealthRecords = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/medical-records');
      setRecords(response.data.records || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load health records');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await api.get('/family-members');
      setFamilyMembers(response.data.family_members || []);
    } catch (err) {
      console.error('Failed to load family members:', err);
    }
  };

  const handleDownload = async (recordId: number, fileName: string) => {
    try {
      const response = await api.get(`/medical-records/${recordId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'prescription':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'lab_report':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'imaging':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

  const filteredRecords = records.filter(record => {
    // Filter by person
    if (selectedFilter === 'self' && record.appointment.family_member) {
      return false;
    }
    if (typeof selectedFilter === 'number') {
      const familyMemberId = record.appointment.family_member?.id;
      if (!familyMemberId || familyMemberId !== selectedFilter) {
        return false;
      }
    }

    // Filter by type
    if (selectedType !== 'all' && record.record_type !== selectedType) {
      return false;
    }

    return true;
  });

  const recordTypes = Array.from(new Set(records.map(r => r.record_type)));

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
        {/* Modern Page Header with gradient */}
        <div className="mb-4 sm:mb-6 lg:mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-gold-500/10 rounded-2xl sm:rounded-3xl blur-2xl sm:blur-3xl"></div>
          <div className="relative flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent leading-tight">
                Health Records
              </h1>
              <p className="text-sage-600 mt-0.5 sm:mt-1 text-sm sm:text-base lg:text-lg">
                View and download medical records for you and your family members
              </p>
            </div>
          </div>
        </div>

        {/* Modern Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 border border-sage-100 hover:shadow-xl transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {/* Person Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-charcoal-600 mb-2 sm:mb-3 flex items-center space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Filter by Person</span>
              </label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value === 'all' ? 'all' : e.target.value === 'self' ? 'self' : parseInt(e.target.value))}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3.5 text-sm sm:text-base bg-white border-2 border-sage-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:border-primary-300"
              >
                <option value="all">All Records</option>
                <option value="self">My Records</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.relationship})
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-charcoal-600 mb-2 sm:mb-3 flex items-center space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Filter by Type</span>
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3.5 text-sm sm:text-base bg-white border-2 border-sage-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:border-primary-300"
              >
                <option value="all">All Types</option>
                {recordTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-8 sm:p-12 border border-sage-200">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-500 mb-3 sm:mb-4"></div>
              <p className="text-sage-600 text-sm sm:text-base">Loading health records...</p>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-8 sm:p-12 border border-sage-200">
            <div className="text-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-sage-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-base sm:text-lg font-semibold text-charcoal-600 mb-2">No Health Records Found</h3>
              <p className="text-sage-600 text-sm sm:text-base">
                Medical records will appear here after your appointments
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-4 lg:p-6 border border-sage-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                  <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4 flex-1 w-full sm:w-auto">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-500">
                      {getRecordTypeIcon(record.record_type)}
                    </div>

                    {/* Record Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-semibold text-primary-500">
                          {record.record_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        {record.appointment.family_member && (
                          <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-xs font-medium rounded-lg">
                            {record.appointment.family_member.name}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs sm:text-sm text-sage-600 mb-2 truncate">{record.file_name}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm text-sage-600">
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">
                            {formatDate(record.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate">Dr. {record.appointment.doctor.name}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="truncate">Token: {record.appointment.token_number}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{formatFileSize(record.file_size)}</span>
                        </div>
                      </div>

                      <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-sage-500">
                        Uploaded by {record.uploader.name} on {formatDate(record.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(record.id, record.file_name)}
                    className="flex-shrink-0 w-full sm:w-auto sm:ml-4 px-3 py-2 sm:px-4 sm:py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-sm sm:text-base min-h-[44px] active:scale-95"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!isLoading && filteredRecords.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-cream-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-sage-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary-500">{filteredRecords.length}</p>
                <p className="text-xs sm:text-sm text-sage-600">Total Records</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary-500">
                  {Array.from(new Set(filteredRecords.map(r => r.appointment_id))).length}
                </p>
                <p className="text-xs sm:text-sm text-sage-600">Appointments</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary-500">
                  {formatFileSize(filteredRecords.reduce((sum, r) => sum + r.file_size, 0))}
                </p>
                <p className="text-xs sm:text-sm text-sage-600">Total Size</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
