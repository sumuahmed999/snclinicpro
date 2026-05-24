import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctors';
import type { CreateDoctorData } from '../../services/doctors';
import type { Doctor } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import { Layout } from '../layout';

type ToastType = 'success' | 'error' | 'info' | 'warning';

// Beautiful Toast Component
const Toast: React.FC<{ message: string; type: ToastType; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const { bg, border, text, icon } = config[type];

  return (
    <div 
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-xl backdrop-blur-sm ${bg} ${border} ${text} max-w-md`}
      style={{ 
        animation: 'slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }}
    >
      <div className="flex-shrink-0">{icon}</div>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteConfirmDoctor, setDeleteConfirmDoctor] = useState<Doctor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [statusCounts, setStatusCounts] = useState({ active: 0, inactive: 0, total: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Trigger fade-in animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Debounce search term - only update after user stops typing for 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only set debounced term if search is empty or has 3+ characters
      if (searchTerm.length === 0 || searchTerm.length >= 3) {
        setDebouncedSearchTerm(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterActive, debouncedSearchTerm, filterSpecialization]);

  useEffect(() => {
    fetchDoctors();
  }, [filterActive, currentPage, debouncedSearchTerm, filterSpecialization]);

  const fetchDoctors = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }
      
      const params: any = {
        is_active: filterActive,
        page: currentPage,
      };
      
      if (debouncedSearchTerm.trim() && debouncedSearchTerm.trim().length >= 3) {
        params.search = debouncedSearchTerm.trim();
      }
      
      if (filterSpecialization.trim()) {
        params.specialization = filterSpecialization.trim();
      }
      
      const response = await doctorService.getDoctors(params);
      console.log('Fetched doctors:', response.data.map(d => ({ 
        name: d.name, 
        hasPhoto: !!d.profile_photo,
        photoLength: d.profile_photo?.length 
      })));
      setDoctors(response.data);
      setPagination(response.pagination);
      if (response.status_counts) {
        setStatusCounts(response.status_counts);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setIsModalOpen(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleDeleteDoctor = async (doctor: Doctor) => {
    try {
      await doctorService.deleteDoctor(doctor.id);
      fetchDoctors();
      setDeleteConfirmDoctor(null);
      setToast({ message: 'Doctor deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to delete doctor:', error);
      setToast({ message: 'Failed to delete doctor', type: 'error' });
    }
  };

  const handleDeactivateDoctor = async (doctor: Doctor) => {
    try {
      await doctorService.updateDoctor(doctor.id, { is_active: false });
      fetchDoctors();
      setToast({ message: 'Doctor deactivated successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to deactivate doctor:', error);
      setToast({ message: 'Failed to deactivate doctor', type: 'error' });
    }
  };

  const handleActivateDoctor = async (doctor: Doctor) => {
    try {
      await doctorService.updateDoctor(doctor.id, { is_active: true });
      fetchDoctors();
      setToast({ message: 'Doctor activated successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to activate doctor:', error);
      setToast({ message: 'Failed to activate doctor', type: 'error' });
    }
  };

  if (initialLoading) {
    return (
      <Layout showSidebar={true}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className={`p-6 max-w-7xl mx-auto transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
        <Button onClick={handleAddDoctor}>
          Add Doctor
        </Button>
      </div>

      {/* Status Count Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Doctors</p>
            <p className="text-2xl font-bold text-primary-600">{statusCounts.total}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Doctors</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.active}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Inactive Doctors</p>
            <p className="text-2xl font-bold text-red-600">{statusCounts.inactive}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="text"
            placeholder="Search by name or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
          <Input
            type="text"
            placeholder="Filter by specialization..."
            value={filterSpecialization}
            onChange={(e) => setFilterSpecialization(e.target.value)}
            fullWidth
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value;
              setFilterActive(value === 'all' ? undefined : value === 'active');
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Photo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Specialization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qualification
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <Loader size="md" />
                  </div>
                </td>
              </tr>
            ) : doctors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No doctors found
                </td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-12 w-12">
                      {doctor.profile_photo && doctor.profile_photo.trim() !== '' ? (
                        <img
                          src={doctor.profile_photo}
                          alt={`Dr. ${doctor.name}`}
                          className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            console.error(`Failed to load photo for ${doctor.name}:`, doctor.profile_photo?.substring(0, 50));
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = `<div class="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-lg border-2 border-gray-200">${doctor.name.charAt(0)}</div>`;
                            }
                          }}
                          onLoad={() => {
                            console.log(`Photo loaded successfully for ${doctor.name}`);
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-lg border-2 border-gray-200">
                          {doctor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.specialization}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.qualification}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{doctor.consultation_fee}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        doctor.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {doctor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditDoctor(doctor)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    {doctor.is_active ? (
                      <button
                        onClick={() => handleDeactivateDoctor(doctor)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateDoctor(doctor)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirmDoctor(doctor)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.last_page > 1 && (
        <div className="bg-white rounded-lg shadow p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} doctors
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(pagination.last_page, startPage + maxVisible - 1);

                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }

                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span key="ellipsis1" className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === i
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  if (endPage < pagination.last_page) {
                    if (endPage < pagination.last_page - 1) {
                      pages.push(
                        <span key="ellipsis2" className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    pages.push(
                      <button
                        key={pagination.last_page}
                        onClick={() => setCurrentPage(pagination.last_page)}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {pagination.last_page}
                      </button>
                    );
                  }

                  return pages;
                })()}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.last_page}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pagination.last_page
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <DoctorFormModal
          doctor={editingDoctor}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(message) => {
            setIsModalOpen(false);
            fetchDoctors();
            setToast({ message, type: 'success' });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoctor && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmDoctor(null)}
          title="Confirm Delete"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete Dr. {deleteConfirmDoctor.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmDoctor(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteDoctor(deleteConfirmDoctor)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </Layout>
  );
};

// Doctor Form Modal Component
interface DoctorFormModalProps {
  doctor: Doctor | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const DoctorFormModal: React.FC<DoctorFormModalProps> = ({ doctor, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateDoctorData>({
    name: doctor?.name || '',
    specialization: doctor?.specialization || '',
    qualification: doctor?.qualification || '',
    consultation_fee: doctor?.consultation_fee || 0,
    working_days: doctor?.working_days || [],
    profile_photo: doctor?.profile_photo || undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(doctor?.profile_photo);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoPreview(base64String);
      setFormData({ ...formData, profile_photo: base64String });
      setUploadingPhoto(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(undefined);
    setFormData({ ...formData, profile_photo: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    console.log('Submitting doctor form:', {
      doctorId: doctor?.id,
      hasPhoto: !!formData.profile_photo,
      photoLength: formData.profile_photo?.length
    });

    try {
      // Convert working_days array to JSON string for backend validation
      const dataToSend = {
        ...formData,
        working_days: JSON.stringify(formData.working_days)
      };

      if (doctor) {
        const result = await doctorService.updateDoctor(doctor.id, dataToSend as any);
        console.log('Update result:', {
          success: true,
          hasPhoto: !!result.data.profile_photo,
          photoLength: result.data.profile_photo?.length
        });
        onSuccess('Doctor updated successfully');
      } else {
        const result = await doctorService.createDoctor(dataToSend as any);
        console.log('Create result:', {
          success: true,
          hasPhoto: !!result.data.profile_photo,
          photoLength: result.data.profile_photo?.length
        });
        onSuccess('Doctor created successfully');
      }
    } catch (error: any) {
      console.error('Failed to save doctor:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Failed to save doctor');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day],
    }));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={doctor ? 'Edit Doctor' : 'Add Doctor'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Doctor profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-3xl font-bold">
                  {formData.name.charAt(0) || '?'}
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader size="sm" />
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photo
                </span>
              </label>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Recommended: Square image, max 5MB (JPG, PNG, GIF)
          </p>
        </div>

        <Input
          label="Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name?.[0]}
          required
          fullWidth
        />

        <Input
          label="Specialization"
          type="text"
          value={formData.specialization}
          onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
          error={errors.specialization?.[0]}
          required
          fullWidth
        />

        <Input
          label="Qualification"
          type="text"
          value={formData.qualification}
          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
          error={errors.qualification?.[0]}
          required
          fullWidth
        />

        <Input
          label="Consultation Fee"
          type="number"
          value={formData.consultation_fee}
          onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) })}
          error={errors.consultation_fee?.[0]}
          required
          fullWidth
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Working Days <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <label key={day} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.working_days.includes(day)}
                  onChange={() => toggleWorkingDay(day)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{day}</span>
              </label>
            ))}
          </div>
          {errors.working_days && (
            <p className="mt-1 text-sm text-red-600">{errors.working_days[0]}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            {doctor ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DoctorManagement;
