import { useAuthStore } from '../context/AuthContext';

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    setAuth,
    logout,
  };
};
