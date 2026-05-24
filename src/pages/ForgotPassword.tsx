import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button, Input } from '../components/common';
import { validateEmail } from '../utils/validators';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setIsLoading(true);

    try {
      await api.post('/forgot-password', { email });
      // Always show success — backend never reveals if email exists
      setSubmitted(true);
    } catch {
      // Even on error, show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-500">
      <Header />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-display font-bold text-primary-500">
              Forgot your password?
            </h2>
            <p className="mt-2 text-center text-sm text-sage-600">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {submitted ? (
            <div className="card p-8 text-center space-y-4">
              {/* Success state */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-primary-500">Check your email</h3>
              <p className="text-sm text-sage-600">
                If an account with <strong>{email}</strong> exists, a password reset link has been sent.
                The link expires in 60 minutes.
              </p>
              <p className="text-sm text-sage-500">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="font-medium text-gold-500 hover:text-gold-600 underline"
                >
                  try again
                </button>
                .
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="font-medium text-gold-500 hover:text-gold-600 text-sm"
                >
                  ← Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6 card p-8" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  error={emailError}
                  placeholder="Enter your registered email"
                  required
                  fullWidth
                  autoComplete="email"
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
                  {isLoading ? 'Sending...' : 'Send reset link'}
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
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};
