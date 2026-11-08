import React from 'react';
import { DashboardWorkspaceView } from '@/components/views/DashboardWorkspaceView';
import { DocumentLocale } from '@/lib/cdm/schema';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <DashboardWorkspaceView locale={locale} />;
}
