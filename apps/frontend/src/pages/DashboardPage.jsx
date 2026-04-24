import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useTaskList } from '../hooks/useTasks.js';
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

function formatRelativeTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export const DashboardPage = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();

  const { data: rawTasks, isLoading: isTasksLoading } = useTaskList({});
  const { data: rawMembers, isLoading: isMembersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => axiosClient.get('/org/members').then(res => res.data),
    enabled: !!isAdmin,
  });
  const { data: rawAuditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ['audit-logs-recent'],
    queryFn: () => axiosClient.get('/audit-logs?limit=20').then(res => res.data),
    enabled: !!isAdmin,
  });

  // Wait for auth to settle before redirecting
  if (!authLoading && !isAdmin) {
    return <Navigate to="/tasks" replace />;
  }

  const tasks = Array.isArray(rawTasks) ? rawTasks : (rawTasks?.data || []);
  const members = Array.isArray(rawMembers) ? rawMembers : (rawMembers?.data || []);
  const auditLogs = Array.isArray(rawAuditLogs) ? rawAuditLogs : (rawAuditLogs?.data || []);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const donePercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter(t => t.isOverdue || (t.dueDate && new Date(t.dueDate) < new Date())).length;
  const totalMembers = members.length;

  const barData = [
    { name: 'To do',    count: tasks.filter(t => t.status === 'To do').length,       fill: '#9ca3af' },
    { name: 'In prog',  count: tasks.filter(t => t.status === 'In progress').length,  fill: '#8b5cf6' },
    { name: 'Review',   count: tasks.filter(t => t.status === 'In review').length,    fill: '#3b82f6' },
    { name: 'Done',     count: tasks.filter(t => t.status === 'Done').length,         fill: '#10b981' },
  ];

  const pieData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'High').length, fill: '#ef4444' },
    { name: 'Med',  value: tasks.filter(t => t.priority === 'Med').length,  fill: '#eab308' },
    { name: 'Low',  value: tasks.filter(t => t.priority === 'Low').length,  fill: '#6b7280' },
  ].filter(d => d.value > 0);

  const memberProgress = members.map(m => {
    const memberTasks = tasks.filter(t => t.assignee?.id === m.id || String(t.assigneeId) === String(m.id));
    const done  = memberTasks.filter(t => t.status === 'Done').length;
    const total = memberTasks.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...m, done, total, percent };
  }).sort((a, b) => b.done - a.done);

  const formatAction = (action) => {
    if (!action) return <span className="text-gray-400">interacted with</span>;
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('register')) return <span className="text-green-400 font-medium">{action}</span>;
    if (act.includes('delete') || act.includes('remove'))   return <span className="text-red-400 font-medium">{action}</span>;
    return <span className="text-blue-400 font-medium">{action}</span>;
  };

  const isLoading = isTasksLoading || isMembersLoading || isAuditLoading || authLoading;

  return (
    <PageWrapper title="Dashboard">
      <div className="p-6 h-full flex flex-col xl:flex-row gap-6 bg-[#13161c] overflow-y-auto w-full">

        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col space-y-6 xl:w-3/5 min-w-0">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tasks',  value: totalTasks,    color: 'text-white' },
              { label: 'Completed',    value: `${doneTasks}`, sub: `${donePercent}%`, color: 'text-green-400', subColor: 'text-green-500/80' },
              { label: 'Overdue',      value: overdueTasks,   icon: overdueTasks > 0 ? '⚠' : null, color: 'text-red-500' },
              { label: 'Members',      value: totalMembers,  color: 'text-white' },
            ].map(({ label, value, sub, icon, color, subColor }) => (
              <div key={label} className="bg-[#1e2128] rounded-xl p-4 border border-[#2d3240]">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">{label}</span>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-bold ${color}`}>{isLoading ? '–' : value}</span>
                  {!isLoading && sub  && <span className={`text-sm font-medium ${subColor}`}>{sub}</span>}
                  {!isLoading && icon && <span className="text-sm text-red-500">{icon}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1e2128] rounded-xl p-5 border border-[#2d3240]">
              <h3 className="text-sm font-semibold text-white mb-4">Tasks by Status</h3>
              <div className="h-[200px] w-full">
                {isLoading ? (
                  <div className="w-full h-full animate-pulse bg-[#242830] rounded-md" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={barData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} width={70} />
                      <Tooltip cursor={{ fill: '#2d3240' }} contentStyle={{ backgroundColor: '#1e2128', borderColor: '#2d3240', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                        {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-[#1e2128] rounded-xl p-5 border border-[#2d3240]">
              <h3 className="text-sm font-semibold text-white mb-4">Tasks by Priority</h3>
              <div className="h-[200px] w-full">
                {isLoading ? (
                  <div className="w-full h-full animate-pulse bg-[#242830] rounded-md" />
                ) : pieData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e2128', borderColor: '#2d3240', borderRadius: '8px', color: '#fff' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Member Productivity */}
          <div className="bg-[#1e2128] rounded-xl p-5 border border-[#2d3240]">
            <h3 className="text-sm font-semibold text-white mb-4">Member Productivity</h3>
            {isLoading ? (
              <div className="space-y-4 pt-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse bg-[#242830] rounded-md" />)}
              </div>
            ) : memberProgress.length === 0 ? (
              <p className="text-sm text-gray-500">No members found.</p>
            ) : (
              <div className="space-y-5 overflow-y-auto max-h-64 pr-1">
                {memberProgress.map(m => (
                  <div key={m.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 ${getAvatarColor(m.name)}`} title={m.name}>
                      {getInitials(m.name)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between mb-1 text-sm font-medium">
                        <span className="text-gray-200">{m.name}</span>
                        <span className="text-gray-400 text-xs">{m.done} / {m.total} done</span>
                      </div>
                      <div className="w-full bg-[#13161c] rounded-full h-1.5 border border-[#2d3240]">
                        <div className="bg-[#1a7a5e] h-1.5 rounded-full transition-all duration-500" style={{ width: `${m.percent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Activity Feed */}
        <div className="xl:w-2/5 flex flex-col min-h-[400px]">
          <div className="bg-[#1e2128] rounded-xl border border-[#2d3240] flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-[#2d3240] flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-white">Recent activity</h3>
              <Link to="/audit-log" className="text-xs text-[#6366f1] hover:text-[#818cf8] font-medium transition-colors">View all →</Link>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full animate-pulse bg-[#242830] shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-[#242830] rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-[#242830] rounded w-1/4 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">No recent activity.</p>
              ) : (
                <div className="space-y-5">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex items-start space-x-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0 ${getAvatarColor(log.user?.name || '')}`}>
                        {getInitials(log.user?.name || 'S')}
                      </div>
                      <div className="flex-1 min-w-0 bg-[#13161c] rounded-lg p-3 border border-[#2d3240]">
                        <p className="text-sm text-gray-300 leading-relaxed break-words">
                          <span className="font-medium text-white">{log.user?.name || 'System'}</span>{' '}
                          {formatAction(log.action)}{' '}
                          <span className="text-gray-400">{log.entityType} #{log.entityId?.slice(0, 8)}</span>
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">{formatRelativeTime(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </PageWrapper>
  );
};

export default DashboardPage;