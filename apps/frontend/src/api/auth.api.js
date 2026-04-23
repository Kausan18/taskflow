// apps/frontend/src/api/auth.api.js
// FIX: register() was missing the `name` (fullName) parameter.
// The backend expects { orgName, name, email, password } — name was never sent.

import axiosClient from './axiosClient.js';

/**
 * Log in a user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{accessToken: string, user: Object}>}
 */
export const login = async (email, password) => {
  const response = await axiosClient.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Register a new user and organization
 * @param {string} orgName
 * @param {string} name      - FIX: was missing, backend requires this field
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{accessToken: string, user: Object}>}
 */
export const register = async (orgName, name, email, password) => {
  const response = await axiosClient.post('/auth/register', { orgName, name, email, password });
  return response.data;
};

/**
 * Log out a user
 * @returns {Promise<Object>}
 */
export const logout = async () => {
  const response = await axiosClient.post('/auth/logout');
  return response.data;
};

/**
 * Refresh the access token using the HTTP-only refresh cookie
 * @returns {Promise<{accessToken: string}>}
 */
export const refreshToken = async () => {
  const response = await axiosClient.post('/auth/refresh', {}, { withCredentials: true });
  return response.data;
};