import { useState, useRef, useEffect, useCallback } from 'react';
import { useSendMessage } from '../../hooks/useMessages';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../common';
import { patientService } from '../../services/patients';
import type { SendMessageData } from '../../services/messages';
import type { User } from '../../types';

interface MessageComposerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  recipientId?: number;
  recipientName?: string;
}

export const MessageComposer = ({ onSuccess, onCancel, recipientId, recipientName }: MessageComposerProps) => {
  const { user } = useAuth();
  const sendMessageMutation = useSendMessage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    recipient_id: recipientId || 0,
    subject: '',
    content: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Patient search state (for staff/admin)
  const [patientSearch, setPatientSearch] = useState(recipientName || '');
  const [selectedPatient, setSelectedPatient] = useState<User | null>(
    recipientId && recipientName ? ({ id: recipientId, name: recipientName } as User) : null
  );
  const [patientResults, setPatientResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // For patient users, they can only send to staff/admin
  // For staff/admin users, they need to select a patient
  const isPatient = user?.role === 'patient';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPatients = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setPatientResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await patientService.getPatients({ search: query });
      // getPatients returns a PaginatedResponse — data lives in response.data
      const patients = (response as any).data ?? [];
      setPatientResults(patients);
      setShowDropdown(true);
    } catch {
      setPatientResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handlePatientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientSearch(value);
    setSelectedPatient(null);
    setFormData(prev => ({ ...prev, recipient_id: 0 }));

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPatients(value), 300);

    if (errors.recipient_id) {
      setErrors(prev => { const n = { ...prev }; delete n.recipient_id; return n; });
    }
  };

  const handleSelectPatient = (patient: User) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setFormData(prev => ({ ...prev, recipient_id: patient.id }));
    setShowDropdown(false);
    setPatientResults([]);
    if (errors.recipient_id) {
      setErrors(prev => { const n = { ...prev }; delete n.recipient_id; return n; });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, attachment: 'File size must be less than 5MB' }));
        return;
      }
      setAttachment(file);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.attachment;
        return newErrors;
      });
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isPatient && !formData.recipient_id) {
      newErrors.recipient_id = 'Please select a recipient';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Message content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const messageData: SendMessageData = {
        subject: formData.subject,
        content: formData.content,
        attachment: attachment || undefined,
      };

      // For patients, don't send recipient_id - let backend find available admin/staff
      // For staff/admin, they must specify a recipient
      if (!isPatient && formData.recipient_id) {
        messageData.recipient_id = formData.recipient_id;
      }

      await sendMessageMutation.mutateAsync(messageData);

      // Reset form
      setFormData({
        recipient_id: recipientId || 0,
        subject: '',
        content: '',
      });
      setAttachment(null);
      setPatientSearch(recipientName || '');
      setSelectedPatient(recipientId && recipientName ? ({ id: recipientId, name: recipientName } as User) : null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess?.();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to send message';
        setErrors({ submit: errorMessage });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isPatient && !recipientId && (
        <div ref={searchRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient (Patient)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={patientSearch}
              onChange={handlePatientSearchChange}
              onFocus={() => patientResults.length > 0 && setShowDropdown(true)}
              placeholder="Search by name, email or phone..."
              className={`
                block w-full px-3 py-2 border rounded-lg shadow-sm
                focus:outline-none focus:ring-2 focus:ring-offset-0
                ${errors.recipient_id
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : selectedPatient
                    ? 'border-green-400 focus:border-green-500 focus:ring-green-500 bg-green-50'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }
              `}
              autoComplete="off"
            />
            {/* Status icons */}
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              {isSearching && (
                <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {!isSearching && selectedPatient && (
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {!isSearching && !selectedPatient && patientSearch.length > 0 && (
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Search hint */}
          {!selectedPatient && (
            <p className="mt-1 text-xs text-gray-500">
              {patientSearch.length > 0 && patientSearch.length < 2
                ? 'Type at least 2 characters to search'
                : 'Search by patient name, email, or phone number'}
            </p>
          )}
          {selectedPatient && (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {selectedPatient.email && `${selectedPatient.email}`}
              {selectedPatient.email && selectedPatient.mobile && ' · '}
              {selectedPatient.mobile && `${selectedPatient.mobile}`}
            </p>
          )}

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {patientResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No patients found for "{patientSearch}"
                </div>
              ) : (
                patientResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectPatient(patient); }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {patient.email || patient.mobile || `ID: ${patient.id}`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {errors.recipient_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.recipient_id}
            </p>
          )}
        </div>
      )}

      {isPatient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Your message will be sent to the clinic staff
          </p>
        </div>
      )}

      <Input
        label="Subject"
        name="subject"
        value={formData.subject}
        onChange={handleInputChange}
        error={errors.subject}
        placeholder="Enter message subject"
        required
        fullWidth
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          rows={6}
          className={`
            block w-full px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${errors.content
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
          `}
          placeholder="Type your message here..."
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.content}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attachment (Optional)
        </label>
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="message-attachment"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <label
            htmlFor="message-attachment"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            Choose File
          </label>
          {attachment && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{attachment.name}</span>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="text-red-600 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
        {errors.attachment && (
          <p className="mt-1 text-sm text-red-600">{errors.attachment}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
        </p>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={sendMessageMutation.isPending}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          Send Message
        </Button>
      </div>
    </form>
  );
};
