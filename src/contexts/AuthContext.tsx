import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  mockLogin: (role: 'SUPER_ADMIN' | 'PRINCIPAL' | 'STUDENT') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock login for development bypass
  const mockLogin = (role: 'SUPER_ADMIN' | 'PRINCIPAL' | 'STUDENT') => {
    const mockId = '00000000-0000-0000-0000-000000000000';
    const mockUser: User = {
      id: mockId,
      email: role === 'SUPER_ADMIN' ? 'admin@stps.com' : 'mock@user.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any;

    const mockProfile: Profile = {
      id: mockId,
      email: mockUser.email!,
      full_name: role === 'SUPER_ADMIN' ? 'System Administrator' : 'Mock User',
      role: role,
      status: 'APPROVED',
      created_at: new Date().toISOString()
    } as any;

    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
    localStorage.setItem('stps_mock_role', role);
  };

  useEffect(() => {
    // Check for mock session first
    const savedMockRole = localStorage.getItem('stps_mock_role');
    if (savedMockRole) {
      mockLogin(savedMockRole as any);
      return;
    }

    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!localStorage.getItem('stps_mock_role')) {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!localStorage.getItem('stps_mock_role')) {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      // Check if this is the default admin email
      const { data: authUser } = await supabase.auth.getUser();
      const isDefaultAdmin = authUser?.user?.email === 'admin@stps.com';

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (isDefaultAdmin) {
          // Bypass database check for default admin if table is broken
          setProfile({
            id: userId,
            email: 'admin@stps.com',
            full_name: 'System Administrator',
            role: 'SUPER_ADMIN',
            status: 'APPROVED',
            created_at: new Date().toISOString()
          } as any);
          return;
        }
        throw error;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const signOut = async () => {
    localStorage.removeItem('stps_mock_role');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, mockLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
