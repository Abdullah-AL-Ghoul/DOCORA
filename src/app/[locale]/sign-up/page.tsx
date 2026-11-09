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
    title: isAr ? 'إنشاء حساب جديد — DOCORA Studio' : 'Sign Up — DOCORA Studio',
    description: isAr
      ? 'إنشاء حساب مؤسسي جديد في DOCORA AI Document Studio'
      : 'Create an institutional account in DOCORA AI Document Studio',
  };
}

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <AuthView locale={locale} mode="sign-up" />;
}
