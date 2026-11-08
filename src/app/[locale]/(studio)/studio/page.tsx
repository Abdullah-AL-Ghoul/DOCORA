import React from 'react';
import { DocumentStudioView } from '@/components/views/DocumentStudioView';
import { DocumentLocale } from '@/lib/cdm/schema';

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
