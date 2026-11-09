import React from 'react';
import type { Metadata } from 'next';
import { DocumentLocale } from '@/lib/cdm/schema';
import { AuthView } from '@/components/views/AuthView';

export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const isAr = rawLocale === 'ar';
  return {
    title: isAr ? 'استعادة كلمة المرور — DOCORA Studio' : 'Reset Password — DOCORA Studio',
    description: isAr
      ? 'استعادة كلمة المرور لحسابك في DOCORA AI Document Studio'
      : 'Reset your password for DOCORA AI Document Studio',
  };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <AuthView locale={locale} mode="forgot-password" />;
}
