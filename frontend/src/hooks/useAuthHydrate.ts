import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuthHydrate = () => {
  useEffect(() => {
    useAuthStore.getState().loadUser();
  }, []);
};
