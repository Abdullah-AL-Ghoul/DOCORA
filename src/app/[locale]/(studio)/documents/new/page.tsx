import React from 'react';
import type { Metadata } from 'next';
import { DocumentLocale } from '@/lib/cdm/schema';
import { DocumentCreationWizardView } from '@/components/views/DocumentCreationWizardView';

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
      ? 'إنشاء مستند جديد — DOCORA AI Document Studio'
      : 'New Document — DOCORA AI Document Studio',
    description: isAr
      ? 'معالج إنشاء وصياغة المستندات المؤسسية بهيكل CDM v1.2 ومساعدة الوكلاء الأذكياء'
      : 'Create and draft institutional documents with CDM v1.2 structure and intelligent assistance',
  };
}

export default async function NewDocumentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <DocumentCreationWizardView locale={locale} />;
}
