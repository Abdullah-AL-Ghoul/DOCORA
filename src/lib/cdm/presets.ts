import { CdmDocument } from './schema';

export const PRESET_DOCUMENTS: Record<string, CdmDocument> = {
  'exec-contract-ar': {
    cdmVersion: '1.2.0',
    id: 'exec-contract-ar',
    title: 'عقد عمل تنفيذي واتفاقية عدم منافسة — Executive Employment Contract',
    locale: 'ar',
    defaultDirection: 'rtl',
    category: 'legal',
    requiresLegalDisclaimer: true,
    pageSetup: {
      paperSize: 'A4',
      marginTopMm: 20,
      marginBottomMm: 20,
      marginStartMm: 22,
      marginEndMm: 22,
    },
    generationState: {
      status: 'COMPLETE',
      completedBlockCount: 8,
    },
    sourceAnchors: [
      {
        anchorId: 'src-labor-law-83',
        sourceTitle: 'نظام العمل ولائحته التنفيذية — المادة (83) حماية الأسرار التجارية وعدم المنافسة',
        excerpt: 'يشترط لصحة شرط عدم المنافسة أن يكون محرراً ومحدداً من حيث الزمان والمكان ونوع العمل بما لا يتجاوز سنتين (24 شهراً).',
        pageOrClause: 'المادة 83 / الفقرة 1',
      },
      {
        anchorId: 'src-wps-policy-2026',
        sourceTitle: 'لائحة نظام حماية الأجور المؤسسي (WPS) ومعايير SLA التنفيذية',
        excerpt: 'تصرف الرواتب الأساسية الشهرية عبر نظام حماية الأجور WPS مع ربط الحوافز السنوية بتحقيق توافر تشغيلي >= 99.95%.',
        pageOrClause: 'البند المالي 4.2',
      },
    ],
    provenanceCitations: [
      {
        citationId: 'cit-exec-1',
        blockId: 'p-nda',
        claimText: 'عدم المنافسة وحماية الخوارزميات لمدة (24) شهراً وفق المادة 83 ومعايير ISO/IEC 27001',
        sourceAnchorId: 'src-labor-law-83',
        verified: true,
      },
      {
        citationId: 'cit-exec-2',
        blockId: 'tbl-comp',
        claimText: 'صرف الراتب عبر نظام حماية الأجور WPS وحوافز SLA >= 99.95%',
        sourceAnchorId: 'src-wps-policy-2026',
        verified: true,
      },
    ],
    blocks: [
      {
        id: 'h-1',
        type: 'heading',
        level: 1,
        direction: 'rtl',
        keepWithNext: true,
        text: 'عقد عمل تنفيذي واتفاقية سرية وعدم منافسة',
      },
      {
        id: 'callout-legal',
        type: 'callout',
        tone: 'legal',
        direction: 'rtl',
        title: 'إشعار الامتثال والتوثيق القياسي (CDM v1.2)',
        text: 'تم تنظيم هذا العقد وفق أحكام نظام العمل المعمول به، مع ضبط اتجاه الجداول العربية (bidiVisual) وترقيم البنود ثنائي الاتجاه.',
      },
      {
        id: 'p-intro',
        type: 'paragraph',
        direction: 'rtl',
        align: 'start',
        runs: [
          {
            text: 'إنه في يوم الأحد الموافق 8 نوفمبر 2026م، تم الاتفاق والتراضي في مدينة الرياض بين كل من: ',
            marks: [],
          },
          {
            text: '(1) شركة الأفق للتقنيات المتقدمة ذ.م.م (CR: 1010998877)',
            marks: [{ type: 'bold' }],
          },
          {
            text: ' ويشار إليها فيما بعد بـ "الطرف الأول"، و ',
            marks: [],
          },
          {
            text: '(2) المهندس/ طارق بن عبد العزيز المنصور',
            marks: [{ type: 'bold' }],
          },
          {
            text: ' بصفته الرئيس التنفيذي للهندسة (VP of Engineering) ويشار إليه بـ "الطرف الثاني".',
            marks: [],
          },
        ],
      },
      {
        id: 'h-2',
        type: 'heading',
        level: 2,
        direction: 'rtl',
        keepWithNext: true,
        text: 'البند الأول: المخصصات المالية والبدلات السنوية',
      },
      {
        id: 'tbl-comp',
        type: 'table',
        direction: 'rtl',
        bidiVisual: true,
        caption: 'جدول رقم (1): تفصيل الأجر الأساسي والبدلات ومؤشرات الأداء السنوية',
        rows: [
          {
            id: 'r-1',
            cells: [
              { id: 'c-1-1', text: 'البند المالي', direction: 'rtl', align: 'start', isHeader: true },
              { id: 'c-1-2', text: 'الدورية والوصف التعاقدي', direction: 'rtl', align: 'start', isHeader: true },
              { id: 'c-1-3', text: 'القيمة (SAR)', direction: 'ltr', align: 'end', isHeader: true },
            ],
          },
          {
            id: 'r-2',
            cells: [
              { id: 'c-2-1', text: 'الراتب الأساسي الشهري', direction: 'rtl', align: 'start', isHeader: false },
              { id: 'c-2-2', text: 'يُصرف في نهاية كل شهر ميلادي عبر نظام حماية الأجور WPS', direction: 'rtl', align: 'start', isHeader: false },
              { id: 'c-2-3', text: '48,000.00 SAR', direction: 'ltr', align: 'end', isHeader: false },
            ],
          },
          {
            id: 'r-3',
            cells: [
              { id: 'c-3-1', text: 'بدل السكن والانتقال', direction: 'rtl', align: 'start', isHeader: false },
              { id: 'c-3-2', text: 'نسبة 35% شاملة بدل السكن السنوي والسيارة التنفيذية', direction: 'rtl', align: 'start', isHeader: false },
              { id: 'c-3-3', text: '16,800.00 SAR', direction: 'ltr', align: 'end', isHeader: false },
            ],
          },
          {
            id: 'r-4',
            cells: [
              { id: 'c-4-1', text: 'حوافز الأداء التقني (SLA >= 99.95%)', direction: 'rtl', align: 'start', isHeader: false },
              { id: 'c-4-2', text: 'تُستحق سنوياً عند تحقيق مؤشرات الأداء المعتمدة من مجلس الإدارة', direction: 'rtl', align: 'start', isHeader: false },
              { id: 'c-4-3', text: '180,000.00 SAR', direction: 'ltr', align: 'end', isHeader: false },
            ],
          },
        ],
      },
      {
        id: 'h-3',
        type: 'heading',
        level: 2,
        direction: 'rtl',
        keepWithNext: true,
        text: 'البند الثاني: الملكية الفكرية وعدم المنافسة وحماية البيانات',
      },
      {
        id: 'p-nda',
        type: 'paragraph',
        direction: 'rtl',
        align: 'start',
        runs: [
          {
            text: 'يلتزم الطرف الثاني بالحفاظ على سرية كافة الخوارزميات والنماذج اللغوية ووثائق Architecture Blueprints الخاصة بالطرف الأول طوال مدة العقد ولمدة (24) شهراً بعد انتهائه، مع الالتزام الكامل بمعايير ISO/IEC 27001 وسياسات عدم الاحتفاظ بالبيانات.',
            marks: [],
          },
        ],
      },
      {
        id: 'sig-1',
        type: 'signature',
        direction: 'rtl',
        firstPartyLabel: 'عن الطرف الأول (صاحب العمل)',
        firstPartyName: 'شركة الأفق للتقنيات المتقدمة ذ.م.م',
        secondPartyLabel: 'عن الطرف الثاني (الموظف التنفيذي)',
        secondPartyName: 'م. طارق بن عبد العزيز المنصور',
        dateLabel: 'التاريخ: 2026-11-08',
      },
    ],
  },
  'board-report-en': {
    cdmVersion: '1.2.0',
    id: 'board-report-en',
    title: 'Q4 Institutional Architecture & Financial Readiness Memorandum',
    locale: 'en',
    defaultDirection: 'ltr',
    category: 'financial',
    requiresLegalDisclaimer: false,
    pageSetup: {
      paperSize: 'A4',
      marginTopMm: 20,
      marginBottomMm: 20,
      marginStartMm: 22,
      marginEndMm: 22,
    },
    generationState: {
      status: 'COMPLETE',
      completedBlockCount: 6,
    },
    sourceAnchors: [
      {
        anchorId: 'src-gemini-pricing-2026',
        sourceTitle: 'Official Gemini API Standard Pricing & ADR-003 Governance Schedule',
        excerpt: 'gemini-3.5-flash-lite ($0.30/$2.50), gemini-3.8-flash ($0.75/$3.75), gemini-4-argon ($2.00/$10.00 until Nov 30, 2026; $4.00/$20.00 from Dec 1, 2026).',
        pageOrClause: 'ADR-003 Section 3.7',
      },
    ],
    provenanceCitations: [
      {
        citationId: 'cit-board-1',
        blockId: 'en-tbl',
        claimText: 'Official Gemini API Standard Tier Pricing & Phase Allocation',
        sourceAnchorId: 'src-gemini-pricing-2026',
        verified: true,
      },
    ],
    blocks: [
      {
        id: 'en-h1',
        type: 'heading',
        level: 1,
        direction: 'ltr',
        keepWithNext: true,
        text: 'Q4 Institutional Architecture & Financial Readiness Memorandum',
      },
      {
        id: 'en-callout',
        type: 'callout',
        tone: 'verified',
        direction: 'ltr',
        title: 'Audit Verification — Phase 01 Foundation',
        text: 'All database ledger reservations, OOXML bidirectional tables, and vector PDF pipelines passed deterministic verification.',
      },
      {
        id: 'en-p1',
        type: 'paragraph',
        direction: 'ltr',
        align: 'start',
        runs: [
          {
            text: 'This memorandum summarizes unit economics, token reservation controls, and multi-region export telemetry across MENA and European enterprise tenants for Q4 2026.',
            marks: [],
          },
        ],
      },
      {
        id: 'en-h2',
        type: 'heading',
        level: 2,
        direction: 'ltr',
        keepWithNext: true,
        text: '1. Official Model Pricing & Quota Governance',
      },
      {
        id: 'en-tbl',
        type: 'table',
        direction: 'ltr',
        bidiVisual: false,
        caption: 'Table 1: Official Gemini API Standard Tier Pricing & Phase Allocation',
        rows: [
          {
            id: 'er-1',
            cells: [
              { id: 'ec-1', text: 'Model ID', direction: 'ltr', align: 'start', isHeader: true },
              { id: 'ec-2', text: 'Input / 1M Tokens', direction: 'ltr', align: 'end', isHeader: true },
              { id: 'ec-3', text: 'Output / 1M Tokens', direction: 'ltr', align: 'end', isHeader: true },
              { id: 'ec-4', text: 'Phase & Tier Rule', direction: 'ltr', align: 'start', isHeader: true },
            ],
          },
          {
            id: 'er-2',
            cells: [
              { id: 'ec-5', text: 'gemini-3.5-flash-lite', direction: 'ltr', align: 'start', isHeader: false },
              { id: 'ec-6', text: '$0.30', direction: 'ltr', align: 'end', isHeader: false },
              { id: 'ec-7', text: '$2.50', direction: 'ltr', align: 'end', isHeader: false },
              { id: 'ec-8', text: 'Phase 01/02 Fast Classification', direction: 'ltr', align: 'start', isHeader: false },
            ],
          },
          {
            id: 'er-3',
            cells: [
              { id: 'ec-9', text: 'gemini-3.8-flash', direction: 'ltr', align: 'start', isHeader: false },
              { id: 'ec-10', text: '$0.75', direction: 'ltr', align: 'end', isHeader: false },
              { id: 'ec-11', text: '$3.75', direction: 'ltr', align: 'end', isHeader: false },
              { id: 'ec-12', text: 'Phase 01 Primary Studio Engine', direction: 'ltr', align: 'start', isHeader: false },
            ],
          },
          {
            id: 'er-4',
            cells: [
              { id: 'ec-13', text: 'gemini-4-argon', direction: 'ltr', align: 'start', isHeader: false },
              { id: 'ec-14', text: '$2.00 ($4.00 Dec 1+)', direction: 'ltr', align: 'end', isHeader: false },
              { id: 'ec-15', text: '$10.00 ($20.00 Dec 1+)', direction: 'ltr', align: 'end', isHeader: false },
              { id: 'ec-16', text: 'Phase 02 Paid Tiers Only (No Free Tier)', direction: 'ltr', align: 'start', isHeader: false },
            ],
          },
        ],
      },
      {
        id: 'en-sig',
        type: 'signature',
        direction: 'ltr',
        firstPartyLabel: 'Prepared By',
        firstPartyName: 'Architecture & Security Committee',
        secondPartyLabel: 'Approved By',
        secondPartyName: 'Chief Operating Officer',
        dateLabel: 'Date: 2026-11-08',
      },
    ],
  },
  'interrupted-draft-ar': {
    cdmVersion: '1.2.0',
    id: 'interrupted-draft-ar',
    title: 'مسودة مذكرة تفاهم تقنية (توليد متوقف قابل للاستكمال)',
    locale: 'ar',
    defaultDirection: 'rtl',
    category: 'executive',
    requiresLegalDisclaimer: true,
    pageSetup: {
      paperSize: 'A4',
      marginTopMm: 20,
      marginBottomMm: 20,
      marginStartMm: 22,
      marginEndMm: 22,
    },
    generationState: {
      status: 'INTERRUPTED',
      completedBlockCount: 2,
      lastCompletedBlockId: 'int-p1',
      resumeContextPrompt: 'استكمال البند الثالث: حوكمة أمن المعلومات ومستوى الخدمة SLA والجدول المالي.',
    },
    sourceAnchors: [],
    provenanceCitations: [],
    blocks: [
      {
        id: 'int-h1',
        type: 'heading',
        level: 1,
        direction: 'rtl',
        keepWithNext: true,
        text: 'مذكرة تفاهم للتكامل السحابي وأمن الوثائق المؤسسية',
      },
      {
        id: 'int-p1',
        type: 'paragraph',
        direction: 'rtl',
        align: 'start',
        runs: [
          {
            text: 'البند الأول والثاني (تم حفظهما في شجرة CDM قبل انقطاع الاتصال): اتفق الطرفان على ربط بوابة المستندات المؤمنة وفق معيار التشفير القياسي، وتحديد نطاق التزامات كل طرف.',
            marks: [],
          },
        ],
      },
    ],
  },
};
