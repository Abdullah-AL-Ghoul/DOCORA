'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Badge, Button, SegmentedControl } from '@/components/primitives';
import { DocumentLocale } from '@/lib/cdm/schema';
import { PRESET_DOCUMENTS } from '@/lib/cdm/presets';
import { OFFICIAL_MODEL_PRICING } from '@/lib/ai';

/**
 * Layer 4 View: Mode C — High-Craft Marketing Hybrid with Sandboxed Pre-Computed Demo
 *
 * Enforces Guardrail #4 & Fix #6 & #7:
 * 1. "The Hero is a Thesis" — Interactive Demo is 100% Sandboxed & Pre-Computed (zero paid LLM calls or private data collection from anonymous visitors).
 * 2. Displays accurate Official Gemini Pricing (`gemini-3.5-flash-lite` $0.30/$2.50, `gemini-3.8-flash` $0.75/$3.75, `gemini-4-argon` $2.00/$10.00 -> $4.00/$20.00 Dec 1+, No Free Tier).
 * 3. Transparent disclosure of `store: false` stateless mode vs. Vertex AI Enterprise ZDR.
 * 4. Verified WCAG 2.2 AA contrast tokens (`#047857` on `#ECFDF5`, `#4F46E5` with `#FFFFFF`, `#475569` on `#F8FAFC`).
 */

type SandboxScenarioKey = 'exec-contract-ar' | 'board-report-en';

export function LandingShowcaseView({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  const [scenario, setScenario] = useState<SandboxScenarioKey>(
    isAr ? 'exec-contract-ar' : 'board-report-en'
  );
  const activeDoc = PRESET_DOCUMENTS[scenario];
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#090A0F] dark:text-[#F8FAFC]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 border-b border-[#CBD5E1] bg-[#FFFFFF]/95 backdrop-blur-xs dark:border-[#1E293B] dark:bg-[#090A0F]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] font-bold text-[#FFFFFF] shadow-xs">
              D
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight">DOCORA</span>
              <span className="ms-2 hidden rounded-md bg-[#ECFDF5] px-2 py-0.5 text-xs font-semibold text-[#047857] sm:inline-block dark:bg-[#064E3B] dark:text-[#34D399]">
                Phase 01 MVP v2.0
              </span>
            </div>
          </div>

          <nav
            aria-label={isAr ? 'التنقل الرئيسي' : 'Main Navigation'}
            className="flex items-center gap-2.5"
          >
            <Link
              href={isAr ? '/en' : '/ar'}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? 'English (LTR)' : 'العربية (RTL)'}</span>
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
            >
              <span>{isAr ? 'لوحة المستندات' : 'Dashboard'}</span>
            </Link>
            <Link
              href={`/${locale}/studio`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-[#FFFFFF] hover:bg-[#4338CA]"
            >
              <span>{isAr ? 'افتح الاستوديو' : 'Open Studio'}</span>
              <ArrowIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="grid items-start gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <Badge tone="verified">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isAr
                  ? 'هندسة مستندات قياسية ثنائية الاتجاه (CDM v1.2)'
                  : 'Engineered Bidirectional Document Studio (CDM v1.2)'}
              </span>
            </Badge>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
              {isAr
                ? 'صياغة العقود والتقارير المؤسسية بدقة هندسية وتصدير مطابق لـ Word و PDF'
                : 'Institutional Contracts & Reports with Native Word OOXML & Vector PDF Precision'}
            </h1>

            <p className="text-base leading-relaxed text-[#475569] dark:text-[#94A3B8]">
              {isAr
                ? 'تجمع منصة DOCORA بين محرر مهيكل ثنائي الاتجاه (Tiptap 3.0) ومترجم OOXML أصلي (docx@9.15.2) يدعم الجداول العربية bidiVisual، ودفتر حصص ذري محصن بـ SECURITY DEFINER.'
                : 'DOCORA unites a native bidirectional Tiptap 3.0 structured editor, a pinned docx@9.15.2 OOXML compiler with Arabic bidiVisual tables, and an atomic SECURITY DEFINER token ledger.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/${locale}/studio`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-3 text-sm font-semibold text-[#FFFFFF] shadow-sm hover:bg-[#4338CA]"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isAr ? 'ابدأ في استوديو المستندات' : 'Launch Document Studio'}
                </span>
              </Link>
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] px-5 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
              >
                <span>{isAr ? 'استعرض القوالب والملفات' : 'Browse Templates & Workspace'}</span>
              </Link>
            </div>

            <dl className="grid grid-cols-3 gap-3 border-t border-[#CBD5E1] pt-6 text-xs dark:border-[#1E293B]">
              <div>
                <dt className="text-[#475569] dark:text-[#94A3B8]">
                  {isAr ? 'تباين الوصولية' : 'WCAG 2.2 AA'}
                </dt>
                <dd className="mt-1 font-bold text-[#047857] dark:text-[#34D399] tabular-nums">
                  &gt;= 4.5:1 Verified
                </dd>
              </div>
              <div>
                <dt className="text-[#475569] dark:text-[#94A3B8]">
                  {isAr ? 'استجابة التفاعل' : 'Field INP Target'}
                </dt>
                <dd className="mt-1 font-bold tabular-nums">p75 &lt;= 200ms</dd>
              </div>
              <div>
                <dt className="text-[#475569] dark:text-[#94A3B8]">
                  {isAr ? 'تصدير الجداول' : 'OOXML Engine'}
                </dt>
                <dd className="mt-1 font-bold tabular-nums">docx@9.15.2</dd>
              </div>
            </dl>
          </div>

          {/* Interactive Sandboxed Pre-Computed Demo (Guardrail #4) */}
          <div className="lg:col-span-7">
            <div
              data-testid="sandboxed-hero-demo"
              className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-5 shadow-lg dark:border-[#334155] dark:bg-[#12141C]"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3 dark:border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <Badge tone="verified">
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    <span>
                      {isAr
                        ? 'عرض تفاعلي معزول ومخزن مسبقاً (بدون استدعاء API خارجي)'
                        : 'Sandboxed Pre-Computed Demo (Zero Live LLM Calls)'}
                    </span>
                  </Badge>
                </div>

                <SegmentedControl<SandboxScenarioKey>
                  ariaLabel={isAr ? 'اختر سيناريو المستند الجاهز' : 'Select Pre-Computed Scenario'}
                  value={scenario}
                  onChange={setScenario}
                  options={[
                    {
                      value: 'exec-contract-ar',
                      label: isAr ? 'عقد تنفيذي عربي (RTL)' : 'Arabic Executive Contract (RTL)',
                    },
                    {
                      value: 'board-report-en',
                      label: isAr ? 'مذكرة مالية (LTR)' : 'Financial Board Memo (LTR)',
                    },
                  ]}
                />
              </div>

              {/* Pre-Computed Document Preview Paper */}
              <div
                dir={activeDoc.defaultDirection === 'ltr' ? 'ltr' : 'rtl'}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 dark:border-[#1E293B] dark:bg-[#090A0F]"
              >
                <div className="mb-3 flex items-center justify-between text-xs text-[#475569] dark:text-[#94A3B8]">
                  <span className="font-semibold">
                    CDM v{activeDoc.cdmVersion} — {activeDoc.pageSetup.paperSize}
                  </span>
                  <span className="rounded bg-[#ECFDF5] px-2 py-0.5 font-semibold text-[#047857] dark:bg-[#064E3B] dark:text-[#34D399]">
                    {activeDoc.defaultDirection === 'rtl'
                      ? 'bidiVisual: true + RunFonts'
                      : 'LTR Tabular Numerals'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {activeDoc.title}
                </h2>

                <div className="mt-3 space-y-3 text-sm">
                  {activeDoc.blocks.slice(0, 5).map((blk) => {
                    if (blk.type === 'paragraph') {
                      return (
                        <p
                          key={blk.id}
                          className="leading-relaxed text-[#334155] dark:text-[#CBD5E1]"
                        >
                          {blk.runs.map((r) => r.text).join('')}
                        </p>
                      );
                    }
                    if (blk.type === 'table') {
                      return (
                        <div key={blk.id} className="overflow-x-auto">
                          <table
                            dir={blk.bidiVisual ? 'rtl' : 'ltr'}
                            className="w-full border-collapse bg-[#FFFFFF] text-xs tabular-nums dark:bg-[#12141C]"
                          >
                            <tbody>
                              {blk.rows.map((row) => (
                                <tr key={row.id}>
                                  {row.cells.map((cell) => {
                                    const Tag = cell.isHeader ? 'th' : 'td';
                                    return (
                                      <Tag
                                        key={cell.id}
                                        dir={cell.direction === 'ltr' ? 'ltr' : 'rtl'}
                                        className={`border border-[#CBD5E1] px-2.5 py-1.5 dark:border-[#334155] ${
                                          cell.isHeader
                                            ? 'bg-[#F1F5F9] font-bold dark:bg-[#1E293B]'
                                            : ''
                                        }`}
                                      >
                                        {cell.text}
                                      </Tag>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Official Model Pricing & Stateless `store: false` Transparency Section */}
        <section
          aria-labelledby="pricing-governance-heading"
          className="mt-16 rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 shadow-xs sm:p-8 dark:border-[#334155] dark:bg-[#11131A]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="pricing-governance-heading" className="text-xl font-bold">
                {isAr
                  ? 'حوكمة التسعير الرسمي للنماذج وشفافية وضع عدم التخزين (store: false)'
                  : 'Official Model Pricing Baseline & Stateless (store: false) Governance'}
              </h2>
              <p className="mt-1 text-sm text-[#475569] dark:text-[#94A3B8]">
                {isAr
                  ? 'يعطل إعداد store: false تخزين كائن التفاعل لدى المزود (ويتعارض تقنياً مع background: true و previous_interaction_id لذا يدير DOCORA السياق محلياً). تتطلب سياسة ZDR التعاقدية الكاملة ربط Vertex AI Enterprise ZDR.'
                  : 'Stateless request mode (store: false) disables interaction object persistence at the provider (conflicting with background: true and previous_interaction_id, so DOCORA manages context locally). Full contractual ZDR requires Vertex AI Enterprise ZDR.'}
              </p>
            </div>
            <Badge tone="verified">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>50,000 Monthly Free Quota (Atomic 2-Phase Ledger)</span>
            </Badge>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm tabular-nums">
              <thead>
                <tr className="bg-[#F1F5F9] dark:bg-[#1E293B]">
                  <th className="border border-[#CBD5E1] px-4 py-2.5 text-start font-bold dark:border-[#334155]">
                    {isAr ? 'معرف النموذج الرسمي' : 'Official Model ID'}
                  </th>
                  <th className="border border-[#CBD5E1] px-4 py-2.5 text-start font-bold dark:border-[#334155]">
                    {isAr ? 'الإدخال / 1M رمز' : 'Input / 1M Tokens'}
                  </th>
                  <th className="border border-[#CBD5E1] px-4 py-2.5 text-start font-bold dark:border-[#334155]">
                    {isAr ? 'الإخراج / 1M رمز' : 'Output / 1M Tokens'}
                  </th>
                  <th className="border border-[#CBD5E1] px-4 py-2.5 text-start font-bold dark:border-[#334155]">
                    {isAr ? 'المرحلة وأهلية الباقة المجانية' : 'Phase & Free Tier Eligibility'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.values(OFFICIAL_MODEL_PRICING).map((model) => (
                  <tr key={model.modelId}>
                    <td className="border border-[#CBD5E1] px-4 py-2.5 font-mono font-semibold dark:border-[#334155]">
                      {model.modelId}
                    </td>
                    <td className="border border-[#CBD5E1] px-4 py-2.5 dark:border-[#334155]">
                      ${model.inputCostPerMillionUsd.toFixed(2)}
                      {model.postDec2026InputCostPerMillionUsd
                        ? ` ($${model.postDec2026InputCostPerMillionUsd.toFixed(2)} from Dec 1, 2026)`
                        : ''}
                    </td>
                    <td className="border border-[#CBD5E1] px-4 py-2.5 dark:border-[#334155]">
                      ${model.outputCostPerMillionUsd.toFixed(2)}
                      {model.postDec2026OutputCostPerMillionUsd
                        ? ` ($${model.postDec2026OutputCostPerMillionUsd.toFixed(2)} from Dec 1, 2026)`
                        : ''}
                    </td>
                    <td className="border border-[#CBD5E1] px-4 py-2.5 dark:border-[#334155]">
                      {model.freeTierEligible
                        ? isAr
                          ? `${model.phase} — متاح ضمن الحصة المجانية`
                          : `${model.phase} — Eligible on Free Tier`
                        : isAr
                        ? `${model.phase} — غير متاح في Free Tier (للباقات المدفوعة فقط)`
                        : `${model.phase} — Not available on Free Tier (Paid Tiers Only)`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
