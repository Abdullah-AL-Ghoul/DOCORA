import React from 'react';
import type { Metadata } from 'next';
import { DocumentLocale } from '@/lib/cdm/schema';
import { DocumentLibraryView } from '@/components/views/DocumentLibraryView';

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
      ? 'مكتبة المستندات — DOCORA AI Document Studio'
      : 'Document Library — DOCORA AI Document Studio',
    description: isAr
      ? 'إدارة وصياغة وأرشفة المستندات المؤسسية المعتمدة وفق معيار CDM v1.2'
      : 'Manage, edit, and organize verified institutional documents in CDM v1.2 format',
  };
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <DocumentLibraryView locale={locale} />;
}
