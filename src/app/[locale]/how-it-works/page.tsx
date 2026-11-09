import React from 'react';
import type { Metadata } from 'next';
import { DocumentLocale } from '@/lib/cdm/schema';
import { HowItWorksView } from '@/components/views/HowItWorksView';

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
      ? 'كيف يعمل الاستوديو — DOCORA AI Document Studio'
      : 'How It Works — DOCORA AI Document Studio',
    description: isAr
      ? 'دورة حياة المستند في DOCORA: من القصد والمخطط الهيكلي إلى الصياغة ومراجعة الـ 9 وكلاء والتصدير'
      : 'The 5-stage document lifecycle in DOCORA: intent, outline, studio drafting, review, and export',
  };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <HowItWorksView locale={locale} />;
}
