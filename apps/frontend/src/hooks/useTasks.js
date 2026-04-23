import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from '../api/tasks.api.js';
import { useTaskStore } from '../stores/taskStore.js';

export const useTaskList = (filters) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.getTasks(filters),
  });
};

export const useTask = (id) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.getTask(id),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const upsertTask = useTaskStore((state) => state.upsertTask);

  return useMutation({
    mutationFn: (data) => tasksApi.createTask(data),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      upsertTask(newTask);
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const upsertTask = useTaskStore((state) => state.upsertTask);

  return useMutation({
    mutationFn: ({ id, data }) => tasksApi.updateTask(id, data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      upsertTask(updatedTask);
    },
  });
};

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();
  const upsertTask = useTaskStore((state) => state.upsertTask);

  return useMutation({
    mutationFn: ({ id, status }) => tasksApi.updateTaskStatus(id, status),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      upsertTask(updatedTask);
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const removeTask = useTaskStore((state) => state.removeTask);

  return useMutation({
    mutationFn: (id) => tasksApi.deleteTask(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      removeTask(deletedId);
    },
  });
};
