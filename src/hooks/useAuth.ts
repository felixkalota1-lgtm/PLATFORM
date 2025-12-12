import { useState, useEffect } from 'react';

export interface AuthUser {
  uid: string;
  email?: string;
  tenantId?: string;
  role?: string;
  displayName?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('pspm_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load user:', e);
    }
  }, []);

  return { user };
};
