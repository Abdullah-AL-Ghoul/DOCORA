import React from 'react';
import type { Metadata } from 'next';
import { DocumentLocale } from '@/lib/cdm/schema';
import { LegalView } from '@/components/views/LegalView';

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
    title: isAr
      ? 'سياسة الخصوصية — DOCORA Studio'
      : 'Privacy Policy — DOCORA Studio',
    description: isAr
      ? 'سياسة عدم الاحتفاظ بالبيانات وتشفير المستندات المؤسسية في استوديو DOCORA'
      : 'Zero Data Retention policy and enterprise document security at DOCORA Studio',
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <LegalView locale={locale} type="privacy" />;
}
