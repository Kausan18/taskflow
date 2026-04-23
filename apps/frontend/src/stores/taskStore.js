import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useTaskStore = create(
  immer((set) => ({
    tasks: [],
    filters: {
      status: '',
      priority: '',
      assigneeId: ''
    },
    viewMode: 'kanban', // 'kanban' | 'list'

    setTasks: (tasks) => 
      set((state) => {
        state.tasks = tasks;
      }),

    upsertTask: (task) => 
      set((state) => {
        const index = state.tasks.findIndex((t) => t.id === task.id);
        if (index !== -1) {
          state.tasks[index] = task;
        } else {
          state.tasks.push(task);
        }
      }),

    removeTask: (id) => 
      set((state) => {
        const index = state.tasks.findIndex((t) => t.id === id);
        if (index !== -1) {
          state.tasks.splice(index, 1);
        }
      }),

    setFilter: (key, value) => 
      set((state) => {
        state.filters[key] = value;
      }),

    setViewMode: (mode) => 
      set((state) => {
        state.viewMode = mode;
      })
  }))
);
