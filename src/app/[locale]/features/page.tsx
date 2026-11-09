import React from 'react';
import type { Metadata } from 'next';
import { DocumentLocale } from '@/lib/cdm/schema';
import { FeaturesShowcaseView } from '@/components/views/FeaturesShowcaseView';

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
      ? 'الميزات والركائز المعمارية — DOCORA Studio'
      : 'Features & Architecture — DOCORA Studio',
    description: isAr
      ? 'استكشف الميزات الهندسية المعمارية لمنصة DOCORA: نموذج CDM v1.2، مراجعة الـ 9 وكلاء، وبوابات الجودة'
      : 'Explore DOCORA architectural capabilities: CDM v1.2, 9-role multi-agent review, and hard gates',
  };
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <FeaturesShowcaseView locale={locale} />;
}
