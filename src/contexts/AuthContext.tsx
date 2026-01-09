'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserByEmail } from '@/services/database';
import type { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoggingIn = useRef(false);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        // First check localStorage for stored user
        const storedUser = localStorage.getItem('cikyc_user');
        if (storedUser) {
          try {
            const user: User = JSON.parse(storedUser);
            setCurrentUser({ email: user.email });
            setUserData(user);
            console.log('User restored from localStorage:', user.email);
          } catch (e) {
            console.error('Error parsing stored user:', e);
            localStorage.removeItem('cikyc_user');
          }
        }

        // Also check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.email);

        if (session?.user?.email) {
          setCurrentUser({ email: session.user.email });
          try {
            const user = await getUserByEmail(session.user.email);
            setUserData(user);
            // Update localStorage with fresh data
            if (user) {
              localStorage.setItem('cikyc_user', JSON.stringify(user));
            }
          } catch (e) {
            console.error('Error fetching user in checkSession:', e);
            // Keep localStorage data if fetch fails
          }
        }
      } catch (e) {
        console.error('Error checking session:', e);
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email, 'isLoggingIn:', isLoggingIn.current);

        // Skip if login is handling this
        if (isLoggingIn.current) {
          console.log('Skipping onAuthStateChange - login is handling it');
          return;
        }

        if (session?.user?.email) {
          setCurrentUser({ email: session.user.email });
          try {
            const user = await getUserByEmail(session.user.email);
            setUserData(user);
          } catch (e) {
            console.error('Error fetching user in onAuthStateChange:', e);
            setUserData(null);
          }
        } else {
          setCurrentUser(null);
          setUserData(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    console.log('Starting login for:', email);
    isLoggingIn.current = true;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError.message);
        throw new Error(authError.message || 'Authentication failed');
      }

      if (!authData?.user) {
        throw new Error('No user returned from authentication');
      }

      console.log('Auth successful for:', email);

      // Fetch user data from database (using separate client to avoid abort issues)
      const user = await getUserByEmail(email);
      console.log('User data fetched:', user);

      setCurrentUser({ email });
      setUserData(user);
      setLoading(false);

      // Store user in localStorage
      if (user) {
        localStorage.setItem('cikyc_user', JSON.stringify(user));
      }

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      isLoggingIn.current = false;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentUser(null);
    setUserData(null);
    // Clear user from localStorage
    localStorage.removeItem('cikyc_user');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  };

  // Role helpers
  const isAdmin = userData?.role === '2' || userData?.role === '3';
  const isOperator = userData?.role === '2';
  const isOrganization = userData?.role === '3';
  const isRegularUser = userData?.role === '1';

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    logout,
    resetPassword,
    isAdmin,
    isOperator,
    isOrganization,
    isRegularUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
