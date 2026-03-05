import { useState, useEffect, useCallback } from 'react';
import { apiClient, getToken, setToken, removeToken } from '@/integrations/api/client';

interface ProfileData {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  is_admin?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Shape returned by the hook.
 * user_metadata is added for backward compatibility with components
 * that reference user.user_metadata?.name / user.user_metadata?.avatar_url
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
  user_metadata: {
    name?: string | null;
    avatar_url?: string | null;
  };
}

export const useAuth = () => {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const buildUser = (profile: ProfileData): AuthUser => ({
    ...profile,
    is_admin: profile.is_admin === 1,
    user_metadata: {
      name:       profile.name,
      avatar_url: profile.avatar_url,
    },
  });

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const profile = await apiClient.get<ProfileData>('/api/auth/me');
      setUser(buildUser(profile));
    } catch {
      // Token is invalid or expired — clear it
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for ?auth_token= in the URL (redirect from Google OAuth callback)
    const params    = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');

    if (authToken) {
      setToken(authToken);
      // Remove the token from the URL without a full page reload
      params.delete('auth_token');
      const newSearch = params.toString();
      const newUrl    = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }

    loadUser();
  }, [loadUser]);

  const signInWithGoogle = () => {
    const apiBase = (import.meta.env.VITE_API_URL as string) || '';
    window.location.href = `${apiBase}/api/auth/google`;
  };

  const signOut = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore — JWT is stateless, just clear the local token
    }
    removeToken();
    setUser(null);
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };
};
