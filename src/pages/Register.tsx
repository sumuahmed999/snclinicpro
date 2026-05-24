import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/common';
import { validateEmail, validateMobile, validatePassword, validateRequired } from '../utils/validators';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

interface FormErrors {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
  password_confirmation?: string;
  general?: string;
}

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    password_confirmation: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!validateRequired(formData.name)) {
      newErrors.name = 'Name is required';
    }

    if (!validateRequired(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validateRequired(formData.mobile)) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!validateMobile(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (!validateRequired(formData.password)) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!validateRequired(formData.password_confirmation)) {
      newErrors.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Register the user
      await register(formData);
      // Auto-login is handled by the register function in AuthContext
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors: FormErrors = {};
        const errorData = error.response.data.errors;
        
        Object.keys(errorData).forEach((key) => {
          backendErrors[key as keyof FormErrors] = errorData[key][0];
        });
        
        setErrors(backendErrors);
      } else {
        const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-500">
      <Header />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-display font-bold text-primary-500">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-sage-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-gold-500 hover:text-gold-600"
              >
                Sign in
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6 card p-8" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {errors.general}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Enter your full name"
                required
                fullWidth
                autoComplete="name"
              />

              <Input
                label="Email address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
                required
                fullWidth
                autoComplete="email"
              />

              <Input
                label="Mobile Number"
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                error={errors.mobile}
                placeholder="Enter 10-digit mobile number"
                required
                fullWidth
                autoComplete="tel"
                maxLength={10}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter password (min 8 characters)"
                required
                fullWidth
                autoComplete="new-password"
                helperText="Password must be at least 8 characters long"
              />

              <Input
                label="Confirm Password"
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                error={errors.password_confirmation}
                placeholder="Re-enter your password"
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
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};
