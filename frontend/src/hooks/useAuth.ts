import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const auth = useAuthStore();

  useEffect(() => {
    auth.loadUser();
  }, []);

  return auth;
};
