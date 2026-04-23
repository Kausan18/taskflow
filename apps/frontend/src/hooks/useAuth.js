import { useNavigate } from 'react-router-dom';
import { useAuthStore, selectIsAdmin } from '../stores/authStore.js';
import * as authApi from '../api/auth.api.js';

export const useAuth = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAdmin = useAuthStore(selectIsAdmin);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logoutAction = useAuthStore((state) => state.logout);

  const login = async (email, password) => {
    const { accessToken: token, user: userData } = await authApi.login(email, password);
    setAuth(userData, token);
    navigate('/tasks');
  };

  // FIX: register now accepts fullName and forwards it to the API layer
  const register = async (orgName, fullName, email, password) => {
    const { accessToken: token, user: userData } = await authApi.register(orgName, fullName, email, password);
    setAuth(userData, token);
    navigate('/tasks');
  };

  const logout = async () => {
    await logoutAction();
    navigate('/login');
  };

  return {
    user,
    accessToken,
    isAdmin,
    isLoading,
    login,
    register,
    logout
  };
};
