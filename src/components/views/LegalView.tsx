'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, ArrowLeft, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { DocumentLocale } from '@/lib/cdm/schema';
import { Badge, Button, ThemeToggle } from '@/components/primitives';

interface LegalViewProps {
  locale: DocumentLocale;
  type: 'privacy' | 'terms';
}

export function LegalView({ locale, type }: LegalViewProps) {
  const isAr = locale === 'ar';
  const isPrivacy = type === 'privacy';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const title = isPrivacy
    ? isAr
      ? 'سياسة الخصوصية وضمانات البيانات'
      : 'Privacy Policy & Data Protection Guarantees'
    : isAr
      ? 'شروط الخدمة والاتفاقية المؤسسية'
      : 'Terms of Service & Institutional Agreement';

  const subtitle = isPrivacy
    ? isAr
      ? 'نلتزم بسياسة صارمة لعدم الاحتفاظ بالبيانات وحماية سرية المستندات الحكومية والمؤسسية.'
      : 'Strict Zero Data Retention enforcement with enterprise confidentiality for mission-critical documents.'
    : isAr
      ? 'القواعد التعاقدية ومعايير الاستخدام الآمن لمنصة استوديو المستندات الذكي DOCORA.'
      : 'Operational boundaries, intellectual property protection, and SLA commitments for DOCORA Studio.';

  const privacySections = [
    {
      id: 'zero-retention',
      title: isAr ? '1. سياسة عدم الاحتفاظ بالبيانات (Zero Data Retention)' : '1. Zero Data Retention Architecture',
      content: isAr
        ? 'تلتزم DOCORA بعدم استخدام محتوى المستندات، الجداول، المخططات، أو استفسارات المستخدمين لتدريب أي نماذج ذكاء اصطناعي تجارية أو مفتوحة المصدر. يتم استدعاء واجهات البرمجة بنمط Ephemeral مع وسم store: false الصارم.'
        : 'DOCORA enforces zero data persistence for LLM model training. All inference API calls utilize ephemeral payload isolation with store: false, guaranteeing that private enterprise data is never ingested into training corpuses.',
    },
    {
      id: 'encryption',
      title: isAr ? '2. التشفير في السكون والحركة (AES-256 & TLS 1.3)' : '2. Encryption at Rest & In-Transit',
      content: isAr
        ? 'يتم تشفير كافة المستندات والمسودات المخزنة في النظام باستخدام تشفير AES-256 على مستوى قاعدة البيانات مع تفعيل سياسات الأمان على مستوى الصف (RLS). جميع الاتصالات مشفرة عبر بروتوكول TLS 1.3 حصراً.'
        : 'All document payloads in PostgreSQL are encrypted at rest with AES-256 and protected via granular Row-Level Security (RLS) policies. Network communication is strictly terminated over TLS 1.3 with HSTS headers.',
    },
    {
      id: 'data-ownership',
      title: isAr ? '3. الملكية الفكرية الكاملة للعميل' : '3. Complete Customer Data Ownership',
      content: isAr
        ? 'يحتفظ العميل بالملكية الفكرية والقانونية الكاملة لجميع المستندات المنشأة، المعدلة، أو المصدرة عبر DOCORA. لا تدعي المنصة أي حقوق ملكية على المحتوى المنشأ.'
        : 'Customers retain 100% legal title and intellectual property rights over all content, structural trees, and exported artifacts produced through DOCORA Studio.',
    },
    {
      id: 'compliance',
      title: isAr ? '4. الامتثال والمعايير التنظيمية' : '4. Regulatory & Compliance Standards',
      content: isAr
        ? 'تم تصميم بنية DOCORA لتتوافق مع متطلبات نظام حماية البيانات الشخصية (PDPL) واللائحة العامة لحماية البيانات (GDPR)، مع إمكانية مسح الحسابات والمستندات نهائياً بطلب واحد.'
        : 'Architecture adheres to GDPR and Saudi Personal Data Protection Law (PDPL) requirements, including immediate hard-delete upon user request with verifiable cryptographic purges.',
    },
  ];

  const termsSections = [
    {
      id: 'service-scope',
      title: isAr ? '1. نطاق الخدمة ونموذج المستندات' : '1. Scope of Service & Document Engine',
      content: isAr
        ? 'توفر DOCORA منصة متقدمة لتحرير وتوليد ومراجعة المستندات استناداً إلى نموذج CDM v1.2 ومحرك الـ 9 وكلاء. يتحمل المستخدم مسؤولية التأكد من ملاءمة المخرجات لأغراضه القانونية والمهنية النهائية.'
        : 'DOCORA provides a structured document studio powered by CDM v1.2 and a 9-role multi-agent review engine. Users remain responsible for validating domain-specific legal or regulatory final application.',
    },
    {
      id: 'acceptable-use',
      title: isAr ? '2. الاستخدام المقبول والمحظورات' : '2. Acceptable Use Policy',
      content: isAr
        ? 'يُحظر استخدام المنصة لإنشاء وثائق تزوير، محتوى مضلل، خرق لحقوق الملكية الفكرية، أو تجاوز بوابات الأمان الصارمة. تحتفظ المنصة بحق تجميد الحسابات المخالفة تلقائياً.'
        : 'Users may not employ DOCORA to generate fraudulent documents, infringe copyright, bypass automated safety circuit-breakers, or execute adversarial jailbreaks. Infractions trigger immediate account revocation.',
    },
    {
      id: 'token-ledger',
      title: isAr ? '3. دفتر التوكنز والفوترة الذرية' : '3. Two-Phase Token Ledger & Billing',
      content: isAr
        ? 'تخضع العمليات لنظام حجز وتسوية ذري (Reserve/Settle). في حال تعثر أي عملية قبل اكتمالها بنجاح، يُعاد الرصيد المحجوز لحساب المستخدم تلقائياً دون أي خصم جائر.'
        : 'Tokens are consumed via a 2-phase reserve and settle protocol. Failed or aborted generations immediately release reserved balances, ensuring zero unjust deductions.',
    },
    {
      id: 'sla-availability',
      title: isAr ? '4. التوفر ومستوى الخدمة (SLA)' : '4. Service Availability & Warranties',
      content: isAr
        ? 'تستهدف المنصة نسبة توفر تشغيلية تبلغ 99.9% للخدمات السحابية. يتم الإعلان المسبق عن فترات الصيانة المجدولة وتوفير تصدير محلي فوري للمسودات.'
        : 'DOCORA targets 99.9% operational availability for cloud studio instances, with scheduled maintenance windows communicated in advance and instant local client exports supported.',
    },
  ];

  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#090A0F] dark:text-[#F8FAFC]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-[#FFFFFF]/90 backdrop-blur-md dark:border-[#222738] dark:bg-[#090A0F]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#0EA5E9] text-white shadow-md shadow-[#4F46E5]/20 group-hover:scale-105 transition-transform">
              <span className="font-mono text-base font-bold">D</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-semibold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                DOCORA
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                {isAr ? 'استوديو المستندات' : 'Document Studio'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={`/${isAr ? 'en' : 'ar'}/${type}`}
              className="px-2.5 py-1 text-xs font-medium text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] transition-colors"
            >
              {isAr ? 'English' : 'العربية'}
            </Link>
            <Link href={`/${locale}/sign-in`}>
              <Button size="sm" variant="outline">
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b border-[#E2E8F0] bg-[#FFFFFF] py-14 dark:border-[#222738] dark:bg-[#0F1117]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge tone="accent" className="gap-1.5 px-3 py-1 text-xs">
              {isPrivacy ? <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" /> : <FileText className="h-3.5 w-3.5 text-[#4F46E5]" />}
              <span>{isAr ? 'الشفافية المؤسسية' : 'Institutional Compliance'}</span>
            </Badge>
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {isAr ? 'آخر تحديث: نوفمبر 2026' : 'Last Updated: November 2026'}
            </span>
          </div>

          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl dark:text-[#F8FAFC]">
            {title}
          </h1>
          <p className="mt-3 text-base text-[#475569] dark:text-[#94A3B8]">
            {subtitle}
          </p>
        </div>
      </section>

      {/* Main Legal Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          {sections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#222738] dark:bg-[#0F1117]"
            >
              <h2 className="font-serif text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-[#4F46E5] dark:text-[#818CF8] shrink-0" />
                <span>{section.title}</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                {section.content}
              </p>
            </article>
          ))}
        </div>

        {/* Alternate Legal Link */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] p-6 dark:border-[#2A3146] dark:bg-[#151926]">
          <div>
            <h3 className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              {isPrivacy
                ? isAr ? 'هل تريد قراءة شروط الخدمة؟' : 'Looking for Terms of Service?'
                : isAr ? 'هل تريد مراجعة سياسة الخصوصية؟' : 'Looking for Privacy Policy?'}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
              {isPrivacy
                ? isAr ? 'اطلع على الالتزامات التعاقدية ومعايير الاستخدام الآمن.' : 'Review contractual commitments and usage guidelines.'
                : isAr ? 'اطلع على سياسة عدم التدريب وتشفير البيانات المؤسسية.' : 'Review our Zero Data Retention guarantee and encryption standards.'}
            </p>
          </div>
          <Link href={`/${locale}/${isPrivacy ? 'terms' : 'privacy'}`}>
            <Button variant="outline" className="gap-2 shrink-0">
              <span>{isPrivacy ? (isAr ? 'شروط الخدمة' : 'Terms of Service') : (isAr ? 'سياسة الخصوصية' : 'Privacy Policy')}</span>
              <ArrowIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-[#FFFFFF] py-8 dark:border-[#222738] dark:bg-[#090A0F]">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <p>© 2026 DOCORA Studio. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <div className="flex gap-4">
            <Link href={`/${locale}`} className="hover:underline">{isAr ? 'الرئيسية' : 'Home'}</Link>
            <Link href={`/${locale}/features`}>{isAr ? 'الميزات' : 'Features'}</Link>
            <Link href={`/${locale}/privacy`}>{isAr ? 'الخصوصية' : 'Privacy'}</Link>
            <Link href={`/${locale}/terms`}>{isAr ? 'الشروط' : 'Terms'}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
