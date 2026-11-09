import React from 'react';
import type { Metadata } from 'next';
import { DocumentLocale } from '@/lib/cdm/schema';
import { FaqView } from '@/components/views/FaqView';

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
      ? 'الأسئلة الشائعة — DOCORA Studio'
      : 'Frequently Asked Questions — DOCORA Studio',
    description: isAr
      ? 'إجابات تقنية ودقيقة حول نموذج المستندات، سياسة الخصوصية، وبوابات الجودة في DOCORA'
      : 'Authoritative answers regarding document architecture, privacy guarantees, and quality gates in DOCORA',
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <FaqView locale={locale} />;
}
