import React from 'react';
import type { Metadata } from 'next';
import { DocumentStudioView } from '@/components/views/DocumentStudioView';
import { DocumentLocale } from '@/lib/cdm/schema';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const isAr = rawLocale !== 'en';
  return {
    title: isAr
      ? `استوديو المستندات (${id}) — DOCORA Studio`
      : `Document Studio (${id}) — DOCORA Studio`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DocumentStudioRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <DocumentStudioView locale={locale} initialDocId={id} />;
}
