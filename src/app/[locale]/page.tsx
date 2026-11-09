import React from 'react';
import type { Metadata } from 'next';
import { LandingShowcaseView } from '@/components/views/LandingShowcaseView';
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
      ? 'DOCORA — استوديو المستندات الذكي ثنائي الاتجاه (عربي / إنجليزي)'
      : 'DOCORA — Engineered Bidirectional AI Document Studio (Arabic & English)',
    description: isAr
      ? 'من فكرتك إلى مستند مؤسسي متكامل: محرر مهيكل ثنائي الاتجاه (Tiptap 3.0)، مراجعة محكومة بـ 9 وكلاء، تقييم جودة عبر 14 بُعداً، وتصدير أصلي إلى Word OOXML و Vector PDF.'
      : 'From your idea to an institutional document: native bidirectional Tiptap 3.0 editor, bounded 9-role multi-agent review, 14-vector quality gate, and native Word OOXML & Vector PDF export.',
    alternates: {
      canonical: isAr ? 'https://docora.studio/ar' : 'https://docora.studio/en',
      languages: {
        ar: 'https://docora.studio/ar',
        en: 'https://docora.studio/en',
      },
    },
    openGraph: {
      title: isAr
        ? 'DOCORA — استوديو المستندات الذكي ثنائي الاتجاه'
        : 'DOCORA — Engineered AI Document Studio',
      description: isAr
        ? 'بيئة إنتاج مستندات احترافية تدعم العربية والإنجليزية أصلياً مع تصدير مطابق لـ Word و PDF.'
        : 'Purpose-built document production environment with first-class Arabic/English support and native Word/PDF export.',
      locale: isAr ? 'ar_SA' : 'en_US',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: DocumentLocale = rawLocale === 'en' ? 'en' : 'ar';
  return <LandingShowcaseView locale={locale} />;
}
