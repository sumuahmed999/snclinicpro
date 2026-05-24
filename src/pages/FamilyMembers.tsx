import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import { familyMemberService } from '../services/familyMembers';
import type { CreateFamilyMemberData, UpdateFamilyMemberData } from '../services/familyMembers';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import type { FamilyMember } from '../types';

const FamilyMembers: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [error, setError] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');

  const queryClient = useQueryClient();
  const { data, isLoading } = useFamilyMembers();

  const familyMembers = data?.data || [];

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (data: CreateFamilyMemberData) => familyMemberService.addFamilyMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setIsAddModalOpen(false);
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to add family member');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFamilyMemberData }) =>
      familyMemberService.updateFamilyMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setIsEditModalOpen(false);
      setSelectedMember(null);
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update family member');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => familyMemberService.deleteFamilyMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setIsDeleteModalOpen(false);
      setSelectedMember(null);
      setDeleteError('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to remove family member';
      setDeleteError(msg);
    },
  });

  const handleAddClick = () => {
    setError('');
    setIsAddModalOpen(true);
  };

  const handleEditClick = (member: FamilyMember) => {
    setError('');
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (member: FamilyMember) => {
    setDeleteError('');
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedMember) {
      deleteMutation.mutate(selectedMember.id);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Family Members</h1>
            <p className="text-gray-600 mt-0.5 sm:mt-1 text-sm sm:text-base">
              Manage family members for appointment bookings
            </p>
          </div>
          <Button onClick={handleAddClick} className="w-full sm:w-auto min-h-[44px]">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Family Member
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8 sm:py-12">
            <Loader />
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 sm:p-8 text-center">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              No family members yet
            </h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              Add family members to book appointments on their behalf
            </p>
            <Button onClick={handleAddClick} className="min-h-[44px]">Add Your First Family Member</Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {familyMembers.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}

        {/* Add Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setError('');
          }}
          title="Add Family Member"
          size="md"
        >
          <FamilyMemberForm
            onSubmit={(data) => addMutation.mutate(data)}
            onCancel={() => {
              setIsAddModalOpen(false);
              setError('');
            }}
            isLoading={addMutation.isPending}
            error={error}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMember(null);
            setError('');
          }}
          title="Edit Family Member"
          size="md"
        >
          {selectedMember && (
            <FamilyMemberForm
              initialData={selectedMember}
              onSubmit={(data) =>
                updateMutation.mutate({ id: selectedMember.id, data })
              }
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedMember(null);
                setError('');
              }}
              isLoading={updateMutation.isPending}
              error={error}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedMember(null);
            setDeleteError('');
          }}
          title="Remove Family Member"
          size="sm"
        >
          <div>
            {deleteError ? (
              // Blocked — show the reason clearly
              <div className="space-y-4">
                <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <p className="text-sm text-amber-800">{deleteError}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setSelectedMember(null);
                      setDeleteError('');
                    }}
                    className="min-h-[44px]"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              // Normal confirmation
              <>
                <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                  Are you sure you want to remove{' '}
                  <span className="font-semibold">{selectedMember?.name}</span>? This
                  action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setSelectedMember(null);
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDeleteConfirm}
                    isLoading={deleteMutation.isPending}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Remove
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

// Family Member Card Component
interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onEdit,
  onDelete,
}) => {
  const age = member.date_of_birth
    ? new Date().getFullYear() - new Date(member.date_of_birth).getFullYear()
    : null;

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl shadow p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between flex-col sm:flex-row gap-3 sm:gap-0">
        <div className="flex items-start w-full sm:w-auto">
          {member.profile_picture ? (
            <img
              src={`http://localhost:8000/${member.profile_picture}`}
              alt={member.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover mr-3 sm:mr-4 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
              <span className="text-lg sm:text-xl font-semibold text-blue-600">
                {getInitial(member.name)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{member.name}</h3>
            <div className="mt-1 space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Relationship:</span> {member.relationship}
              </p>
              {age && (
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Age:</span> {age} years
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Gender:</span>{' '}
                {member.gender.charAt(0).toUpperCase() + member.gender.slice(1)}
              </p>
              {member.mobile && (
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  <span className="font-medium">Mobile:</span> {member.mobile}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto justify-end sm:justify-start">
          <button
            onClick={() => onEdit(member)}
            className="flex-1 sm:flex-none p-2 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
            aria-label="Edit"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(member)}
            className="flex-1 sm:flex-none p-2 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
            aria-label="Delete"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Family Member Form Component
interface FamilyMemberFormProps {
  initialData?: FamilyMember;
  onSubmit: (data: CreateFamilyMemberData) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string;
}

const FamilyMemberForm: React.FC<FamilyMemberFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  error,
}) => {
  const [formData, setFormData] = useState<CreateFamilyMemberData>({
    name: initialData?.name || '',
    relationship: initialData?.relationship || '',
    date_of_birth: initialData?.date_of_birth || '',
    gender: initialData?.gender || 'male',
    mobile: initialData?.mobile || '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(
    initialData?.profile_picture ? `http://localhost:8000/${initialData.profile_picture}` : null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update form data when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        relationship: initialData.relationship || '',
        date_of_birth: initialData.date_of_birth || '',
        gender: initialData.gender || 'male',
        mobile: initialData.mobile || '',
      });
      setProfilePicturePreview(
        initialData.profile_picture ? `http://localhost:8000/${initialData.profile_picture}` : null
      );
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          profile_picture: 'Profile picture must be less than 2MB',
        }));
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        setValidationErrors((prev) => ({
          ...prev,
          profile_picture: 'Profile picture must be jpeg, jpg, png, or gif',
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, profile_picture: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error
      if (validationErrors.profile_picture) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.profile_picture;
          return newErrors;
        });
      }
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData((prev) => {
      const newData = { ...prev };
      delete newData.profile_picture;
      return newData;
    });
    setProfilePicturePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.relationship.trim()) {
      errors.relationship = 'Relationship is required';
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      if (dob > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = 'Mobile number must be 10 digits';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3">
          <p className="text-xs sm:text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Profile Picture Upload */}
      <div className="w-full">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          Profile Picture
        </label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {profilePicturePreview ? (
            <img
              src={profilePicturePreview}
              alt="Profile preview"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-semibold text-blue-600">
                {formData.name ? getInitial(formData.name) : '?'}
              </span>
            </div>
          )}
          <div className="flex-1 w-full sm:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleFileChange}
              className="hidden"
              id="profile-picture-upload"
            />
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <label
                htmlFor="profile-picture-upload"
                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-xs sm:text-sm text-center min-h-[44px] flex items-center justify-center"
              >
                Choose Photo
              </label>
              {profilePicturePreview && (
                <button
                  type="button"
                  onClick={handleRemoveProfilePicture}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm min-h-[44px]"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              Max 2MB. Formats: JPEG, JPG, PNG, GIF
            </p>
            {validationErrors.profile_picture && (
              <p className="text-[10px] sm:text-xs text-red-600 mt-1">{validationErrors.profile_picture}</p>
            )}
          </div>
        </div>
      </div>

      <Input
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={validationErrors.name}
        required
        fullWidth
      />

      <Input
        label="Relationship"
        name="relationship"
        value={formData.relationship}
        onChange={handleChange}
        error={validationErrors.relationship}
        placeholder="e.g., Son, Daughter, Spouse, Parent"
        required
        fullWidth
      />

      <Input
        label="Date of Birth"
        name="date_of_birth"
        type="date"
        value={formData.date_of_birth}
        onChange={handleChange}
        error={validationErrors.date_of_birth}
        required
        fullWidth
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gender <span className="text-red-500">*</span>
        </label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <Input
        label="Mobile Number"
        name="mobile"
        value={formData.mobile}
        onChange={handleChange}
        error={validationErrors.mobile}
        placeholder="10-digit mobile number"
        fullWidth
      />

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto min-h-[44px]"
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto min-h-[44px]">
          {initialData ? 'Update' : 'Add'} Family Member
        </Button>
      </div>
    </form>
  );
};

export default FamilyMembers;
