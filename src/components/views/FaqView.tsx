'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { DocumentLocale } from '@/lib/cdm/schema';
import { Badge, Button, ThemeToggle } from '@/components/primitives';

export function FaqView({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const faqs = [
    {
      q: isAr ? 'ما الذي يميز DOCORA عن روبوتات المحادثة التقليدية (Chatbots)؟' : 'How does DOCORA differ from standard AI chatbots?',
      a: isAr
        ? 'روبوتات المحادثة تنتج نصوصاً معزولة تفقد تنسيقها عند اللصق. DOCORA هو استوديو مستندات متخصص يعمل على نموذج موحد (CDM v1.2) يحافظ على فواصل الصفحات، توجيه الجداول، دقة العناوين، ويطبق مراجعة جودة صارمة بـ 9 وكلاء قبل التصدير.'
        : 'Chatbots output plain text bubbles that lose formatting when copied. DOCORA operates on Canonical Document Model v1.2, preserving page breaks, RTL tables, and structural headings with bounded 9-role quality gates.',
    },
    {
      q: isAr ? 'كيف يضمن DOCORA عدم تشويه الجداول العربية في ملفات Word و PDF؟' : 'How does DOCORA preserve Arabic tables in Word and PDF?',
      a: isAr
        ? 'نستخدم خوارزميات توجيه مرئية خاصة (bidiVisual) داخل ملفات OOXML، إلى جانب عزل الأرقام والرموز الرياضية بمعيار UAX#9، مما يمنع انقلاب الأعمدة أو تشويه الأرقام عند فتح المستند في Microsoft Word.'
        : 'We compile OOXML files using native bidiVisual properties and UAX#9 isolation, ensuring table columns and numeric data do not scramble when opened in Microsoft Word.',
    },
    {
      q: isAr ? 'ما هي بوابات الجودة الصارمة (Hard Gates)؟' : 'What are deterministic Hard Gates?',
      a: isAr
        ? 'هي آليات فحص حاسمة تمنع تصدير المستند نهائياً إذا تم رصد أي استشهاد أو مرجع قانوني وهمي، أو خرق لمعايير الامتثال المعتمدة، لحماية المستخدم المؤسسي من مخاطر الهلوسة.'
        : 'Hard gates automatically disable document export if hallucinated citations or critical compliance failures are detected, safeguarding institutional integrity.',
    },
    {
      q: isAr ? 'هل يتم استخدام مستنداتي لتدريب نماذج الذكاء الاصطناعي؟' : 'Are my documents used to train AI models?',
      a: isAr
        ? 'كلا. نعتمد سياسة صارمة بعدم الاحتفاظ بالبيانات (Zero Data Retention) ونفعل وسيط الدارة (Circuit Breaker) ببارامتر store: false لضمان خصوصية بياناتك المؤسسية.'
        : 'No. DOCORA enforces a strict Zero Data Retention policy with store: false parameter telemetry, ensuring your confidential documents are never retained or trained on.',
    },
    {
      q: isAr ? 'ما هو دفتر التوكنز الذري (Two-Phase Token Ledger)؟' : 'How does the Two-Phase Token Ledger protect my balance?',
      a: isAr
        ? 'يقوم النظام بحجز رصيد العملية مبدئياً، ولا تتم تسوية الخصم إلا بعد اكتمال التوليد وحفظ المستند بنجاح. في حال حدوث أي انقطاع في الشبكة، يعود الرصيد المحجوز فوراً لحسابك.'
        : 'DOCORA reserves tokens in flight and only settles upon successful generation and storage. If interrupted by a network timeout, reserved tokens are fully refunded.',
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

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
              href={isAr ? '/en/faq' : '/ar/faq'}
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
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <Badge tone="verified">
            <HelpCircle className="h-3 w-3" />
            <span>{isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</span>
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {isAr ? 'إجابات واضحة وموثقة عن DOCORA' : 'Clear Answers to Institutional Questions'}
          </h1>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            {isAr
              ? 'إجابات فنية دقيقة حول الأمان، الجداول العربية، بوابات الجودة، ونظام استهلاك التوكنز.'
              : 'Verifiable details regarding security, Arabic bidi tables, hard quality gates, and token accounting.'}
          </p>
        </div>

        {/* Accordion FAQ */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] overflow-hidden dark:border-[#1E293B] dark:bg-[#11131A]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-start font-bold text-sm sm:text-base hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 border-t border-[#F1F5F9] dark:border-[#1E293B] text-xs sm:text-sm leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
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
