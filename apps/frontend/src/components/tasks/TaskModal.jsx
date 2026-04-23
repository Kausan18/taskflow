// apps/frontend/src/components/tasks/TaskModal.jsx
// FIX: Removed unused `import React from 'react'` — only useEffect is needed

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks.js';

const taskSchema = z.object({
  title:       z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
  status:      z.enum(['To do', 'In progress', 'In review', 'Done']),
  priority:    z.enum(['High', 'Med', 'Low']),
  category:    z.string().optional(),
  assigneeId:  z.string().optional(),
  dueDate:     z.string().optional(),
});

export const TaskModal = ({ task, onClose }) => {
  const isEditMode = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title:       '',
      description: '',
      status:      'To do',
      priority:    'Low',
      category:    '',
      assigneeId:  '',
      dueDate:     '',
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title:       task.title || '',
        description: task.description || '',
        status:      task.status || 'To do',
        priority:    task.priority || 'Low',
        category:    task.category || '',
        assigneeId:  task.assignee?.id || task.assigneeId || '',
        dueDate:     task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
    } else {
      reset();
    }
  }, [task, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateTask.mutateAsync({ id: task.id, data });
      } else {
        await createTask.mutateAsync(data);
      }
      onClose();
    } catch (e) {
      console.error('Failed to save task', e);
    }
  };

  const handleDelete = async () => {
    if (!task || !window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      await deleteTask.mutateAsync(task.id);
      onClose();
    } catch (e) {
      console.error('Failed to delete task', e);
    }
  };

  const isSubmitting = createTask.isPending || updateTask.isPending;

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1e2128] rounded-xl shadow-2xl w-full max-w-2xl border border-[#2d3240] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2d3240] flex items-center justify-between bg-[#1a1d23]">
          <h2 className="text-lg font-semibold text-white">
            {isEditMode ? 'Edit task' : 'Create task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title <span className="text-red-400">*</span></label>
              <input
                {...register('title')}
                className="w-full bg-[#13161c] border border-[#2d3240] rounded-md px-3 py-2 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none text-sm"
                placeholder="What needs to be done?"
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full bg-[#13161c] border border-[#2d3240] rounded-md px-3 py-2 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none resize-none text-sm"
                placeholder="Add more details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full bg-[#13161c] border border-[#2d3240] rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none text-sm"
                >
                  <option value="To do">To do</option>
                  <option value="In progress">In progress</option>
                  <option value="In review">In review</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full bg-[#13161c] border border-[#2d3240] rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Med">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <select
                  {...register('category')}
                  className="w-full bg-[#13161c] border border-[#2d3240] rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none text-sm"
                >
                  <option value="">None</option>
                  <option value="Backend">Backend</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Security">Security</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Design">Design</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Due date</label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="w-full bg-[#13161c] border border-[#2d3240] rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Assignee ID</label>
                <input
                  type="text"
                  {...register('assigneeId')}
                  className="w-full bg-[#13161c] border border-[#2d3240] rounded-md px-3 py-2 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] outline-none text-sm"
                  placeholder="Paste user UUID (optional)"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2d3240] flex items-center justify-between bg-[#1a1d23]">
          {/* Delete — only in edit mode */}
          <div>
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleteTask.isPending ? 'Deleting...' : 'Delete task'}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#2d3240] text-gray-300 rounded-md hover:bg-[#2d3240] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              form="task-form"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#1a7a5e] text-white rounded-md hover:bg-[#14604a] transition-colors flex items-center text-sm font-medium disabled:opacity-50 min-w-[80px] justify-center"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              ) : (
                isEditMode ? 'Save changes' : 'Create task'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};