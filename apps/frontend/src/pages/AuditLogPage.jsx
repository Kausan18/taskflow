import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { useAuth } from '../hooks/useAuth.js';
import axiosClient from '../api/axiosClient.js';

const getInitials = (name) => {
  if (!name) return 'U';
  const split = name.split(' ').filter(Boolean);
  if (split.length === 1) return split[0].substring(0, 2).toUpperCase();
  return (split[0][0] + split[split.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name = '') => {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatTimestamp = (dateString) => {
   const d = new Date(dateString);
   return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
   }).replace(',', ' ·').replace(' AM', ' AM').replace(' PM', ' PM');
};

const DiffViewer = ({ before, after }) => {
  const [expanded, setExpanded] = useState(false);
  const parsedBefore = typeof before === 'string' ? JSON.parse(before) : before;
  const parsedAfter = typeof after === 'string' ? JSON.parse(after) : after;
  
  if (!parsedBefore && !parsedAfter) return <span className="text-gray-500">-</span>;
  
  const allKeys = new Set([...Object.keys(parsedBefore || {}), ...Object.keys(parsedAfter || {})]);
  const diffs = Array.from(allKeys).filter(key => {
     if (key === 'updatedAt' || key === 'updated_at' || key === 'id') return false;
     return parsedBefore?.[key] !== parsedAfter?.[key];
  }).map(key => ({
     key,
     oldVal: parsedBefore?.[key] === null || parsedBefore?.[key] === undefined ? 'None' : String(parsedBefore?.[key]),
     newVal: parsedAfter?.[key] === null || parsedAfter?.[key] === undefined ? 'None' : String(parsedAfter?.[key])
  }));

  if (diffs.length === 0) return <span className="text-gray-500 text-xs shadow-none">No content changes</span>;

  const visibleDiffs = expanded ? diffs : diffs.slice(0, 2);
  const hiddenCount = diffs.length - visibleDiffs.length;

  return (
    <div className="flex flex-col space-y-1 max-w-[250px]">
      {visibleDiffs.map(d => (
         <div key={d.key} className="text-[11px] text-gray-400 font-mono tracking-tight truncate" title={`${d.key}: ${d.oldVal} -> ${d.newVal}`}>
           <span className="font-semibold text-gray-300">{d.key}:</span>{' '}
           <span className="line-through opacity-70">{d.oldVal}</span>{' '}
           <span className="text-white mx-1">&rarr;</span>{' '}
           <span className="text-white font-medium">{d.newVal}</span>
         </div>
      ))}
      {hiddenCount > 0 && !expanded && (
         <button onClick={() => setExpanded(true)} className="text-[10px] text-[#6366f1] hover:text-[#818cf8] mt-1 text-left inline-block w-fit focus:outline-none">
           +{hiddenCount} more
         </button>
      )}
      {expanded && diffs.length > 2 && (
         <button onClick={() => setExpanded(false)} className="text-[10px] text-[#6366f1] hover:text-[#818cf8] mt-1 text-left inline-block w-fit focus:outline-none">
           Show less
         </button>
      )}
    </div>
  );
};

export const AuditLogPage = () => {
  const { isAdmin } = useAuth();
  
  const [page, setPage] = useState(1);
  const limit = 25;
  
  const [filters, setFilters] = useState({
     dateFrom: '',
     dateTo: '',
     actorId: '',
     action: '',
     entityType: ''
  });

  const { data: membersObj } = useQuery({
     queryKey: ['members-dropdown'],
     queryFn: () => axiosClient.get('/org/members').then(res => res.data),
     enabled: isAdmin
  });
  const members = Array.isArray(membersObj) ? membersObj : (membersObj?.data || []);

  const { data: rawLogs, isLoading, isFetching } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.actorId) params.append('actorId', filters.actorId);
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      
      return axiosClient.get(`/audit-logs?${params.toString()}`).then(res => res.data);
    },
    enabled: isAdmin,
    placeholderData: (previousData) => previousData, // keepPreviousData
  });

  if (!isAdmin && isAdmin !== undefined) {
    return <Navigate to="/tasks" replace />;
  }

  const logs = Array.isArray(rawLogs) ? rawLogs : (rawLogs?.data || []);
  const total = rawLogs?.total || (logs.length === limit ? page * limit + 1 : (page - 1) * limit + logs.length);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleFilterChange = (key, value) => {
     setFilters(prev => ({ ...prev, [key]: value }));
     setPage(1); // reset to page 1 on filter
  };

  const exportCsv = () => {
     if (!logs.length) return;
     const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Entity ID', 'IP Address'];
     const rows = logs.map(log => [
        new Date(log.createdAt).toISOString(),
        log.user?.name || log.userName || 'System',
        log.action,
        log.entityType,
        log.targetId,
        log.ipAddress || ''
     ]);
     const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
         + headers.join(',') + '\n' 
         + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
         
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const renderBadge = (action) => {
     const act = (action || '').toLowerCase();
     if (act.includes('create') || act === 'post') {
        return <span className="px-2 py-0.5 text-xs font-semibold rounded border bg-green-500/20 text-green-400 border-green-500/30 capitalize">{action}</span>;
     }
     if (act.includes('delete') || act.includes('remove')) {
        return <span className="px-2 py-0.5 text-xs font-semibold rounded border bg-red-500/20 text-red-400 border-red-500/30 capitalize">{action}</span>;
     }
     return <span className="px-2 py-0.5 text-xs font-semibold rounded border bg-blue-500/20 text-blue-400 border-blue-500/30 capitalize">{action}</span>;
  };

  return (
    <PageWrapper title="Audit log">
      <div className="flex flex-col h-full w-full bg-[#13161c]">
        
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#2d3240] bg-[#1a1d23] shrink-0">
           <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 border-r border-[#2d3240] pr-3">
                  <span className="text-xs text-gray-400">Date from:</span>
                  <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} className="bg-[#1e2128] border border-[#2d3240] text-gray-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-[#6366f1]" />
                  <span className="text-xs text-gray-400">to</span>
                  <input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} className="bg-[#1e2128] border border-[#2d3240] text-gray-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-[#6366f1]" />
              </div>
              
              <select value={filters.actorId} onChange={e => handleFilterChange('actorId', e.target.value)} className="bg-[#1e2128] border border-[#2d3240] text-gray-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-[#6366f1]">
                 <option value="">All members</option>
                 {members.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
              </select>

              <select value={filters.action} onChange={e => handleFilterChange('action', e.target.value)} className="bg-[#1e2128] border border-[#2d3240] text-gray-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-[#6366f1]">
                 <option value="">All actions</option>
                 <option value="created">Created</option>
                 <option value="updated">Updated</option>
                 <option value="deleted">Deleted</option>
              </select>

              <select value={filters.entityType} onChange={e => handleFilterChange('entityType', e.target.value)} className="bg-[#1e2128] border border-[#2d3240] text-gray-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-[#6366f1]">
                 <option value="">All entities</option>
                 <option value="task">Task</option>
                 <option value="member">Member</option>
                 <option value="role">Role</option>
                 <option value="invite">Invite</option>
              </select>

              {(filters.dateFrom || filters.dateTo || filters.actorId || filters.action || filters.entityType) && (
                 <button onClick={() => setFilters({ dateFrom: '', dateTo: '', actorId: '', action: '', entityType: '' })} className="text-xs text-[#6366f1] hover:text-[#818cf8] font-medium ml-2 focus:outline-none">
                   Clear
                 </button>
              )}
           </div>

           <button 
             onClick={exportCsv}
             disabled={logs.length === 0}
             className="px-3 py-1.5 border border-[#2d3240] text-gray-300 text-xs font-medium rounded-md hover:bg-[#2d3240] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
           >
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
             <span>Export CSV</span>
           </button>
        </div>

        {/* Audit Table Area */}
        <div className="flex-1 overflow-auto p-6 relative">
          <div className="bg-[#1e2128] border border-[#2d3240] rounded-xl overflow-hidden min-w-[1000px] shadow-sm">
             <table className="w-full text-left text-sm whitespace-nowrap text-gray-300">
               <thead className="bg-[#1a1d23] border-b border-[#2d3240]">
                 <tr>
                    <th className="px-5 py-4 font-medium text-gray-400">Timestamp</th>
                    <th className="px-5 py-4 font-medium text-gray-400">Actor</th>
                    <th className="px-5 py-4 font-medium text-gray-400">Action</th>
                    <th className="px-5 py-4 font-medium text-gray-400">Entity</th>
                    <th className="px-5 py-4 font-medium text-gray-400">Changes</th>
                    <th className="px-5 py-4 font-medium text-gray-400">IP Address</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#2d3240]">
                  {isLoading ? (
                     [...Array(5)].map((_, i) => (
                       <tr key={i} className="animate-pulse">
                          <td className="px-5 py-4"><div className="h-4 bg-[#242830] rounded w-32"></div></td>
                          <td className="px-5 py-4">
                             <div className="flex items-center space-x-2">
                               <div className="w-6 h-6 rounded-full bg-[#242830]"></div>
                               <div className="h-4 bg-[#242830] rounded w-24"></div>
                             </div>
                          </td>
                          <td className="px-5 py-4"><div className="h-5 bg-[#242830] rounded w-16"></div></td>
                          <td className="px-5 py-4"><div className="h-4 bg-[#242830] rounded w-32"></div></td>
                          <td className="px-5 py-4"><div className="h-4 bg-[#242830] rounded w-48"></div></td>
                          <td className="px-5 py-4"><div className="h-4 bg-[#242830] rounded w-24"></div></td>
                       </tr>
                     ))
                  ) : logs.length === 0 ? (
                     <tr>
                        <td colSpan="6" className="px-5 py-12 text-center">
                           <div className="flex flex-col items-center justify-center text-gray-400">
                             <svg className="w-10 h-10 text-[#2d3240] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                             </svg>
                             <p className="text-sm font-medium">No audit events yet.</p>
                             <p className="text-xs mt-1">Actions on tasks and members will appear here.</p>
                           </div>
                        </td>
                     </tr>
                  ) : logs.map(log => (
                     <tr key={log.id} className={`hover:bg-[#242830]/50 transition-colors ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                        <td className="px-5 py-3 text-xs font-medium text-gray-400">
                           {formatTimestamp(log.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                           <div className="flex items-center space-x-2">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0 ${getAvatarColor(log.user?.name || log.userName)}`}>
                               {getInitials(log.user?.name || log.userName || 'S')}
                             </div>
                             <span className="font-medium text-gray-300 text-xs">{log.user?.name || log.userName || 'System'}</span>
                           </div>
                        </td>
                        <td className="px-5 py-3">
                           {renderBadge(log.action)}
                        </td>
                        <td className="px-5 py-3">
                           <div className="flex flex-col text-xs">
                              <span className="text-gray-400 capitalize">{log.entityType || 'Task'}</span>
                              <span className="text-white font-medium truncate max-w-[200px]" title={log.targetName || `ID: ${log.targetId}`}>
                                 {log.targetName || `ID: ${log.targetId}`}
                              </span>
                           </div>
                        </td>
                        <td className="px-5 py-3">
                           <DiffViewer before={log.beforeSnapshot} after={log.afterSnapshot} />
                        </td>
                        <td className="px-5 py-3 text-[11px] font-mono text-gray-500">
                           {log.ipAddress || '127.0.0.1'}
                        </td>
                     </tr>
                  ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Pagination Info Footer (matches summary bar style) */}
        <div className="bg-[#1e2128] border-t border-[#2d3240] px-6 py-3 flex items-center justify-between shrink-0 shadow-lg select-none">
           <div className="text-xs text-gray-400">
              Showing <span className="font-medium text-white">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span>–<span className="font-medium text-white">{Math.min(page * limit, total)}</span> of <span className="font-medium text-white">{total > (page * limit) ? `${total}+` : total}</span> events
           </div>
           
           <div className="flex space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="px-3 py-1 bg-[#242830] border border-[#2d3240] text-gray-300 rounded text-xs hover:bg-[#2d3240] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 Previous
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages || logs.length < limit || isLoading}
                className="px-3 py-1 bg-[#242830] border border-[#2d3240] text-gray-300 rounded text-xs hover:bg-[#2d3240] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 Next
              </button>
           </div>
        </div>

      </div>
    </PageWrapper>
  );
};
