# DOCORA — Arabic & English (RTL/LTR) Parity Audit
## 07. Bidirectional Layout, Typography & Microcopy Verification

**System:** DOCORA — AI Document Studio  
**Languages Tested:** Arabic (`/ar`, `dir="rtl"`), English (`/en`, `dir="ltr"`)  
**Standard:** Unicode Bidirectional Algorithm (UAX#9) & W3C Internationalization (i18n)

---

### 1. Linguistic & Directional Parity Matrix

| View / Feature | Arabic (`/ar`, RTL) State | English (`/en`, LTR) State | Bidi Layout Alignment |
| :--- | :--- | :--- | :--- |
| **Landing Page** | `dir="rtl"`, Arabic headline, right-aligned nav | `dir="ltr"`, English headline, left-aligned nav | **PASS** (100% mirrored) |
| **Features Page** | Arabic architectural explanations | English technical specifications | **PASS** (100% mirrored) |
| **How It Works** | RTL numbered lifecycle pipeline (1 $\to$ 5) | LTR numbered lifecycle pipeline (1 $\to$ 5) | **PASS** (Flow direction inverted) |
| **Technical FAQ** | RTL accordion indicators (`ChevronDown`) | LTR accordion indicators | **PASS** (Proper end alignment) |
| **Legal Pages** | Arabic PDPL legal terminology | English GDPR terminology | **PASS** (Culturally adapted) |
| **Authentication** | Arabic form labels, RTL password toggle | English form labels, LTR password toggle | **PASS** (Input icons start/end aligned) |
| **Dashboard** | RTL metric cards, right-aligned charts | LTR metric cards, left-aligned charts | **PASS** (Stat numbers isolated) |
| **Document Library** | Arabic category tabs, RTL search input | English category tabs, LTR search input | **PASS** (Search icon at `start-3`) |
| **Creation Wizard** | RTL mode selector cards, Arabic outline | LTR mode selector cards, English outline | **PASS** (Checkmark & bullet points aligned) |
| **Document Studio** | RTL toolbar, right sidebar for agents | LTR toolbar, left sidebar for agents | **PASS** (A4 margins inverted) |
| **User Settings** | RTL tabs, Arabic direction select | LTR tabs, English direction select | **PASS** (Form grid aligned) |

---

### 2. Unicode Bidirectional (UAX#9) Metric & Table Isolation

In bilingual document authoring, embedding Latin numerals, percentages, and currencies inside Arabic sentences often produces scrambled punctuation (e.g., parenthesis flipping or decimal point displacement).

DOCORA implements three levels of isolation:
1. **Logical Span Wrapping**: Technical terms, percentages, and metrics use explicit `dir="ltr"` inline wrappers (e.g., `<span dir="ltr">94,200 tokens</span>`).
2. **OOXML `bidiVisual` Tables**: In the Word compilation engine (`src/app/api/documents/[id]/export/route.ts`), table rows in Arabic documents are stamped with `w:bidiVisual`, ensuring that columns order logically from right to left in Microsoft Word without manual user adjustment.
3. **Number Formatting**: Western Arabic digits (`0, 1, 2, ... 9`) are isolated with Unicode directional formatting characters (LRM / RLM) where mixed with Arabic currency symbols.

---

### 3. Institutional Microcopy vs. Machine Translation

Generic translations often destroy enterprise credibility. DOCORA enforces authentic legal and operational microcopy:

| Context | Poor / Machine-Translated Phrasing | DOCORA Authentic Arabic Phrasing | Rationale |
| :--- | :--- | :--- | :--- |
| **Deletion Action** | حذف المستند (Delete Document) | **نقل إلى سلة المحذوفات (Move to Trash)** | Accurately describes the 30-day soft-delete retention window. |
| **Confirmation** | حسناً / موافق (OK / Confirm) | **تأكيد والبدء في التوليد بالاستوديو** | Rule: Banned ambiguous labels in favor of explicit actions. |
| **Autosave** | تم الحفظ (Saved) | **تم الحفظ التلقائي الصريح (Honest Autosave)** | Reassures the user of debounced persistent storage. |
| **Export Gate** | التصدير مغلق (Export Closed) | **محظور بواسطة بوابات الجودة (Hard Gate BLOCKED)** | Communicates that an automated compliance failure prevents export. |
| **Token Refund** | إعادة الأموال (Refund Money) | **تسوية ذرية: لا خصم دون تسليم ناجح** | Clarifies the Two-Phase Ledger financial guarantee. |
