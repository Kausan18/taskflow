import axiosClient from './axiosClient.js';

/**
 * Get tasks with optional query parameters
 * @param {Object} params - Query params (status, priority, assigneeId, page, limit)
 * @returns {Promise<Object>}
 */
export const getTasks = async (params) => {
  const response = await axiosClient.get('/tasks', { params });
  return response.data;
};

/**
 * Get a single task by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export const getTask = async (id) => {
  const response = await axiosClient.get(`/tasks/${id}`);
  return response.data;
};

/**
 * Create a new task
 * @param {Object} data - Task data (title, description, status, priority, assigneeId, dueDate)
 * @returns {Promise<Object>}
 */
export const createTask = async (data) => {
  const response = await axiosClient.post('/tasks', data);
  return response.data;
};

/**
 * Update an existing task
 * @param {string} id 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export const updateTask = async (id, data) => {
  const response = await axiosClient.put(`/tasks/${id}`, data);
  return response.data;
};

/**
 * Update the status of a task
 * @param {string} id 
 * @param {string} status 
 * @returns {Promise<Object>}
 */
export const updateTaskStatus = async (id, status) => {
  const response = await axiosClient.patch(`/tasks/${id}/status`, { status });
  return response.data;
};

/**
 * Delete a task
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export const deleteTask = async (id) => {
  const response = await axiosClient.delete(`/tasks/${id}`);
  return response.data;
};
