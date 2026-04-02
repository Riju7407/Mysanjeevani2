import { useState, useEffect } from 'react';

interface User {
  _id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (e) {
            console.error('Failed to parse user:', e);
          }
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
      setLoading(false);
    }
  }, []);

  return { user, token, isAuthenticated, loading };
}
