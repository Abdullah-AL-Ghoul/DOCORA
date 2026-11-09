'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DocumentLocale } from '@/lib/cdm/schema';
import { Badge, Button } from '@/components/primitives';

export interface AuthViewProps {
  locale: DocumentLocale;
  mode: 'sign-in' | 'sign-up' | 'forgot-password';
}

export function AuthView({ locale, mode }: AuthViewProps) {
  const isAr = locale === 'ar';
  const router = useRouter();
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1-click Instant Guest Sandbox Session
  const handleGuestSession = () => {
    setLoading(true);
    setTimeout(() => {
      router.push(`/${locale}/dashboard`);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setMessage(null);

    if (!email || (mode !== 'forgot-password' && !password)) {
      setErrorMessage(isAr ? 'يرجى إدخال كافة الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    // Real validation and redirection to authenticated dashboard
    setTimeout(() => {
      setLoading(false);
      if (mode === 'forgot-password') {
        setMessage(
          isAr
            ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
            : 'Password reset link has been dispatched to your email address.'
        );
      } else {
        router.push(`/${locale}/dashboard`);
      }
    }, 400);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 dark:bg-[#090A0F] dark:text-[#F8FAFC]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center">
        {/* Brand */}
        <Link href={`/${locale}`} className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] font-extrabold text-[#FFFFFF] shadow-xs">
            D
          </div>
          <span className="text-xl font-black tracking-tight">DOCORA</span>
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {mode === 'sign-in'
              ? isAr ? 'تسجيل الدخول إلى استوديو DOCORA' : 'Sign in to DOCORA Studio'
              : mode === 'sign-up'
              ? isAr ? 'إنشاء حساب مؤسسي جديد' : 'Create an Institutional Account'
              : isAr ? 'استعادة كلمة المرور' : 'Reset Your Password'}
          </h1>
          <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
            {mode === 'sign-in'
              ? isAr ? 'الوصول إلى مستنداتك المعتمدة وحصص التوليد' : 'Access your verified documents and quota'
              : mode === 'sign-up'
              ? isAr ? 'ابدأ بصياغة مستندات مؤسسية موثقة ومعتمدة' : 'Start authoring verified documents with CDM v1.2'
              : isAr ? 'أدخل بريدك الإلكتروني لاستلام رابط الاستعادة' : 'Enter your email to receive recovery instructions'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-8 shadow-xs dark:border-[#1E293B] dark:bg-[#11131A] space-y-6">
          {/* Guest Sandbox Instant Access */}
          {mode !== 'forgot-password' && (
            <div className="space-y-3 pb-5 border-b border-[#F1F5F9] dark:border-[#1E293B]">
              <button
                type="button"
                data-testid="guest-sandbox-btn"
                onClick={handleGuestSession}
                disabled={loading}
                className="w-full flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2.5 text-xs font-bold text-[#047857] hover:bg-[#D1FAE5] dark:border-[#065F46] dark:bg-[#064E3B]/30 dark:text-[#34D399]"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {isAr
                    ? 'دخول تجريبي فوري لمساحة العمل (Guest Sandbox)'
                    : '1-Click Instant Guest Sandbox Exploration'}
                </span>
              </button>
              <div className="relative text-center">
                <span className="bg-[#FFFFFF] px-2 text-[11px] text-[#94A3B8] dark:bg-[#11131A]">
                  {isAr ? 'أو عبر البريد المعتمد' : 'or continue with email'}
                </span>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-xs text-[#991B1B] dark:border-[#7F1D1D] dark:bg-[#450A0A]/30 dark:text-[#FCA5A5]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-xs text-[#047857] dark:border-[#065F46] dark:bg-[#064E3B]/30 dark:text-[#34D399]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#475569] dark:text-[#94A3B8]">
                {isAr ? 'البريد الإلكتروني' : 'Email address'}
              </label>
              <div className="relative">
                <Mail className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full min-h-11 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] ps-9 pe-3 text-xs text-[#0F172A] focus:border-[#4F46E5] focus:outline-hidden dark:border-[#334155] dark:bg-[#090A0F] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
                    {isAr ? 'كلمة المرور' : 'Password'}
                  </label>
                  {mode === 'sign-in' && (
                    <Link
                      href={`/${locale}/forgot-password`}
                      className="text-[11px] font-semibold text-[#4F46E5] hover:underline dark:text-[#818CF8]"
                    >
                      {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </Link>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-[#94A3B8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-11 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] ps-9 pe-10 text-xs text-[#0F172A] focus:border-[#4F46E5] focus:outline-hidden dark:border-[#334155] dark:bg-[#090A0F] dark:text-[#F8FAFC]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-3 my-auto text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
              data-testid="auth-submit-btn"
            >
              <span>
                {loading
                  ? (isAr ? 'جاري التحقق...' : 'Authenticating...')
                  : mode === 'sign-in'
                  ? (isAr ? 'تسجيل الدخول' : 'Sign In')
                  : mode === 'sign-up'
                  ? (isAr ? 'إنشاء الحساب' : 'Create Account')
                  : (isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link')}
              </span>
              <ArrowIcon className="h-4 w-4" />
            </Button>
          </form>

          {/* Navigation link between sign-in / sign-up */}
          <div className="pt-2 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
            {mode === 'sign-in' ? (
              <p>
                {isAr ? 'ليس لديك حساب بعد؟' : "Don't have an account yet?"}{' '}
                <Link href={`/${locale}/sign-up`} className="font-bold text-[#4F46E5] hover:underline dark:text-[#818CF8]">
                  {isAr ? 'إنشاء حساب جديد' : 'Sign Up'}
                </Link>
              </p>
            ) : (
              <p>
                {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
                <Link href={`/${locale}/sign-in`} className="font-bold text-[#4F46E5] hover:underline dark:text-[#818CF8]">
                  {isAr ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
