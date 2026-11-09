'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Sliders,
  Shield,
  Coins,
  Palette,
  CheckCircle2,
  Lock,
  Globe,
  Sparkles,
  AlertTriangle,
  FileText,
  Clock,
  LogOut,
  Info,
} from 'lucide-react';
import { DocumentLocale } from '@/lib/cdm/schema';
import { Badge, Button } from '@/components/primitives';
import { WorkspaceShell } from '@/components/composites/WorkspaceShell';

type SettingsTab = 'profile' | 'preferences' | 'editor' | 'security' | 'usage' | 'roadmap';

export function UserSettingsView({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Form states
  const [displayName, setDisplayName] = useState(isAr ? 'عبدالله محمد' : 'Abdallah Mohammed');
  const [email] = useState('architect@docora.internal');
  const [defaultDir, setDefaultDir] = useState<'rtl' | 'ltr'>('rtl');
  const [defaultView, setDefaultView] = useState<'paged' | 'continuous' | 'split'>('paged');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <WorkspaceShell locale={locale}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div>
          <h1 data-testid="settings-heading" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {isAr ? 'إعدادات الحساب ومساحة العمل' : 'Settings & Account'}
          </h1>
          <p className="mt-1 text-sm text-[#475569] dark:text-[#94A3B8]">
            {isAr
              ? 'إدارة الهوية المهنية، تفضيلات المحرر ثنائي الاتجاه، رصيد التوكنز، والأمان'
              : 'Manage professional profile, bilingual editor preferences, token balance, and security'}
          </p>
        </div>

        {/* Executive Telemetry Overview Bar */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div data-testid="token-balance-display" className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xs dark:border-[#1E293B] dark:bg-[#11131A]">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{isAr ? 'رصيد التوكنز الذري المتاح' : 'Two-Phase Token Balance'}</p>
            <p className="text-xl font-extrabold text-[#047857] dark:text-[#34D399] mt-1">94,200 <span className="text-xs font-normal text-[#475569] dark:text-[#94A3B8]">tokens</span></p>
          </div>
          <div data-testid="active-sessions-section" className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xs dark:border-[#1E293B] dark:bg-[#11131A]">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{isAr ? 'حالة الجلسة والأمان' : 'Security & Session Status'}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Supabase Auth RLS</span>
              <Badge tone="verified"><span>{isAr ? 'نشطة' : 'Active'}</span></Badge>
            </div>
          </div>
          <div data-testid="phase03-roadmap-notice" className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xs dark:border-[#1E293B] dark:bg-[#11131A]">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{isAr ? 'خارطة طريق المرحلة 03 (Roadmap)' : 'Phase 03 Roadmap'}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span data-testid="feature-badge-style-dna" className="rounded-md bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-bold text-[#92400E] dark:bg-[#451A03] dark:text-[#FBBF24]">Style DNA</span>
              <span data-testid="feature-badge-skills-registry" className="rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]">Skills Registry</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#CBD5E1] dark:border-[#1E293B]">
          <div
            role="tablist"
            className="flex flex-wrap gap-2 pb-2"
            aria-label={isAr ? 'أقسام الإعدادات' : 'Settings tabs'}
          >
            {[
              { id: 'profile', label: isAr ? 'الملف التعريفي' : 'Profile', icon: User },
              { id: 'preferences', label: isAr ? 'التفضيلات واللغة' : 'Preferences', icon: Sliders },
              { id: 'editor', label: isAr ? 'تخصيص المحرر' : 'Editor', icon: FileText },
              { id: 'security', label: isAr ? 'الأمان والجلسات' : 'Security', icon: Shield },
              { id: 'usage', label: isAr ? 'الحصص والتوكنز' : 'Usage & Quota', icon: Coins },
              { id: 'roadmap', label: isAr ? 'الميزات القادمة (P03)' : 'Roadmap (P03)', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#4F46E5] text-[#FFFFFF]'
                      : 'text-[#475569] hover:bg-[#F1F5F9] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save confirmation banner */}
        {isSaved && (
          <div className="flex items-center gap-2 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-xs font-semibold text-[#047857] dark:border-[#065F46] dark:bg-[#064E3B]/30 dark:text-[#34D399]">
            <CheckCircle2 className="h-4 w-4" />
            <span>{isAr ? 'تم حفظ التفضيلات بنجاح' : 'Preferences saved successfully'}</span>
          </div>
        )}

        {/* Content Tab: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 space-y-6 dark:border-[#1E293B] dark:bg-[#11131A]">
            <h3 className="text-base font-bold">{isAr ? 'البيانات الشخصية والمؤسسية' : 'Personal & Institutional Info'}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="user-display-name-input" className="block text-xs font-semibold mb-1 text-[#475569] dark:text-[#94A3B8]">
                  {isAr ? 'الاسم الظاهر في المستندات' : 'Display Name'}
                </label>
                <input
                  id="user-display-name-input"
                  aria-label={isAr ? 'الاسم الظاهر في المستندات' : 'Display Name'}
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full min-h-11 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-xs text-[#0F172A] dark:border-[#334155] dark:bg-[#090A0F] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label htmlFor="user-email-input" className="block text-xs font-semibold mb-1 text-[#475569] dark:text-[#94A3B8]">
                  {isAr ? 'البريد الإلكتروني المعتمد' : 'Email Address'}
                </label>
                <input
                  id="user-email-input"
                  aria-label={isAr ? 'البريد الإلكتروني المعتمد' : 'Email Address'}
                  type="email"
                  value={email}
                  disabled
                  className="w-full min-h-11 rounded-lg border border-[#CBD5E1] bg-[#F1F5F9] px-3 text-xs text-[#64748B] cursor-not-allowed dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#94A3B8]"
                />
                <p className="mt-1 text-[11px] text-[#475569] dark:text-[#94A3B8]">{isAr ? 'البريد محمي بواسطة Supabase Auth' : 'Email is managed securely by Supabase Auth'}</p>
              </div>
            </div>

            <Button type="submit" variant="primary">
              <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
            </Button>
          </form>
        )}

        {/* Content Tab: Preferences */}
        {activeTab === 'preferences' && (
          <form onSubmit={handleSave} className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 space-y-6 dark:border-[#1E293B] dark:bg-[#11131A]">
            <h3 className="text-base font-bold">{isAr ? 'تفضيلات اللغة والاتجاه الافتراضي' : 'Language & Direction Preferences'}</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label htmlFor="default-dir-select" className="block text-xs font-semibold mb-1 text-[#475569] dark:text-[#94A3B8]">
                  {isAr ? 'الاتجاه الافتراضي للمستندات الجديدة' : 'Default Direction for New Documents'}
                </label>
                <select
                  id="default-dir-select"
                  aria-label={isAr ? 'الاتجاه الافتراضي للمستندات الجديدة' : 'Default Direction for New Documents'}
                  value={defaultDir}
                  onChange={(e) => setDefaultDir(e.target.value as 'rtl' | 'ltr')}
                  className="w-full min-h-11 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-xs text-[#0F172A] dark:border-[#334155] dark:bg-[#090A0F] dark:text-[#F8FAFC]"
                >
                  <option value="rtl">{isAr ? 'من اليمين لليسار (RTL - العربية)' : 'Right-to-Left (RTL - Arabic)'}</option>
                  <option value="ltr">{isAr ? 'من اليسار لليمين (LTR - English)' : 'Left-to-Right (LTR - English)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[#475569] dark:text-[#94A3B8]">
                  {isAr ? 'لغة الواجهة الحالية' : 'Interface Language'}
                </label>
                <div className="flex items-center gap-2">
                  <Link
                    href={isAr ? '/en/settings' : '/ar/settings'}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-4 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{isAr ? 'التبديل إلى English (LTR)' : 'Switch to العربية (RTL)'}</span>
                  </Link>
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary">
              <span>{isAr ? 'حفظ التفضيلات' : 'Save Preferences'}</span>
            </Button>
          </form>
        )}

        {/* Content Tab: Editor */}
        {activeTab === 'editor' && (
          <form onSubmit={handleSave} className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 space-y-6 dark:border-[#1E293B] dark:bg-[#11131A]">
            <h3 className="text-base font-bold">{isAr ? 'تخصيص سلوك استوديو التحرير' : 'Studio Editor Configuration'}</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label htmlFor="default-view-select" className="block text-xs font-semibold mb-1 text-[#475569] dark:text-[#94A3B8]">
                  {isAr ? 'طريقة العرض الافتراضية' : 'Default View Mode'}
                </label>
                <select
                  id="default-view-select"
                  aria-label={isAr ? 'طريقة العرض الافتراضية' : 'Default View Mode'}
                  value={defaultView}
                  onChange={(e) => setDefaultView(e.target.value as 'paged' | 'continuous' | 'split')}
                  className="w-full min-h-11 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-xs text-[#0F172A] dark:border-[#334155] dark:bg-[#090A0F] dark:text-[#F8FAFC]"
                >
                  <option value="paged">{isAr ? 'معاينة ورقة A4 الفيزيائية (Paged A4)' : 'Physical A4 Paged Simulation'}</option>
                  <option value="continuous">{isAr ? 'رقعة تحرير مستمرة (Continuous Canvas)' : 'Continuous Focused Canvas'}</option>
                  <option value="split">{isAr ? 'عرض متزامن ثنائي (Synchronized Split View)' : 'Synchronized Split View'}</option>
                </select>
              </div>

              <div className="rounded-lg border border-[#CBD5E1] p-3 text-xs text-[#64748B] dark:border-[#334155] dark:text-[#94A3B8]">
                <p className="font-semibold">{isAr ? 'الحفظ التلقائي الصريح' : 'Honest Autosave'}</p>
                <p className="mt-1 leading-relaxed">
                  {isAr
                    ? 'يتم حفظ كافة التعديلات تلقائياً بمعدل 300ms بعد كل تعديل، مع تأكيد فوري بحالة المزامنة.'
                    : 'All changes are autosaved with debounced 300ms persistence and honest status reporting.'}
                </p>
              </div>
            </div>

            <Button type="submit" variant="primary">
              <span>{isAr ? 'حفظ إعدادات المحرر' : 'Save Editor Settings'}</span>
            </Button>
          </form>
        )}

        {/* Content Tab: Security */}
        {activeTab === 'security' && (
          <div className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 space-y-6 dark:border-[#1E293B] dark:bg-[#11131A]">
            <h3 className="text-base font-bold">{isAr ? 'أمان الحساب والجلسات النشطة' : 'Account Security & Active Sessions'}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-[#CBD5E1] p-4 dark:border-[#334155]">
                <div className="space-y-1">
                  <p className="text-xs font-bold">{isAr ? 'الجلسة الحالية' : 'Current Active Session'}</p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    {isAr ? 'متصفح Chrome على نظام Windows 11 (محمي بـ Supabase Auth)' : 'Chrome on Windows 11 (Protected by Supabase Auth)'}
                  </p>
                </div>
                <Badge tone="verified">
                  <span>{isAr ? 'نشطة الآن' : 'Active'}</span>
                </Badge>
              </div>

              <div className="pt-2">
                <Button variant="danger" size="sm">
                  <LogOut className="h-4 w-4" />
                  <span>{isAr ? 'تسجيل الخروج من كافة الجلسات' : 'Sign Out of All Sessions'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab: Usage & Quota */}
        {activeTab === 'usage' && (
          <div className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 space-y-6 dark:border-[#1E293B] dark:bg-[#11131A]">
            <h3 className="text-base font-bold">{isAr ? 'استهلاك الحصص ودفتر التوكنز الذري (Two-Phase Token Ledger)' : 'Token Ledger & Quota Telemetry'}</h3>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 dark:border-[#1E293B] dark:bg-[#090A0F]">
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{isAr ? 'إجمالي الحصة الشهرية' : 'Monthly Allowance'}</p>
                <p className="text-xl font-extrabold mt-1">100,000 <span className="text-xs font-normal text-[#475569] dark:text-[#94A3B8]">tokens</span></p>
              </div>

              <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 dark:border-[#1E293B] dark:bg-[#090A0F]">
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{isAr ? 'الرصيد المتاح حالياً' : 'Available Balance'}</p>
                <p className="text-xl font-extrabold text-[#047857] dark:text-[#34D399] mt-1">94,200 <span className="text-xs font-normal text-[#475569] dark:text-[#94A3B8]">tokens</span></p>
              </div>

              <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 dark:border-[#1E293B] dark:bg-[#090A0F]">
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{isAr ? 'المحجوز في العمليات الجارية' : 'Reserved in Flight'}</p>
                <p className="text-xl font-extrabold text-[#4F46E5] mt-1">0 <span className="text-xs font-normal text-[#475569] dark:text-[#94A3B8]">tokens</span></p>
              </div>
            </div>

            <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-xs text-[#047857] dark:border-[#065F46] dark:bg-[#064E3B]/20 dark:text-[#34D399]">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>{isAr ? 'الضمان المالي الذري: لا خصم دون تسليم ناجح' : 'Two-Phase Atomic Ledger Protection'}</span>
              </div>
              <p className="mt-1 leading-relaxed">
                {isAr
                  ? 'يعتمد DOCORA آلية الحجز المسبق والتسوية (Reserve & Settle). في حال انقطاع التوليد أو فشل الاستجابة، يعود الرصيد المحجوز فوراً إلى حسابك دون أي خصم.'
                  : 'DOCORA uses a two-phase ledger. If an AI call is interrupted or fails, reserved tokens are automatically refunded with zero deduction.'}
              </p>
            </div>
          </div>
        )}

        {/* Content Tab: Roadmap (Phase 03 Future Capabilities) */}
        {activeTab === 'roadmap' && (
          <div className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 space-y-6 dark:border-[#1E293B] dark:bg-[#11131A]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{isAr ? 'الميزات القادمة — المرحلة 03 (Phase 03 Roadmap)' : 'Upcoming Capabilities (Phase 03 Roadmap)'}</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  {isAr ? 'ميزات مجدولة تتطلب موافقة صريحة وترقية البنية التحتية' : 'Planned features requiring explicit user consent and upgraded workers'}
                </p>
              </div>
              <Badge tone="accent">
                <span>{isAr ? 'قيد التطوير' : 'In Roadmap'}</span>
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#CBD5E1] p-4 opacity-75 dark:border-[#334155]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold">{isAr ? 'بصمة الأسلوب الشخصي (Style DNA Voice Learning)' : 'Personal Style DNA Voice Matching'}</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {isAr ? 'تدريب نماذج أسلوبية على صياغاتك المفضلة بموافقة صريحة وبدون مشاركة البيانات.' : 'Learn personal writing voice with strict explicit consent and Zero Data Retention.'}
                    </p>
                  </div>
                  <Badge tone="warning">
                    <span>Phase 03</span>
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-[#CBD5E1] p-4 opacity-75 dark:border-[#334155]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold">{isAr ? 'التعرف الضوئي على المستندات المصورة (Multimodal OCR Engine)' : 'Multimodal Scanned OCR Engine'}</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {isAr ? 'محرك استخراج النصوص والجداول من الصور والـ PDF الممسوح ضوئياً.' : 'Tesseract and vision-based extraction from scanned PDFs and document images.'}
                    </p>
                  </div>
                  <Badge tone="warning">
                    <span>Phase 03</span>
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
