'use client';

import React from 'react';
import { CheckCircle2, CloudOff, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge, Button, SegmentedControl } from '@/components/primitives';
import { DocumentLocale, TextDirection } from '@/lib/cdm/schema';

/**
 * Layer 2 Domain Composites (`src/components/composites/index.tsx`)
 * - `AutosaveStatusIndicator`
 * - `TokenQuotaMeter`
 * - `BidiDirectionToggle` (`rule/control-matches-cardinality`: 3 options visible immediately)
 * - `LegalDisclaimerBanner` (`AUD-06` mandatory legal template safeguard)
 * - `ContinueGenerationBanner` (Guardrail #3: honest recovery from last persisted CDM block)
 */

export function AutosaveStatusIndicator({
  status,
  locale,
}: {
  status: 'saved' | 'saving' | 'offline-indexeddb';
  locale: DocumentLocale;
}) {
  const isAr = locale === 'ar';
  if (status === 'saving') {
    return (
      <Badge tone="neutral">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        <span>{isAr ? 'جارٍ الحفظ في CDM...' : 'Saving to CDM...'}</span>
      </Badge>
    );
  }
  if (status === 'offline-indexeddb') {
    return (
      <Badge tone="warning">
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{isAr ? 'محفوظ محلياً (IndexedDB)' : 'Saved locally (IndexedDB)'}</span>
      </Badge>
    );
  }
  return (
    <Badge tone="verified">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{isAr ? 'تم الحفظ والتحقق ✓' : 'Saved & Verified ✓'}</span>
    </Badge>
  );
}

export function TokenQuotaMeter({
  used,
  reserved,
  limit,
  locale,
}: {
  used: number;
  reserved: number;
  limit: number;
  locale: DocumentLocale;
}) {
  const isAr = locale === 'ar';
  const remaining = Math.max(0, limit - used - reserved);
  const pct = Math.min(100, Math.round(((used + reserved) / Math.max(1, limit)) * 100));

  return (
    <div
      aria-label={isAr ? 'عداد رصيد الرموز الشهري' : 'Monthly Token Quota Meter'}
      className="inline-flex items-center gap-2.5 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 py-1.5 text-xs dark:border-[#334155] dark:bg-[#11131A]"
    >
      <span className="font-semibold text-[#475569] dark:text-[#94A3B8]">
        {isAr ? 'الرصيد المتاح:' : 'Quota:'}
      </span>
      <span className="tabular-nums font-bold text-[#0F172A] dark:text-[#F8FAFC]">
        {remaining.toLocaleString('en-US')} / {limit.toLocaleString('en-US')}
      </span>
      <span className="rounded bg-[#ECFDF5] px-1.5 py-0.5 text-[11px] font-semibold text-[#047857] dark:bg-[#064E3B] dark:text-[#34D399] tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

export function BidiDirectionToggle({
  direction,
  onChange,
  locale,
}: {
  direction: TextDirection;
  onChange: (dir: TextDirection) => void;
  locale: DocumentLocale;
}) {
  const isAr = locale === 'ar';
  return (
    <SegmentedControl<TextDirection>
      ariaLabel={isAr ? 'اتجاه النص والفقرات' : 'Text & Paragraph Direction'}
      value={direction}
      onChange={onChange}
      options={[
        { value: 'rtl', label: isAr ? 'عربي (RTL)' : 'RTL' },
        { value: 'ltr', label: isAr ? 'إنجليزي (LTR)' : 'LTR' },
        { value: 'auto', label: isAr ? 'تلقائي (UAX#9)' : 'Auto (UAX#9)' },
      ]}
    />
  );
}

export function LegalDisclaimerBanner({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  return (
    <div
      role="note"
      aria-label={isAr ? 'إخلاء مسؤولية قانوني' : 'Legal Disclaimer'}
      className="mb-4 flex items-start gap-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-xs text-[#92400E] dark:border-[#78350F] dark:bg-[#451A03] dark:text-[#FBBF24]"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <strong className="font-bold">
          {isAr
            ? 'إخلاء مسؤولية قانوني إلزامي (AUD-06): '
            : 'Mandatory Legal Template Notice (AUD-06): '}
        </strong>
        <span>
          {isAr
            ? 'هذه المسودة مولدة بمساعدة الذكاء الاصطناعي استناداً إلى نموذج المستندات القياسي CDM v1.2 ولا تُعد استشارة قانونية ملزمة دون مراجعة مستشار قانوني مرخص.'
            : 'This AI-assisted draft is structured via CDM v1.2 for institutional productivity and does not constitute formal legal counsel without review by licensed legal counsel.'}
        </span>
      </div>
    </div>
  );
}

export function ContinueGenerationBanner({
  locale,
  completedBlocks,
  resumePrompt,
  isContinuing,
  onContinue,
}: {
  locale: DocumentLocale;
  completedBlocks: number;
  resumePrompt?: string;
  isContinuing: boolean;
  onContinue: () => void;
}) {
  const isAr = locale === 'ar';
  return (
    <div
      role="region"
      aria-label={isAr ? 'استكمال التوليد المتوقف' : 'Continue Interrupted Generation'}
      className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm text-[#1E1B4B] dark:border-[#3730A3] dark:bg-[#1E1B4B] dark:text-[#E0E7FF]"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-bold">
          <Sparkles className="h-4 w-4 text-[#4F46E5] dark:text-[#818CF8]" aria-hidden="true" />
          <span>
            {isAr
              ? `انقطع التدفق السابق — تم حفظ (${completedBlocks}) كتل مكتملة في شجرة CDM`
              : `Previous stream interrupted — (${completedBlocks}) completed blocks preserved in CDM`}
          </span>
        </div>
        {resumePrompt && (
          <p className="text-xs text-[#3730A3] dark:text-[#C7D2FE]">{resumePrompt}</p>
        )}
      </div>
      <Button variant="primary" onClick={onContinue} disabled={isContinuing}>
        {isContinuing
          ? isAr
            ? 'جارٍ استكمال التوليد...'
            : 'Continuing generation...'
          : isAr
          ? 'إكمال التوليد (Continue Generation)'
          : 'Continue Generation'}
      </Button>
    </div>
  );
}
