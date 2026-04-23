import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth.js';
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

export const RegisterForm = () => {
  const { register: registerAction } = useAuth();
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setAuthError('');
    setIsLoading(true);
    try {
      await registerAction(data.orgName, data.email, data.password);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Organization name</label>
          <input
            {...register('orgName')}
            type="text"
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
          />
          {errors.orgName && <p className="mt-1 text-xs text-red-500">{errors.orgName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Full name</label>
          <input
            {...register('fullName')}
            type="text"
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
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        {authError && <p className="text-sm text-red-500">{authError}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-2 flex justify-center items-center rounded-md bg-[#1a7a5e] hover:bg-[#14604a] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};
