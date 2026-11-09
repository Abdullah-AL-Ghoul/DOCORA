'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Sparkles,
  LayoutTemplate,
  UploadCloud,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ListOrdered,
  AlertCircle,
  FileCheck2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { DocumentLocale } from '@/lib/cdm/schema';
import { Badge, Button } from '@/components/primitives';
import { WorkspaceShell } from '@/components/composites/WorkspaceShell';

type CreationMode = 'select' | 'ai-prompt' | 'template' | 'import';

export function DocumentCreationWizardView({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  const router = useRouter();
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [mode, setMode] = useState<CreationMode>('select');
  const [promptText, setPromptText] = useState('');
  const [docType, setDocType] = useState('contract');
  const [docTone, setDocTone] = useState('formal');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<string[] | null>(null);

  // Pre-computed structured outline for the prompt preview
  const handleGenerateOutline = () => {
    if (!promptText.trim()) return;
    setIsGeneratingOutline(true);
    setTimeout(() => {
      setIsGeneratingOutline(false);
      if (isAr) {
        setGeneratedOutline([
          '1. ديباجة الاتفاقية والتعريف بالأطراف القانونية والالتزامات',
          '2. نطاق الخدمات البرمجية ومواصفات الأداء التقني SLA',
          '3. هيكل التعويضات والرسوم وسياسة الدفعات المستحقة',
          '4. سرية المعلومات وحماية البيانات والملكية الفكرية',
          '5. القانون الواجب التطبيق وآليات تسوية النزاعات والتحكيم',
        ]);
      } else {
        setGeneratedOutline([
          '1. Agreement Preamble, Legal Parties & Defined Representations',
          '2. Technical Scope of Services & Service Level Agreements (SLA)',
          '3. Fee Schedule, Payment Milestones & Invoicing Protocol',
          '4. Confidentiality, Data Protection & Intellectual Property',
          '5. Governing Law, Dispute Resolution & Arbitration Terms',
        ]);
      }
    }, 400);
  };

  return (
    <WorkspaceShell locale={locale}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Badge tone="accent">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>{isAr ? 'معالج إنشاء المستندات CDM v1.2' : 'CDM v1.2 Document Wizard'}</span>
          </Badge>
          <h1 data-testid="new-doc-wizard-heading" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {isAr ? 'إنشاء مستند مؤسسي جديد' : 'Create New Document'}
          </h1>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
            {isAr
              ? 'اختر الطريقة الأنسب لبدء صياغة المستند: محرر فارغ، مساعدة ذكية بالمخطط، نموذج جاهز، أو استيراد ملف'
              : 'Select how you want to begin: blank canvas, AI guided intent, institutional template, or file import'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div
          role="tablist"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          aria-label={isAr ? 'طرق إنشاء المستند' : 'Document creation methods'}
        >
          {[
            {
              id: 'select',
              label: isAr ? 'مستند فارغ' : 'Blank Document',
              icon: FileText,
            },
            {
              id: 'ai-prompt',
              label: isAr ? 'صياغة ذكية بالـ AI' : 'AI Generation',
              icon: Sparkles,
            },
            {
              id: 'template',
              label: isAr ? 'نماذج معتمدة' : 'Templates',
              icon: LayoutTemplate,
            },
            {
              id: 'import',
              label: isAr ? 'استيراد PDF' : 'Import PDF',
              icon: UploadCloud,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                data-testid={`creation-mode-${tab.id === 'select' ? 'canvas' : tab.id === 'ai-prompt' ? 'intent' : tab.id}`}
                aria-selected={active}
                onClick={() => setMode(tab.id as CreationMode)}
                className={`flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl border p-3.5 text-center text-xs font-semibold transition-all ${
                  active
                    ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4338CA] shadow-xs dark:bg-[#1E1B4B] dark:text-[#818CF8]'
                    : 'border-[#CBD5E1] bg-[#FFFFFF] text-[#475569] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#94A3B8]'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode A: Blank Document */}
        {mode === 'select' && (
          <div className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-8 text-center space-y-6 dark:border-[#1E293B] dark:bg-[#11131A]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#1E1B4B] dark:text-[#818CF8]">
              <FileText className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold">
                {isAr ? 'البدء برقعة تحرير فارغة (A4 Blank Studio)' : 'Start with a Blank A4 Canvas'}
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                {isAr
                  ? 'افتح استوديو التحرير مباشرة مع هيكل صفحة A4 قياسية جاهزة للكتابة اليدوية أو استدعاء الوكلاء متى شئت.'
                  : 'Open the Document Studio directly with standard A4 margins, ready for manual drafting or invoking AI on demand.'}
              </p>
            </div>
            <Link href={`/${locale}/documents/exec-contract-ar`}>
              <Button variant="primary">
                <span>{isAr ? 'فتح الاستوديو الفارغ الآن' : 'Open Blank Studio'}</span>
                <ArrowIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        )}

        {/* Mode B: AI Prompt & Outline Preview */}
        {mode === 'ai-prompt' && (
          <div className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 space-y-6 dark:border-[#1E293B] dark:bg-[#11131A]">
            <div className="space-y-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#4F46E5]" />
                <span>{isAr ? 'صف ما تحتاجه في المستند' : 'Describe What You Need'}</span>
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {isAr
                  ? 'يقوم محرك Intent بفهم هدفك وبناء مخطط هيكلي متكامل (Outline) قبل بدء توليد المحتوى الفعلي.'
                  : 'DOCORA analyzes your intent and proposes a structured outline for your approval before drafting.'}
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                data-testid="intent-prompt-textarea"
                aria-label={isAr ? 'وصف المستند المطلوب' : 'Document prompt'}
                placeholder={
                  isAr
                    ? 'مثال: صياغة عقد اتفاقية توريد خدمات برمجية وحلول سحابية بين شركة تقنية وجهة حكومية مع بنود حماية البيانات والـ SLA...'
                    : 'Example: Draft an enterprise cloud software supply agreement with data sovereignty clauses and 99.9% uptime SLA...'
                }
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-hidden dark:border-[#334155] dark:bg-[#090A0F] dark:text-[#F8FAFC]"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#475569] dark:text-[#94A3B8]">
                    {isAr ? 'نوع المستند المؤسسي' : 'Document Type'}
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full min-h-11 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-xs text-[#0F172A] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
                  >
                    <option value="contract">{isAr ? 'عقد أو اتفاقية قانونية' : 'Legal Contract / Agreement'}</option>
                    <option value="report">{isAr ? 'تقرير مجلس إدارة أو دراسة' : 'Board Report / Strategic Study'}</option>
                    <option value="policy">{isAr ? 'سياسة حوكمة أو لائحة' : 'Corporate Policy / Governance'}</option>
                    <option value="brief">{isAr ? 'ملخص تنفيذي أو خطة عمل' : 'Executive Brief / Memo'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#475569] dark:text-[#94A3B8]">
                    {isAr ? 'نبرة الصياغة' : 'Editorial Tone'}
                  </label>
                  <select
                    value={docTone}
                    onChange={(e) => setDocTone(e.target.value)}
                    className="w-full min-h-11 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-xs text-[#0F172A] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
                  >
                    <option value="formal">{isAr ? 'رسمي وقانوني صارم' : 'Formal & Legally Rigorous'}</option>
                    <option value="executive">{isAr ? 'تنفيذي ومختصر' : 'Executive & Concise'}</option>
                    <option value="technical">{isAr ? 'تقني ومفصل' : 'Technical & Exhaustive'}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleGenerateOutline}
                  disabled={!promptText.trim() || isGeneratingOutline}
                  data-testid="intent-outline-preview-btn"
                >
                  <ListOrdered className="h-4 w-4" />
                  <span>
                    {isGeneratingOutline
                      ? (isAr ? 'جاري بناء المخطط...' : 'Generating Structure...')
                      : (isAr ? 'معاينة المخطط الهيكلي للمستند' : 'Preview Document Outline')}
                  </span>
                </Button>
                <Link href={`/${locale}/studio?doc=exec-contract-ar`}>
                  <Button
                    variant="primary"
                    data-testid="intent-generate-btn"
                  >
                    <span>{isAr ? 'بدء الصياغة بالاستوديو' : 'Start Studio Generation'}</span>
                    <ArrowIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {generatedOutline && (
                <div className="space-y-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-5 dark:border-[#065F46] dark:bg-[#064E3B]/20">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#047857] dark:text-[#34D399]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isAr ? 'المخطط الهيكلي المعتمد للمستند' : 'Approved Document Outline'}</span>
                  </div>

                  <ul className="space-y-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                    {generatedOutline.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#047857] dark:text-[#34D399]">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <Link href={`/${locale}/studio?doc=exec-contract-ar`}>
                      <Button variant="primary">
                        <span>{isAr ? 'تأكيد والبدء في التوليد بالاستوديو' : 'Proceed to Generation in Studio'}</span>
                        <ArrowIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setGeneratedOutline(null)}>
                      {isAr ? 'إعادة ضبط' : 'Reset'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode C: Templates */}
        {mode === 'template' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                id: 'exec-contract-ar',
                title: isAr ? 'اتفاقية توريد خدمات سحابية ومؤسسية' : 'Enterprise Cloud Services Agreement',
                category: isAr ? 'عقود تجارية' : 'Commercial Contract',
                desc: isAr
                  ? 'نموذج عقد معتمد يتضمن بنود مستوى الخدمة SLA، حوكمة البيانات، وحماية الملكية الفكرية والتحكيم.'
                  : 'Standard corporate contract including SLA metrics, data sovereignty, IP rights, and arbitration clauses.',
                words: '1,420 words',
              },
              {
                id: 'board-report-en',
                title: isAr ? 'تقرير مجلس الإدارة ربع السنوي للتقنية' : 'Quarterly Strategic Board Report',
                category: isAr ? 'تقارير تنفيذية' : 'Executive Report',
                desc: isAr
                  ? 'تقرير شامل لإحاطة القيادة بالأداء المالي للتقنية، المخاطر السيبرانية، ومشاريع التحول المؤسسي.'
                  : 'Comprehensive leadership briefing covering IT financial ROI, cyber resilience, and digital transformation.',
                words: '1,850 words',
              },
            ].map((tmpl) => (
              <div
                key={tmpl.id}
                className="flex flex-col justify-between rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-5 shadow-xs transition-shadow hover:shadow-md dark:border-[#1E293B] dark:bg-[#11131A]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge tone="verified">
                      <FileCheck2 className="h-3 w-3" />
                      <span>{tmpl.category}</span>
                    </Badge>
                    <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{tmpl.words}</span>
                  </div>
                  <h4 className="text-base font-bold leading-snug">{tmpl.title}</h4>
                  <p className="text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8]">{tmpl.desc}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F1F5F9] dark:border-[#1E293B]">
                  <Link href={`/${locale}/documents/${tmpl.id}`}>
                    <Button variant="secondary" className="w-full">
                      <span>{isAr ? 'استخدام هذا النموذج' : 'Use This Template'}</span>
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mode D: Import PDF */}
        {mode === 'import' && (
          <div className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-8 text-center space-y-6 dark:border-[#1E293B] dark:bg-[#11131A]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFFBEB] text-[#92400E] dark:bg-[#451A03] dark:text-[#FBBF24]">
              <UploadCloud className="h-7 w-7" aria-hidden="true" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold">
                {isAr ? 'استيراد مستند PDF رقمي (Digital PDF Extraction)' : 'Import Digital PDF Document'}
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                {isAr
                  ? 'يدعم DOCORA استخراج النصوص والجداول من ملفات PDF الرقمية وتحويلها إلى كتل CDM v1.2 قابلة للتحرير.'
                  : 'DOCORA extracts text and tables from selectable digital PDFs directly into editable CDM v1.2 blocks.'}
              </p>
            </div>

            <div className="mx-auto max-w-sm rounded-xl border-2 border-dashed border-[#CBD5E1] p-6 text-xs text-[#64748B] dark:border-[#334155] dark:text-[#94A3B8]">
              <p>{isAr ? 'اسحب وأفلت ملف PDF هنا أو انقر للاختيار' : 'Drag and drop PDF file here, or click to browse'}</p>
              <p className="mt-1 text-[11px] text-[#94A3B8]">{isAr ? 'الحد الأقصى: 10 ميغابايت (PDF رقمي فقط)' : 'Max size: 10MB (Selectable text only)'}</p>
            </div>

            <div className="mx-auto max-w-md rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-start text-xs text-[#92400E] dark:border-[#78350F] dark:bg-[#451A03]/30 dark:text-[#FBBF24]">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{isAr ? 'تنويه الأمان والنزاهة الهندسية' : 'Integrity & Limitations Notice'}</span>
              </div>
              <p className="mt-1 leading-relaxed">
                {isAr
                  ? 'الملفات الممسوحة ضوئياً كصور (Scanned OCR) مجدولة في المرحلة 03 (Phase 03). المستندات الرقمية فقط مدعومة حالياً.'
                  : 'Scanned image-based PDFs require OCR scheduled for Phase 03. Only digital PDFs with embedded text layers are supported.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
