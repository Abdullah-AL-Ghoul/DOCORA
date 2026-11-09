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
      ? 'شروط الخدمة — DOCORA Studio'
      : 'Terms of Service — DOCORA Studio',
    description: isAr
      ? 'الشروط والأحكام والاتفاقية المؤسسية لمنصة تحرير وتوليد المستندات DOCORA'
      : 'Terms and institutional operational conditions for DOCORA document platform',
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <LegalView locale={locale} type="terms" />;
}
