import { useState } from 'react';
import { Button } from '../common';

interface NewPatientFormProps {
  onSubmit: (data: { name: string; mobile: string; email: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const NewPatientForm = ({ onSubmit, onCancel, isLoading = false }: NewPatientFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    mobile: '',
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {
      name: '',
      mobile: '',
      email: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.mobile && !newErrors.email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        // Error handling is done in parent component
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name Field */}
      <div>
        <label htmlFor="patient-name" className="block text-sm font-semibold text-gray-700 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="patient-name"
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200 ${
              errors.name
                ? 'border-red-300 bg-red-50/50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          placeholder="Enter patient name"
          autoComplete="off"
        />
        {errors.name && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-1.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.name}
          </p>
        )}
      </div>

      {/* Mobile Field */}
      <div>
        <label htmlFor="patient-mobile" className="block text-sm font-semibold text-gray-700 mb-2">
          Mobile <span className="text-red-500">*</span>
        </label>
        <input
          id="patient-mobile"
          type="tel"
          value={formData.mobile}
          onChange={handleChange('mobile')}
          className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200 ${
              errors.mobile
                ? 'border-red-300 bg-red-50/50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          placeholder="Enter 10-digit mobile number"
          maxLength={10}
          autoComplete="off"
        />
        {errors.mobile && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-1.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.mobile}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="patient-email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email <span className="text-gray-400 text-xs">(Optional)</span>
        </label>
        <input
          id="patient-email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200 ${
              errors.email
                ? 'border-red-300 bg-red-50/50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          placeholder="Enter email address"
          autoComplete="off"
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-1.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.email}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          fullWidth
          variant="primary"
          isLoading={isSubmitting || isLoading}
          disabled={isSubmitting || isLoading}
        >
          Create Patient
        </Button>
        <Button
          type="button"
          fullWidth
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
