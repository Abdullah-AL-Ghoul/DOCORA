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
    title: isAr ? 'تسجيل الدخول — DOCORA Studio' : 'Sign In — DOCORA Studio',
    description: isAr
      ? 'تسجيل الدخول إلى استوديو المستندات الذكي DOCORA'
      : 'Sign in to DOCORA AI Document Studio',
  };
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <AuthView locale={locale} mode="sign-in" />;
}
