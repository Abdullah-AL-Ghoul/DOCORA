'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Table2,
  Cpu,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Zap,
  Layers,
  Scale,
  FileCheck2,
} from 'lucide-react';
import { DocumentLocale } from '@/lib/cdm/schema';
import { Badge, Button, ThemeToggle } from '@/components/primitives';

export function FeaturesShowcaseView({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#090A0F] dark:text-[#F8FAFC]">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-[#CBD5E1] bg-[#FFFFFF]/95 backdrop-blur-xs dark:border-[#1E293B] dark:bg-[#090A0F]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href={`/${locale}`} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5] font-extrabold text-[#FFFFFF]">
              D
            </div>
            <span className="text-lg font-black tracking-tight">DOCORA</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle locale={locale} />
            <Link
              href={isAr ? '/en/features' : '/ar/features'}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-xs font-semibold hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A]"
            >
              <span>{isAr ? 'English' : 'العربية'}</span>
            </Link>
            <Link href={`/${locale}/dashboard`}>
              <Button variant="primary" size="sm">
                <span>{isAr ? 'الدخول للمساحة' : 'Open Workspace'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
        <div className="max-w-3xl space-y-4">
          <Badge tone="verified">
            <ShieldCheck className="h-3 w-3" />
            <span>{isAr ? 'الركائز المعمارية لـ DOCORA v2.0' : 'DOCORA v2.0 Architecture'}</span>
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {isAr
              ? 'هندسة معمارية مصممة خصيصاً للمستندات المؤسسية ثنائية اللغة'
              : 'Engineered Exclusively for Bilingual Institutional Documents'}
          </h1>
          <p className="text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            {isAr
              ? 'تجمع منصة DOCORA بين دقة النموذج المعياري CDM v1.2، ومراجعة محكومة بـ 9 وكلاء متخصصين، وتصدير أصلي لملفات Word OOXML و Vector PDF دون تشويه للجداول العربية.'
              : 'DOCORA bridges Canonical Document Model v1.2, bounded 9-role multi-agent review, and native Word/PDF exports without scrambling Arabic tabular layouts.'}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: FileText,
              title: isAr ? 'النموذج القانوني الموحد (CDM v1.2)' : 'Canonical Document Model (CDM v1.2)',
              desc: isAr
                ? 'فصل مطلق بين هيكل المستند الدلالي وطبقات العرض والتصدير، مما يضمن ثبات العناوين والجداول والاقتباسات.'
                : 'Absolute separation between semantic document structure and export rendering, guaranteeing block preservation.',
            },
            {
              icon: Table2,
              title: isAr ? 'الجداول العربية المرئية (bidiVisual OOXML)' : 'Native Arabic Tables (bidiVisual OOXML)',
              desc: isAr
                ? 'دعم مباشر لتوجيه الجداول من اليمين لليسار في ملفات Word و PDF دون انقلاب الأعمدة أو تداخل الأرقام.'
                : 'Native right-to-left table formatting in Microsoft Word and PDF without column inversions or number scrambling.',
            },
            {
              icon: Cpu,
              title: isAr ? 'مراجعة الـ 9 وكلاء المتخصصين' : 'Bounded 9-Role Multi-Agent Review',
              desc: isAr
                ? 'فحص شامل عبر وكلاء متخصصين في المصطلحات القانونية، التناسق المنطقي، التدقيق الإملائي، وسلامة الإحالات.'
                : 'Exhaustive verification across legal terminology, logical coherence, spelling, and citation provenance.',
            },
            {
              icon: Scale,
              title: isAr ? 'محرك الجودة بـ 14 بُعداً (Hard Gates)' : '14-Vector Quality Engine & Hard Gates',
              desc: isAr
                ? 'بوابات جودة حاسمة تمنع تصدير المستندات في حال وجود إحالات قانونية وهمية أو أخطاء حرجة غير معالجة.'
                : 'Deterministic hard gates that automatically block document export upon dangling citations or critical violations.',
            },
            {
              icon: Zap,
              title: isAr ? 'استكمال التوليد المنقطع (Continue Generation)' : 'Atomic Continue Generation Recovery',
              desc: isAr
                ? 'في حال انقطاع اتصال الشبكة أو مهلة الاستجابة، يحتفظ النظام بكل مقطع مولد بنجاح ويكمل الصياغة فوراً.'
                : 'Recovers gracefully from network timeouts, preserving generated blocks without duplicate billing or text repetition.',
            },
            {
              icon: Lock,
              title: isAr ? 'الدفتر الذري بحجز وتسوية التوكنز' : 'Two-Phase Token Ledger Accounting',
              desc: isAr
                ? 'حجز مسبق وتسوية ذرية تضمن عدم خصم أي توكنز إلا بعد تسليم وتخزين محتوى المستند بنجاح تام.'
                : 'Reserve-and-settle token ledger ensuring zero deduction unless content is generated and saved successfully.',
            },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 shadow-xs dark:border-[#1E293B] dark:bg-[#11131A] space-y-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold">{feat.title}</h3>
                <p className="text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8]">{feat.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-8 text-center space-y-4 dark:border-[#1E293B] dark:bg-[#11131A]">
          <h2 className="text-xl font-extrabold sm:text-2xl">
            {isAr ? 'جاهز لتجربة استوديو المستندات الذكي؟' : 'Ready to Experience DOCORA Studio?'}
          </h2>
          <p className="max-w-xl mx-auto text-xs text-[#64748B] dark:text-[#94A3B8]">
            {isAr
              ? 'ابدأ بصياغة مستندك المؤسسي الآن مع ضمان أعلى معايير الجودة والتحقق الهندسي.'
              : 'Start authoring your institutional documents today with verified quality gates.'}
          </p>
          <Link href={`/${locale}/dashboard`}>
            <Button variant="primary">
              <span>{isAr ? 'دخول مساحة العمل' : 'Open Workspace'}</span>
              <ArrowIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
