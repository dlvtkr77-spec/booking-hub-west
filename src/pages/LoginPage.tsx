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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">예약 관리</h1>
          <p className="text-gray-600">관리자 로그인</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}

        {/* Google Sign-In 버튼 */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <p className="text-gray-700 text-center mb-4 text-sm">
            Google 계정으로 관리자 모드에 로그인하세요.
          </p>
          <div ref={googleButtonRef} className="flex justify-center min-h-12">
            {isLoading && <p className="text-gray-600">로그인 중...</p>}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-4 px-4 py-3 bg-blue-50 rounded">
          <p className="font-semibold mb-1">⚠️ 관리자만 접근 가능</p>
          <p>Supabase admin_users 테이블에 등록된 관리자만 로그인 가능합니다.</p>
        </div>
      </div>
    </div>
  );
}
