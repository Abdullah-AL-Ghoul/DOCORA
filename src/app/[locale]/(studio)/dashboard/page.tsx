import React from 'react';
import type { Metadata } from 'next';
import { DashboardWorkspaceView } from '@/components/views/DashboardWorkspaceView';
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
      ? 'لوحة المستندات ومساحة العمل — DOCORA Studio'
      : 'Document Workspace & Library — DOCORA Studio',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <DashboardWorkspaceView locale={locale} />;
}
