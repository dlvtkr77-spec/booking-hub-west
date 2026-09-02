import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google: any;
  }
}

let googleInitialized = false;

export default function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(response);

      if (result.success) {
        // 로그인 성공 - 약간의 딜레이 후 이동
        setTimeout(() => {
          navigate('/admin');
        }, 500);
      } else {
        setError(result.error || '로그인에 실패했습니다.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류 발생');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/admin');
      return;
    }

    // Google 스크립트가 이미 로드되었는지 확인
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      if (window.google && googleButtonRef.current && !googleInitialized) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          size: 'large',
          text: 'signin_with',
          theme: 'outline',
        });
        googleInitialized = true;
      }
      return;
    }

    // Google Sign-In 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && googleButtonRef.current && !googleInitialized) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          size: 'large',
          text: 'signin_with',
          theme: 'outline',
        });
        googleInitialized = true;
      }
    };
    document.body.appendChild(script);

    return () => {
      // 스크립트는 제거하지 않음 (재로드 방지)
    };
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 text-5xl">📋</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            예약 관리 허브
          </h1>
          <p className="text-slate-300">관리자 로그인</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl text-red-300 text-sm whitespace-pre-wrap backdrop-blur-sm">
            <span className="font-semibold">⚠️ </span>{error}
          </div>
        )}

        {/* Google Sign-In 버튼 */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl mb-6 transition">
          <p className="text-slate-200 text-center mb-6 text-sm font-medium">
            Google 계정으로 로그인하세요
          </p>
          <div ref={googleButtonRef} className="flex justify-center min-h-12">
            {isLoading && (
              <p className="text-slate-300 font-semibold">
                ⏳ 로그인 중...
              </p>
            )}
          </div>
        </div>

        {/* 정보 박스 */}
        <div className="bg-blue-500/20 border border-blue-400/50 rounded-xl px-4 py-4 backdrop-blur-sm">
          <p className="text-blue-300 font-semibold text-sm mb-2 flex items-center gap-2">
            <span>🔐</span> 관리자만 접근 가능
          </p>
          <p className="text-blue-200/80 text-xs leading-relaxed">
            Supabase admin_users 테이블에 등록된 관리자만 로그인할 수 있습니다.
          </p>
        </div>

        {/* 하단 텍스트 */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 Booking Hub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
