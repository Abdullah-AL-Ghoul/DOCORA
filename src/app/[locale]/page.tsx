import React from 'react';
import { LandingShowcaseView } from '@/components/views/LandingShowcaseView';
import { DocumentLocale } from '@/lib/cdm/schema';

export default async function LocaleLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <LandingShowcaseView locale={locale} />;
}
