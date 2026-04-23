import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

export const Sidebar = () => {
  const { user, isAdmin } = useAuth();

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
      {/* Logo Area */}
      <div className="flex items-center space-x-3 px-6 py-5 shrink-0">
        <div className="w-8 h-8 rounded-md bg-[#6366f1] flex items-center justify-center text-white font-bold">
          +
        </div>
        <span className="text-white font-semibold text-lg">TaskFlow</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Workspace
          </h3>
          <div className="space-y-1">
            <NavLink to="/tasks" className={navLinkClass}>
              Tasks
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/members" className={navLinkClass}>
              <span className="flex-1">Members</span>
              {/* Red dot badge for pending invites simulation */}
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            </NavLink>
          </div>
        </div>

        {isAdmin && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Admin
            </h3>
            <div className="space-y-1">
              <NavLink to="/audit-log" className={navLinkClass}>
                Audit log
              </NavLink>
              <NavLink to="/settings" className={navLinkClass}>
                Settings
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Area */}
      <div className="p-4 border-t border-[#2d3240] shrink-0">
        <div className="flex justify-start items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-white truncate">{user?.name || 'User'}</span>
            <span className="text-xs text-gray-400 capitalize truncate">{user?.role || 'Member'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
