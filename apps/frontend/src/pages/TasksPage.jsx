import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { KanbanColumn } from '../components/tasks/KanbanColumn.jsx';
import { TaskFilters } from '../components/tasks/TaskFilters.jsx';
import { TaskModal } from '../components/tasks/TaskModal.jsx';
import { useTaskList, useUpdateStatus, useDeleteTask } from '../hooks/useTasks.js';
import { useSSE } from '../hooks/useSSE.js';
import { useTaskStore } from '../stores/taskStore.js';

export const TasksPage = () => {
  // Subscribe to real-time updates via Server-Sent Events
  useSSE();

  const { data: serverTasks, isLoading } = useTaskList({});
  const { mutate: updateStatus } = useUpdateStatus();
  const { mutate: deleteTask } = useDeleteTask();

  const tasks = useTaskStore(state => state.tasks);
  const setTasks = useTaskStore(state => state.setTasks);
  const filters = useTaskStore(state => state.filters);
  const viewMode = useTaskStore(state => state.viewMode);
  const setViewMode = useTaskStore(state => state.setViewMode);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Sync React Query cache with Zustand taskStore automatically
  useEffect(() => {
    if (serverTasks) {
      setTasks(Array.isArray(serverTasks) ? serverTasks : (serverTasks.data || []));
    }
  }, [serverTasks, setTasks]);

  // Client-side filtering
  const filteredTasks = tasks.filter(t => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assigneeId && t.assigneeId !== filters.assigneeId && String(t.assignee?.id) !== String(filters.assigneeId)) return false;
    return true;
  });

  const columns = ['To do', 'In progress', 'In review', 'Done'];
  const groupedTasks = columns.reduce((acc, col) => {
    acc[col] = filteredTasks.filter(t => t.status === col);
    return acc;
  }, {});

  const handleDrop = (taskId, newStatus) => {
    const task = tasks.find(t => String(t.id) === String(taskId));
    if (task && task.status !== newStatus) {
      updateStatus({ id: task.id, status: newStatus });
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(id);
    }
  };

  // Client-side sorting for List view
  const [sortField, setSortField] = useState('dueDate');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
     let valA = a[sortField] || '';
     let valB = b[sortField] || '';
     if (sortField === 'assignee') {
       valA = a.assignee?.name || '';
       valB = b.assignee?.name || '';
     }
     if (valA < valB) return sortAsc ? -1 : 1;
     if (valA > valB) return sortAsc ? 1 : -1;
     return 0;
  });

  const tabs = [
    { label: 'Kanban', value: 'kanban' },
    { label: 'List', value: 'list' },
    { label: 'Calendar*', value: 'calendar' },
    { label: 'Priority*', value: 'priority' },
    { label: 'Assignee*', value: 'assignee' },
  ];

  const overdueCount = tasks.filter(t => t.isOverdue || (t.dueDate && new Date(t.dueDate) < new Date())).length;
  const membersCount = new Set(tasks.map(t => t.assignee?.id || t.assigneeId).filter(Boolean)).size;

  return (
    <PageWrapper
      title="Tasks"
      tabs={tabs}
      activeTab={viewMode}
      onTabChange={(val) => {
        if (['kanban', 'list'].includes(val)) setViewMode(val);
      }}
      onNewTask={() => openCreateModal()}
    >
      <div className="flex flex-col h-full w-full bg-[#13161c]">
        {/* Top Filters Block */}
        <TaskFilters />

        {/* Dynamic Content Views */}
        <div className="flex-1 p-6 overflow-y-auto overflow-x-auto w-full relative">
          {isLoading ? (
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-[300px] flex-shrink-0 animate-pulse bg-[#1e2128] rounded-xl h-[400px] border border-[#2d3240]"></div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
               <div className="w-16 h-16 rounded-full bg-[#1e2128] flex items-center justify-center mb-4 border border-[#2d3240]">
                  <svg className="w-8 h-8 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
               </div>
               <p className="text-lg font-medium text-white">No tasks yet</p>
               <p className="text-sm mt-1">Create your first task to get started.</p>
               <button 
                 onClick={() => openCreateModal()} 
                 className="mt-6 bg-[#1a7a5e] text-white px-5 py-2.5 rounded-md hover:bg-[#14604a] text-sm font-medium transition-colors"
                >
                 + Create Task
               </button>
            </div>
          ) : viewMode === 'kanban' ? (
            <div className="flex gap-4 pb-4 items-start h-full">
              {columns.map(title => (
                <KanbanColumn
                  key={title}
                  title={title}
                  count={groupedTasks[title].length}
                  tasks={groupedTasks[title]}
                  onAddCard={() => openCreateModal()}
                  onDropHandler={handleDrop}
                  onTaskClick={openEditModal}
                />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-[#1e2128] border border-[#2d3240] rounded-xl overflow-hidden min-w-[800px]">
              <table className="w-full text-left text-sm whitespace-nowrap text-gray-300">
                 <thead className="bg-[#1a1d23] border-b border-[#2d3240]">
                   <tr>
                      <th className="px-4 py-3 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('title')}>Title</th>
                      <th className="px-4 py-3 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('priority')}>Priority</th>
                      <th className="px-4 py-3 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('category')}>Category</th>
                      <th className="px-4 py-3 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('assignee')}>Assignee</th>
                      <th className="px-4 py-3 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('dueDate')}>Due Date</th>
                      <th className="px-4 py-3 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>Status</th>
                      <th className="px-4 py-3 font-medium text-gray-400 w-16 text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#2d3240]">
                   {sortedTasks.map(task => (
                     <tr key={task.id} className="hover:bg-[#242830] transition-colors">
                       <td className="px-4 py-3 font-medium text-white cursor-pointer" onClick={() => openEditModal(task)}>
                          <span className="hover:text-[#6366f1] transition-colors">{task.title}</span>
                       </td>
                       <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                            task.priority === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            task.priority === 'Med' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>{task.priority}</span>
                       </td>
                       <td className="px-4 py-3">
                         {task.category && (
                           <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold rounded border border-indigo-500/30">
                             {task.category}
                           </span>
                         )}
                       </td>
                       <td className="px-4 py-3">{task.assignee?.name || 'Unassigned'}</td>
                       <td className={`px-4 py-3 ${task.isOverdue ? 'text-red-400 font-medium' : ''}`}>
                         {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                       </td>
                       <td className="px-4 py-3">
                         <span className="border border-[#2d3240] bg-[#1a1d23] px-2 py-1 rounded text-xs text-white">
                           {task.status}
                         </span>
                       </td>
                       <td className="px-4 py-3 flex items-center justify-center space-x-2">
                         <button onClick={() => openEditModal(task)} className="text-gray-400 hover:text-white p-1 transition-colors outline-none cursor-pointer">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                         </button>
                         <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-400 p-1 transition-colors outline-none cursor-pointer">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          ) : null}
        </div>
        
        {/* Fixed Summary Footer */}
        <div className="bg-[#1e2128] border-t border-[#2d3240] px-6 py-3 flex items-center justify-between text-xs font-medium shrink-0 shadow-lg">
           <div className="flex space-x-6 text-gray-400">
             <span>Total tasks: <span className="text-white ml-1">{tasks.length}</span></span>
             <span>Completed: <span className="text-[#1a7a5e] ml-1">{tasks.filter(t => t.status === 'Done').length}</span></span>
             <span>In progress: <span className="text-white ml-1">{tasks.filter(t => t.status === 'In progress').length}</span></span>
             <span>Overdue: <span className="text-red-400 ml-1">{overdueCount}</span></span>
           </div>
           <div className="text-gray-400">
              Members: <span className="text-white ml-1">{membersCount}</span>
           </div>
        </div>
      </div>

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </PageWrapper>
  );
};
