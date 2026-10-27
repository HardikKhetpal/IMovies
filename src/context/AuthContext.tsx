import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, NotificationRecord } from '../types.ts';
import { api } from '../api/client.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, phone?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  notifications: NotificationRecord[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('imovies_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.user);
    } catch (err) {
      localStorage.removeItem('imovies_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.get<NotificationRecord[]>('/notifications');
      setNotifications(data || []);
    } catch (err) {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // Poll notifications every 20s
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
    localStorage.setItem('imovies_token', data.token);
    setUser(data.user);
    fetchNotifications();
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const data = await api.post<{ user: User; token: string }>('/auth/register', { name, email, password, phone });
    localStorage.setItem('imovies_token', data.token);
    setUser(data.user);
    fetchNotifications();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('imovies_token');
    setUser(null);
    setNotifications([]);
  };

  const updateProfile = async (name: string, phone?: string) => {
    const res = await api.post<{ user: User }>('/auth/update-profile', { name, phone });
    setUser(res.user);
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        selectedCity,
        setSelectedCity,
        login,
        register,
        logout,
        updateProfile,
        refreshUser: fetchCurrentUser,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        fetchNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
