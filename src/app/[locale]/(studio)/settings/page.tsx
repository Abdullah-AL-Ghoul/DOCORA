import React from 'react';
import type { Metadata } from 'next';
import { DocumentLocale } from '@/lib/cdm/schema';
import { UserSettingsView } from '@/components/views/UserSettingsView';

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
      ? 'الإعدادات والحساب — DOCORA Studio'
      : 'Settings & Account — DOCORA Studio',
    description: isAr
      ? 'إدارة الهوية المهنية، تفضيلات المحرر، ورصيد التوكنز في DOCORA'
      : 'Manage professional profile, editor preferences, and token quota in DOCORA',
  };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <UserSettingsView locale={locale} />;
}
