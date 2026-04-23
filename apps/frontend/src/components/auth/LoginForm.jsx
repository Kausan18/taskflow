import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth.js';
import { Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email({ message: 'Valid email is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const LoginForm = () => {
  const { login } = useAuth();
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setAuthError('');
    setIsLoading(true);
    try {
      await login(data.email, data.password);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
            // shadcn-style Input equivalent
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
            className="flex h-10 w-full rounded-md border border-[#2d3240] bg-[#1a1d23] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
            // shadcn-style Input equivalent
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
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
            'Sign in'
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2d3240]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[#1e2128] px-2 text-gray-400">Or</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          className="w-full flex justify-center items-center h-10 rounded-md border border-[#2d3240] bg-transparent text-gray-300 hover:bg-[#2d3240] font-medium transition-colors disabled:opacity-50"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#6366f1] hover:text-[#818cf8] font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};
