import React from 'react';
import type { Metadata } from 'next';
import { DocumentStudioView } from '@/components/views/DocumentStudioView';
import { DocumentLocale } from '@/lib/cdm/schema';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const isAr = rawLocale !== 'en';
  return {
    title: isAr
      ? 'استوديو المستندات المهيكل — DOCORA Studio'
      : 'Structured Document Studio — DOCORA Studio',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const { doc } = await searchParams;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <DocumentStudioView locale={locale} initialDocId={doc} />;
}
