import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Loader, Modal } from '../common';
import { appointmentService } from '../../services/appointments';
import { medicalRecordService } from '../../services/medicalRecords';
import { formatTime, todayLocalDate } from '../../utils/formatters';
import type { MedicalRecord } from '../../types';

interface RecordUploadProps {
  preSelectedAppointmentId?: number;
}

export const RecordUpload = ({ preSelectedAppointmentId }: RecordUploadProps) => {
  const queryClient = useQueryClient();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(
    preSelectedAppointmentId || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordType, setRecordType] = useState<'prescription' | 'lab_report' | 'radiology_report' | 'other'>('prescription');
  const [uploadError, setUploadError] = useState('');

  // Search appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['staff-appointments-search', searchQuery],
    queryFn: () => appointmentService.getAllAppointments(),
    enabled: !preSelectedAppointmentId,
  });

  const appointments = appointmentsData?.data || [];
  
  // Filter appointments: search + only show from today onwards
  const today = todayLocalDate();
  const filteredAppointments = searchQuery
    ? appointments.filter(
        (apt) =>
          (apt.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.token_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.user?.mobile.includes(searchQuery)) &&
          apt.slot?.date &&
          apt.slot.date >= today
      )
    : appointments.filter(apt => apt.slot?.date && apt.slot.date >= today);

  // Get records for selected appointment
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['medical-records', selectedAppointmentId],
    queryFn: () => medicalRecordService.getRecords(selectedAppointmentId!),
    enabled: !!selectedAppointmentId,
  });

  const records = recordsData?.data || [];

  // Get selected appointment details
  const selectedAppointment = appointments.find((apt) => apt.id === selectedAppointmentId);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ appointmentId, formData }: { appointmentId: number; formData: FormData }) =>
      medicalRecordService.uploadRecord(appointmentId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', selectedAppointmentId] });
      // Keep modal open briefly to show success message
      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadError('');
      }, 2000); // Close after 2 seconds
    },
    onError: (error: any) => {
      setUploadError(error.response?.data?.message || 'Failed to upload file');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (recordId: number) => medicalRecordService.deleteRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', selectedAppointmentId] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Only PDF and image files (JPEG, PNG) are allowed');
        return;
      }

      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedAppointmentId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('record_type', recordType);

    uploadMutation.mutate({ appointmentId: selectedAppointmentId, formData });
  };

  const handleDownload = async (record: MedicalRecord) => {
    try {
      const blob = await medicalRecordService.downloadRecord(record.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = (recordId: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteMutation.mutate(recordId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Appointment Selection */}
      {!preSelectedAppointmentId && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Appointment</h2>

          <Input
            fullWidth
            placeholder="Search by patient name, mobile, or token number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {appointmentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No appointments found</p>
          ) : (
            <div className="mt-4 border border-gray-200 rounded-lg divide-y max-h-96 overflow-y-auto">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    selectedAppointmentId === appointment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedAppointmentId(appointment.id)}
                    >
                      <p className="font-medium text-gray-900">{appointment.user?.name}</p>
                      <p className="text-sm text-gray-600">
                        Token: {appointment.token_number} • {appointment.doctor?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.slot?.date} • {appointment.slot?.start_time ? formatTime(appointment.slot.start_time) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {appointment.status}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAppointmentId(appointment.id);
                          setShowUploadModal(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="hidden sm:inline">Upload</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Records Section */}
      {selectedAppointmentId && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Medical Records</h2>
              {selectedAppointment && (
                <p className="text-sm text-gray-600 mt-1">
                  Patient: {selectedAppointment.user?.name} • Token: {selectedAppointment.token_number}
                </p>
              )}
            </div>
          </div>

          {recordsLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="mt-2 text-gray-600">No medical records uploaded yet</p>
              <Button
                className="mt-4"
                onClick={() => setShowUploadModal(true)}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload First Record
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowUploadModal(true)}>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Record
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {records.map((record) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    onDownload={() => handleDownload(record)}
                    onDelete={() => handleDelete(record.id)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setUploadError('');
        }}
        title="Upload Medical Record"
        size="md"
      >
        <div className="space-y-4">
          {/* Record Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record Type
            </label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="prescription">Prescription</option>
              <option value="lab_report">Lab Report</option>
              <option value="radiology_report">Radiology Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: PDF, JPEG, PNG (Max 10MB)
            </p>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{uploadError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              fullWidth
              onClick={handleUpload}
              disabled={!selectedFile}
              isLoading={uploadMutation.isPending}
            >
              Upload
            </Button>
            <Button
              fullWidth
              variant="outline"
              onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setUploadError('');
              }}
            >
              Cancel
            </Button>
          </div>

          {/* Success Message */}
          {uploadMutation.isSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Record uploaded successfully!</p>
                <p className="text-xs text-green-600 mt-1">The medical record has been saved and is now available.</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

interface RecordCardProps {
  record: MedicalRecord;
  onDownload: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const RecordCard = ({ record, onDownload, onDelete, isDeleting }: RecordCardProps) => {
  const recordTypeLabels = {
    prescription: 'Prescription',
    lab_report: 'Lab Report',
    radiology_report: 'Radiology Report',
    other: 'Other',
  };

  const recordTypeColors = {
    prescription: 'bg-blue-100 text-blue-800',
    lab_report: 'bg-green-100 text-green-800',
    radiology_report: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getFileIcon(record.mime_type)}
          <div>
            <p className="text-sm font-medium text-gray-900 truncate">{record.file_name}</p>
            <p className="text-xs text-gray-500">
              {(record.file_size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      </div>

      <span
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          recordTypeColors[record.record_type]
        }`}
      >
        {recordTypeLabels[record.record_type]}
      </span>

      <p className="text-xs text-gray-500 mt-2">
        Uploaded: {new Date(record.created_at).toLocaleDateString()}
      </p>

      <div className="flex space-x-2 mt-4">
        <Button size="sm" fullWidth variant="outline" onClick={onDownload}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={onDelete}
          isLoading={isDeleting}
          className="px-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
};
