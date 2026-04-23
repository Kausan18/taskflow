// apps/frontend/src/components/layout/Sidebar.jsx
// FIX: Removed unused `import React from 'react'` (Vite automatic JSX runtime)

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

export const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-3 py-2 mt-1 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#6366f1] text-white'
        : 'text-gray-400 hover:text-white hover:bg-[#2d3240]'
    }`;

  const getInitials = (name) => {
    if (!name) return 'U';
    const split = name.split(' ').filter(Boolean);
    if (split.length === 1) return split[0].substring(0, 2).toUpperCase();
    return (split[0][0] + split[split.length - 1][0]).toUpperCase();
  };

  return (
    <div className="w-60 bg-[#1e2128] h-full flex flex-col border-r border-[#2d3240] shrink-0">
      {/* Logo */}
      <div className="flex items-center space-x-3 px-6 py-5 shrink-0">
        <div className="w-8 h-8 rounded-md bg-[#6366f1] flex items-center justify-center text-white font-bold">
          +
        </div>
        <span className="text-white font-semibold text-lg">TaskFlow</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Workspace
          </h3>
          <div className="space-y-1">
            <NavLink to="/tasks" className={navLinkClass}>
              <svg className="w-4 h-4 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Tasks
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              <svg className="w-4 h-4 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </NavLink>
            <NavLink to="/members" className={navLinkClass}>
              <svg className="w-4 h-4 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="flex-1">Members</span>
            </NavLink>
          </div>
        </div>

        {/* Admin-only section */}
        {isAdmin && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Admin
            </h3>
            <div className="space-y-1">
              <NavLink to="/audit-log" className={navLinkClass}>
                <svg className="w-4 h-4 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit log
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* User footer */}
      <div className="p-4 border-t border-[#2d3240] shrink-0 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex flex-col truncate flex-1 min-w-0">
            <span className="text-sm font-medium text-white truncate">{user?.name || 'User'}</span>
            <span className="text-xs text-gray-400 capitalize truncate">{user?.role?.toLowerCase() || 'member'}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:text-red-400 hover:bg-[#2d3240] rounded-md transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};