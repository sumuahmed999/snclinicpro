import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Button, Input } from '../components/common';
import { validatePassword } from '../utils/validators';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

interface FormErrors {
  password?: string;
  password_confirmation?: string;
  general?: string;
}

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  // Validate that token and email are present in the URL
  useEffect(() => {
    if (!token || !email) {
      setInvalidLink(true);
    }
  }, [token, email]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password =
        'Password must be at least 8 characters and contain uppercase, lowercase, and a number';
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await api.post('/reset-password', {
        token,
        email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.errors?.token) {
        setErrors({ general: data.errors.token[0] });
      } else if (data?.errors?.password) {
        setErrors({ password: data.errors.password[0] });
      } else {
        setErrors({
          general: data?.message || 'Something went wrong. Please request a new reset link.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Invalid link state
  if (invalidLink) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-500">
        <Header />
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full card p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-primary-500">Invalid reset link</h3>
            <p className="text-sm text-sage-600">
              This password reset link is invalid or missing required parameters.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block font-medium text-gold-500 hover:text-gold-600 text-sm"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-500">
        <Header />
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full card p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-primary-500">Password reset successful!</h3>
            <p className="text-sm text-sage-600">
              Your password has been updated. You'll be redirected to the login page in a moment.
            </p>
            <Link
              to="/login"
              className="inline-block font-medium text-gold-500 hover:text-gold-600 text-sm"
            >
              Go to sign in →
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-500">
      <Header />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-display font-bold text-primary-500">
              Set a new password
            </h2>
            <p className="mt-2 text-center text-sm text-sage-600">
              Choose a strong password for your account.
            </p>
          </div>

          <form className="mt-8 space-y-6 card p-8" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{errors.general}</p>
                <div className="mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-red-700 underline hover:text-red-800"
                  >
                    Request a new reset link
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="New Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter new password"
                required
                fullWidth
                autoComplete="new-password"
                helperText="At least 8 characters with uppercase, lowercase, and a number"
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                error={errors.password_confirmation}
                placeholder="Re-enter new password"
                required
                fullWidth
                autoComplete="new-password"
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset password'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-gold-500 hover:text-gold-600"
              >
                ← Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};
