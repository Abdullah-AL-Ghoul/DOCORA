'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  Layers,
  CheckCircle2,
  Download,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { DocumentLocale } from '@/lib/cdm/schema';
import { Badge, Button, ThemeToggle } from '@/components/primitives';

export function HowItWorksView({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const steps = [
    {
      num: '01',
      title: isAr ? '1. فهم القصد والهدف المؤسسي (Intent Discovery)' : '1. Intent Discovery & Requirements',
      desc: isAr
        ? 'تشرح في جملة أو فقرة نوع المستند الذي تريده، ليقوم المحرك بتحليله وتحديد النموذج الدلالي المناسب.'
        : 'Describe what you need in natural language. DOCORA analyzes the scope and determines the target CDM schema.',
    },
    {
      num: '02',
      title: isAr ? '2. اعتماد المخطط الهيكلي (Structured Outline)' : '2. Structured Outline Preview',
      desc: isAr
        ? 'يقترح DOCORA هيكل الأقسام والعناوين الأساسية لتراجعها وتعتمدها قبل الشروع في كتابة أي مسودة.'
        : 'DOCORA proposes an editable outline of sections and headings for your review before drafting begins.',
    },
    {
      num: '03',
      title: isAr ? '3. الصياغة والتحرير برقعة A4 التحريرية' : '3. A4 Studio Drafting & Customization',
      desc: isAr
        ? 'يتم توليد المحتوى بصيغة CDM v1.2 داخل محرر Tiptap مع إمكانية التحرير اليدوي وتنسيق الجداول والقوائم.'
        : 'Content is rendered in the Tiptap editor with true A4 page margins, allowing manual edits and table adjustments.',
    },
    {
      num: '04',
      title: isAr ? '4. مراجعة الجودة بـ 9 وكلاء وبوابات صارمة' : '4. Bounded 9-Role Multi-Agent Review',
      desc: isAr
        ? 'يفحص الوكلاء المتخصصون سلامة الصياغة، الإحالات، ودقة الجداول، مع اقتراح فروقات تحريرية تقبلها أو ترفضها.'
        : 'Specialist agents audit legal terminology, coherence, and citations, proposing non-destructive inline diffs.',
    },
    {
      num: '05',
      title: isAr ? '5. التصدير المضمون لـ Word OOXML و Vector PDF' : '5. High-Fidelity Word & Vector PDF Export',
      desc: isAr
        ? 'تصدير المستند بملف docx أصلي مع حفظ توجيه الجداول العربية bidiVisual، أو كملف PDF متجهات فائق الدقة.'
        : 'Export directly to native Microsoft Word (.docx) with RTL bidiVisual tables, or vector-rendered print-ready PDF.',
    },
  ];

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
              href={isAr ? '/en/how-it-works' : '/ar/how-it-works'}
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
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <Badge tone="verified">
            <ShieldCheck className="h-3 w-3" />
            <span>{isAr ? 'دورة حياة المستند' : 'Document Lifecycle'}</span>
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {isAr ? 'كيف يعمل استوديو المستندات DOCORA؟' : 'How DOCORA Studio Works'}
          </h1>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            {isAr
              ? 'رحلة متكاملة ومحكومة هندسياً تنقلك من فكرتك الأولية إلى وثيقة قانونية أو تقرير مؤسسي مكتمل.'
              : 'A 5-stage engineered workflow bridging your idea into an institutional document.'}
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-6">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start gap-5 rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 shadow-xs dark:border-[#1E293B] dark:bg-[#11131A]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-base font-black text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]">
                {st.num}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold">{st.title}</h3>
                <p className="text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8]">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="primary">
              <span>{isAr ? 'ابدأ تجربة الاستوديو الآن' : 'Start Studio Session'}</span>
              <ArrowIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
