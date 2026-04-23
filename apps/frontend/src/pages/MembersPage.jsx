import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { useAuth } from '../hooks/useAuth.js';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../stores/authStore.js';

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

const inviteSchema = z.object({
  email: z.string().email('Valid email address required'),
  role: z.enum(['Admin', 'Member'])
});

export const MembersPage = () => {
  const { isAdmin } = useAuth();
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: rawMembers, isLoading: isMembersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => axiosClient.get('/org/members').then(res => res.data),
    enabled: isAdmin,
  });

  const { data: rawInvites, isLoading: isInvitesLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: () => axiosClient.get('/org/invites').then(res => res.data),
    enabled: isAdmin,
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }) => axiosClient.patch(`/org/members/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      showToast('Member role updated');
    },
    onError: () => showToast('Failed to update role', 'error'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (id) => axiosClient.delete(`/org/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      showToast('Member removed');
    },
    onError: () => showToast('Failed to remove member', 'error'),
  });

  const inviteMutation = useMutation({
    mutationFn: (data) => axiosClient.post('/org/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      showToast('Invite sent successfully');
      setIsInviteModalOpen(false);
    },
    onError: () => showToast('Failed to send invite', 'error'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => axiosClient.delete(`/org/invites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      showToast('Invite revoked');
    },
    onError: () => showToast('Failed to revoke invite', 'error'),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'Member' }
  });

  if (!isAdmin && isAdmin !== undefined) {
    return <Navigate to="/tasks" replace />;
  }

  const members = Array.isArray(rawMembers) ? rawMembers : (rawMembers?.data || []);
  const invites = Array.isArray(rawInvites) ? rawInvites : (rawInvites?.data || []);

  const handleToggleRole = (member) => {
    const newRole = member.role === 'Admin' ? 'Member' : 'Admin';
    if (newRole === 'Admin') {
      if (!window.confirm(`Are you sure you want to promote ${member.name || member.email} to Admin?`)) return;
    }
    changeRoleMutation.mutate({ id: member.id, role: newRole });
  };

  const handleRemove = (member) => {
    if (window.confirm(`Are you sure you want to remove ${member.name || member.email} from the organization?`)) {
      removeMemberMutation.mutate(member.id);
    }
  };

  const onInviteSubmit = (data) => {
    inviteMutation.mutate(data);
  };

  const openInviteModal = () => {
    reset();
    setIsInviteModalOpen(true);
  };

  return (
    <PageWrapper
      title="Members"
      onNewTask={openInviteModal} // We reuse the Topbar '+' button to trigger invite
    >
      <div className="flex flex-col h-full w-full bg-[#13161c] p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Organization Members</h2>
          <button 
            onClick={openInviteModal}
             // explicitly added incase Topbar plus button isn't verbose enough
            className="bg-[#1e2128] border border-[#2d3240] text-gray-300 hover:text-white hover:bg-[#242830] transition-colors px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 shadow-sm"
          >
            <span>+</span>
            <span>Invite member</span>
          </button>
        </div>

        {/* MEMBERS TABLE */}
        <div className="bg-[#1e2128] border border-[#2d3240] rounded-xl overflow-hidden min-w-[800px] shadow-sm">
           <table className="w-full text-left text-sm whitespace-nowrap text-gray-300">
             <thead className="bg-[#1a1d23] border-b border-[#2d3240]">
               <tr>
                  <th className="px-5 py-4 font-medium text-gray-400">Member</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Email</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Role</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Joined</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Tasks</th>
                  <th className="px-5 py-4 font-medium text-gray-400 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[#2d3240]">
                {isMembersLoading ? (
                   [...Array(3)].map((_, i) => (
                     <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-4 bg-[#242830] rounded w-32"></div></td>
                        <td className="px-5 py-4"><div className="h-4 bg-[#242830] rounded w-40"></div></td>
                        <td className="px-5 py-4"><div className="h-4 bg-[#242830] rounded w-16"></div></td>
                        <td className="px-5 py-4"><div className="h-4 bg-[#242830] rounded w-20"></div></td>
                        <td className="px-5 py-4"><div className="h-4 bg-[#242830] rounded w-10"></div></td>
                        <td className="px-5 py-4"></td>
                     </tr>
                   ))
                ) : members.length === 0 ? (
                   <tr>
                      <td colSpan="6" className="px-5 py-8 text-center text-gray-500">
                         No members in this org yet.
                      </td>
                   </tr>
                ) : members.map(member => {
                   const isSelf = String(member.id) === String(user?.id);
                   
                   return (
                     <tr key={member.id} className="hover:bg-[#242830]/50 transition-colors">
                        <td className="px-5 py-3">
                           <div className="flex items-center space-x-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 ${getAvatarColor(member.name || member.email)}`}>
                               {getInitials(member.name || member.email)}
                             </div>
                             <span className="font-medium text-white">{member.name || 'Unknown'} {isSelf && <span className="text-gray-500 text-xs font-normal ml-1">(you)</span>}</span>
                           </div>
                        </td>
                        <td className="px-5 py-3 text-gray-400">{member.email}</td>
                        <td className="px-5 py-3">
                           <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${member.role === 'Admin' ? 'bg-[#6366f1]/20 text-[#818cf8] border-[#6366f1]/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                             {member.role || 'Member'}
                           </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                           {member.joinedAt || member.createdAt ? new Date(member.joinedAt || member.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-5 py-3 text-gray-400 font-medium">
                           {member.taskCount ?? '-'}
                        </td>
                        <td className="px-5 py-3 text-right space-x-3">
                           <button 
                             onClick={() => handleToggleRole(member)} 
                             disabled={isSelf || changeRoleMutation.isPending}
                             className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                           >
                             Change role
                           </button>
                           <button 
                             onClick={() => handleRemove(member)} 
                             disabled={isSelf || removeMemberMutation.isPending}
                             className="text-xs font-medium text-red-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                           >
                             Remove
                           </button>
                        </td>
                     </tr>
                   );
                })}
             </tbody>
           </table>
        </div>
      </div>

      {/* INVITE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-[#1e2128] rounded-xl shadow-2xl w-full max-w-lg border border-[#2d3240] overflow-hidden flex flex-col max-h-[90vh]">
             <div className="px-6 py-4 border-b border-[#2d3240] flex items-center justify-between bg-[#1a1d23]">
                <h2 className="text-xl font-semibold text-white">Invite a member</h2>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
             </div>

             <div className="p-6 overflow-y-auto">
                <form id="invite-form" onSubmit={handleSubmit(onInviteSubmit)} className="space-y-5">
                   <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
                      <input
                        type="email"
                        {...register('email')}
                        className="w-full bg-[#1a1d23] border border-[#2d3240] rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none"
                        placeholder="colleague@example.com"
                      />
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                      <div className="flex space-x-4">
                         <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" value="Member" {...register('role')} className="accent-[#6366f1] w-4 h-4" />
                            <span className="text-sm text-gray-300">Member</span>
                         </label>
                         <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" value="Admin" {...register('role')} className="accent-[#6366f1] w-4 h-4" />
                            <span className="text-sm text-gray-300">Admin</span>
                         </label>
                      </div>
                   </div>
                </form>

                {/* Pending Invites List */}
                {!isInvitesLoading && invites.length > 0 && (
                   <div className="mt-8 pt-6 border-t border-[#2d3240]">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Pending Invites ({invites.length})</h3>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                         {invites.map(invite => (
                           <div key={invite.id} className="flex flex-wrap gap-2 items-center justify-between bg-[#242830]/50 p-2.5 rounded-lg border border-[#2d3240]">
                              <div>
                                 <p className="text-sm text-gray-300 font-medium">{invite.email}</p>
                                 <p className="text-xs text-gray-500">Sent {new Date(invite.createdAt).toLocaleDateString()} &middot; {invite.role}</p>
                              </div>
                              <button 
                                onClick={() => revokeMutation.mutate(invite.id)}
                                disabled={revokeMutation.isPending}
                                className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                              >
                                {revokeMutation.isPending ? 'Revoking...' : 'Revoke'}
                              </button>
                           </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>

             <div className="px-6 py-4 border-t border-[#2d3240] flex justify-end space-x-3 bg-[#1a1d23]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 border border-[#2d3240] text-gray-300 rounded-md hover:bg-[#2d3240] transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  form="invite-form"
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="px-4 py-2 bg-[#1a7a5e] text-white rounded-md hover:bg-[#14604a] transition-colors flex items-center text-sm font-medium disabled:opacity-50"
                >
                  {inviteMutation.isPending ? 'Sending...' : 'Send invite'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg border z-[60] flex items-center space-x-3 transform transition-all duration-300 ${
          toast.type === 'error' ? 'bg-[#1e1414] border-red-500/30 text-red-200' : 'bg-[#141e1a] border-[#1a7a5e]/50 text-green-200'
        }`}>
           {toast.type === 'error' ? (
             <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           ) : (
             <svg className="w-5 h-5 text-[#1a7a5e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
             </svg>
           )}
           <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </PageWrapper>
  );
};
