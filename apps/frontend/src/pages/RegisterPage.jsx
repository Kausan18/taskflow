// apps/frontend/src/pages/RegisterPage.jsx
// FIX 1: Was exporting RegisterForm — App.jsx imports RegisterPage.
// FIX 2: import for useAuth was '../hooks/useAuth' (correct for a page, not component).

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../hooks/useAuth.js';
import { Link } from 'react-router-dom';

const registerSchema = z.object({
  orgName: z.string().min(1, { message: 'Organization name is required' }),
  fullName: z.string().min(1, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const RegisterPage = () => {
  const { register: registerAction } = useAuth();
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  // Auto-generate slug from org name
  const orgName = watch('orgName', '');
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const onSubmit = async (data) => {
    setAuthError('');
    setIsLoading(true);
    try {
      await registerAction(data.orgName, data.fullName, data.email, data.password);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13161c] px-4">
      <div className="w-full max-w-md bg-[#1e2128] border border-[#2d3240] rounded-xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[#6366f1] flex items-center justify-center text-white font-bold text-lg">
            +
          </div>
          <span className="text-white font-semibold text-xl">TaskFlow</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className={`w-8 h-1.5 rounded-full transition-colors ${step === 1 ? 'bg-[#6366f1]' : 'bg-[#2d3240]'}`} />
          <div className={`w-8 h-1.5 rounded-full transition-colors ${step === 2 ? 'bg-[#6366f1]' : 'bg-[#2d3240]'}`} />
        </div>

        <h1 className="text-xl font-semibold text-white text-center mb-1">
          {step === 1 ? 'Create your workspace' : 'Your account details'}
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          {step === 1 ? 'Step 1 of 2 — Organisation' : 'Step 2 of 2 — Your profile'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Organization name</label>
                <input
                  {...register('orgName')}
                  type="text"
                  placeholder="Acme Corp"
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
                />
                {errors.orgName && <p className="mt-1 text-xs text-red-500">{errors.orgName.message}</p>}
                {slug && (
                  <p className="mt-1 text-xs text-gray-500">
                    Your workspace URL: <span className="text-[#6366f1]">taskflow.app/org/{slug}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full h-10 mt-2 flex justify-center items-center rounded-md bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium transition-colors"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Full name</label>
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="Jane Smith"
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Confirm password</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              {authError && <p className="text-sm text-red-500">{authError}</p>}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-10 flex justify-center items-center rounded-md border border-[#2d3240] text-gray-300 hover:bg-[#2d3240] font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-10 flex justify-center items-center rounded-md bg-[#1a7a5e] hover:bg-[#14604a] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                  ) : (
                    'Create workspace'
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6366f1] hover:text-[#818cf8] font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;