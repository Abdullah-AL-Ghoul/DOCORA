# DOCORA — AI Document Studio (Phase 01 MVP Foundation v2.0)

منصة **DOCORA** هي استوديو مستندات ذكي ثنائي الاتجاه (`Arabic RTL` / `English LTR`) مبني وفق المعمارية المنقحة والمعتمدة (**Plan v2.0**) مع التزام صارم بقاعدة **Zero Phase Leakage**.

---

## 1. المبادئ الهندسية المطبقة في `Phase 01 (MVP)`

1. **الفصل الصارم للمراحل (`Zero Phase Leakage`):**
   - تحتوي `supabase/migrations/` حصرياً على ملفات الترحيل الأربعة الخاصة بالمرحلة الأولى:
     - `0001_iam_and_profiles.sql`
     - `0002_entitlements_and_token_ledger.sql`
     - `0003_documents_and_cdm_versions.sql`
     - `0004_pgmq_export_jobs.sql`
   - تم تأجيل ميزات `Phase 02` (موجه النماذج المتقدم، نظام الوكلاء الـ 9، محرك الجودة ذي الـ 14 بُعداً)، و `Phase 03` (`Tesseract 5.5.4 OCR`، `Style DNA`)، و `Phase 04` (`Skills Registry`، مساحات عمل الفرق) بالكامل إلى مراحلها المخصصة دون أي تسرب للمخططات أو الأكواد.

2. **بوابة إثبات جدوى الصفحات (`Stage 01.0 Pagination PoC` & `ADR-001`):**
   - اختبارات إثبات الجدوى المعزولة في `tests/poc/pagination-poc.test.ts` تغطي الحالات الخمس الحرجة:
     1. تقسيم الفقرات الطويلة عبر صفحتين.
     2. ربط العناوين بالفقرة التالية (`keep-with-next`).
     3. تقسيم الجداول متعددة الصفحات مع تكرار صف الترويسة (`repeatedHeaderRow`).
     4. الحفاظ على اتجاه النصوص المختلطة (`RTL/LTR` والأرقام).
     5. استمرارية تحديد المؤشر والنسخ عبر فواصل الصفحات.
   - في واجهة الاستوديو: الجمع بين **المحرر المهيكل المستمر (`Continuous Structured Editor`)** و **معاينة الصفحات الطباعية الحية المتزامنة (`Synchronized Live Paged Print Preview`)**.

3. **تحصين دفتر الرموز (`Token Ledger Security` — `0002_entitlements_and_token_ledger.sql`):**
   - دوال `SECURITY DEFINER SET search_path = ''` مع تأهيل كافة الجداول بـ `public.`.
   - سحب الصلاحيات (`REVOKE ALL`) من `PUBLIC` و `anon`.
   - اشتقاق هوية المستخدم حصرياً من `auth.uid()` في `reserve_tokens`، وقفل الصف (`SELECT ... FOR UPDATE`) لمنع السباق المزدوج، مع تسوية واسترداد ذري عبر `service_role`.

4. **دقة التصدير المزدوج (`docx@9.15.2` + `Puppeteer Vector PDF`) وعامل الخلفية (`workers/`):**
   - تثبيت الإصدار الدقيق `docx@9.15.2` مع تفعيل `visuallyRightToLeft` (`<w:bidiVisual/>`) للجداول العربية، و `bidirectional` للفقرات، و `rightToLeft` مع `RunFonts` (`IBM Plex Sans Arabic`, `Noto Naskh Arabic`).
   - خدمة عمال خلفية مستقلة (`workers/`) تدير الحجز (`Lease`), نبضات القلب (`Heartbeat`), رموز التسييج (`fencing_token`), وطابور الرسائل الميتة (`DLQ`).

5. **التسعير الرسمي للنماذج وشفافية `store: false`:**
   - `gemini-3.5-flash-lite`: `$0.30 / $2.50` لكل مليون رمز.
   - `gemini-3.8-flash`: `$0.75 / $3.75` لكل مليون رمز.
   - `gemini-4-argon`: `$2.00 / $10.00` (حتى 30 نوفمبر 2026) و `$4.00 / $20.00` (من 1 ديسمبر 2026)، غير متاح في الباقة المجانية (`Free Tier`).
   - توثيق وتطبيق تعارض `store: false` مع `background: true` و `previous_interaction_id`، واستكمال التوليد محلياً عبر `Continue Generation`.

---

## 2. أوامر التشغيل والاختبار

```powershell
# تشغيل اختبارات الوحدات وإثبات الجدوى والأمان (Vitest)
$env:CI="true"; npm test

# فحص الأنواع الصارم (TypeScript)
npx tsc --noEmit

# البناء الإنتاجي (Next.js 16.4.5)
npm run build

# اختبارات النهاية إلى النهاية والوصولية (Playwright + axe-core)
npm run test:e2e
```
