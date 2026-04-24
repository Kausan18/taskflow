import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../hooks/useAuth.js';
import { Link } from 'react-router-dom';

const registerSchema = z.object({
  orgName:  z.string().min(1, { message: 'Organization name is required' }),
  fullName: z.string().min(1, { message: 'Full name is required' }),
  email:    z.string().email({ message: 'Valid email is required' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const RegisterPage = () => {
  const { register: registerAction } = useAuth();
  const [authError, setAuthError]   = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [step, setStep]             = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });

  const orgName = watch('orgName', '');
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Validate step 1 fields before advancing
  const handleContinue = async () => {
    const valid = await trigger('orgName');
    if (valid) setStep(2);
  };

  const onSubmit = async (data) => {
    setAuthError('');
    setIsLoading(true);
    try {
      await registerAction(data.orgName, data.fullName, data.email, data.password);
    } catch (err) {
      // Show the actual server error message (e.g. "Email already registered")
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed. Please try again.';
      setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] disabled:opacity-50 transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13161c] px-4">
      <div className="w-full max-w-md bg-[#1e2128] border border-[#2d3240] rounded-xl p-8 shadow-2xl animate-fade-in">

        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[#6366f1] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
            ✦
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">TaskFlow</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-10 bg-[#6366f1]' : 'w-6 bg-[#6366f1]/60'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-10 bg-[#6366f1]' : 'w-6 bg-[#2d3240]'}`} />
        </div>

        <h1 className="text-xl font-semibold text-white text-center mb-1">
          {step === 1 ? 'Create your workspace' : 'Your account details'}
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          {step === 1 ? 'Step 1 of 2 — Organisation' : 'Step 2 of 2 — Your profile'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1.5">
                  Organization name
                </label>
                <input
                  {...register('orgName')}
                  type="text"
                  placeholder="Acme Corp"
                  disabled={isLoading}
                  className={inputClass}
                  autoFocus
                />
                {errors.orgName && (
                  <p className="mt-1 text-xs text-red-400">{errors.orgName.message}</p>
                )}
                {slug && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Workspace URL:{' '}
                    <span className="text-[#6366f1] font-medium">taskflow.app/org/{slug}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleContinue}
                className="w-full h-10 mt-2 flex justify-center items-center rounded-md bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium transition-colors shadow-sm shadow-indigo-500/20"
              >
                Continue →
              </button>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1.5">Full name</label>
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="Jane Smith"
                  disabled={isLoading}
                  className={inputClass}
                  autoFocus
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1.5">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className={inputClass}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1.5">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Min. 8 characters"
                  disabled={isLoading}
                  className={inputClass}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1.5">
                  Confirm password
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={inputClass}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* API error message */}
              {authError && (
                <div className="flex items-start space-x-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                  <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">{authError}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1 h-10 flex justify-center items-center rounded-md border border-[#2d3240] text-gray-300 hover:bg-[#2d3240] font-medium transition-colors disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-10 flex justify-center items-center rounded-md bg-[#1a7a5e] hover:bg-[#14604a] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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
            <Link to="/login" className="text-[#6366f1] hover:text-[#818cf8] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;