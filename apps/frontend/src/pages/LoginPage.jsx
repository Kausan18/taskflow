import React from 'react';
import { LoginForm } from '../components/auth/LoginForm.jsx';

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#13161c] text-white p-4">
      <div className="w-full max-w-md bg-[#1e2128] rounded-xl border border-[#2d3240] p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#6366f1] flex items-center justify-center text-white font-bold text-2xl mb-5 shadow-lg shadow-indigo-500/20">
            +
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TaskFlow</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to your workspace</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};
