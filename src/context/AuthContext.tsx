import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (googleUser: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Supabase 세션 확인
    checkSession();

    // 인증 상태 변화 감지
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (session?.user) {
          await checkAdminStatus(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await checkAdminStatus(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminStatus = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, full_name, created_at')
        .eq('id', userId);

      if (error) {
        console.error('Query error:', error);
        setUser(null);
        setIsAdmin(false);
        await supabase.auth.signOut();
        return;
      }

      if (data && data.length > 0) {
        const adminUser = data[0];
        setUser({
          id: userId,
          email: email,
          name: adminUser.full_name || email.split('@')[0],
          isAdmin: true,
        });
        setIsAdmin(true);
      } else {
        // 관리자가 아님
        console.log('User not in admin_users table');
        setUser(null);
        setIsAdmin(false);
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      setUser(null);
      setIsAdmin(false);
      await supabase.auth.signOut();
    }
  };

  const login = async (googleUser: any): Promise<{ success: boolean; error?: string }> => {
    try {
      // Supabase로 Google 토큰 로그인
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleUser.credential,
      });

      if (error) {
        return {
          success: false,
          error: `로그인 실패: ${error.message}`,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: '사용자 정보를 찾을 수 없습니다.',
        };
      }

      // 관리자인지 확인
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id, email, full_name')
        .eq('id', data.user.id)
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin check error:', adminError);
        return {
          success: false,
          error: `관리자 확인 실패: ${adminError.message}`,
        };
      }

      if (!adminData) {
        // 관리자가 아님 - 로그아웃
        console.log('Admin check: User not found in admin_users table');
        await supabase.auth.signOut();
        return {
          success: false,
          error: '이 계정은 관리자로 등록되어 있지 않습니다. Supabase의 admin_users 테이블에 추가해주세요.',
        };
      }

      // 관리자 데이터 설정
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        name: adminData.full_name || data.user.email?.split('@')[0] || '관리자',
        isAdmin: true,
      });
      setIsAdmin(true);

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: `로그인 오류: ${error.message}`,
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user && isAdmin,
        isAdmin,
        login,
        logout,
        isLoading,
      }}
    >
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
