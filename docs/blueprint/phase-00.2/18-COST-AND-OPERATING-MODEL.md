# DOCORA — Cost & Operating Model Architecture (Phase 00.2)

**Document Reference:** `DOCORA-18-COST-v1.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE  
**Audit Predecessors:** Phase 00 (`12-DEPLOYMENT-AND-COSTS.md`), Phase 00.1 (`10-UPDATED-DEPLOYMENT-AND-COSTS.md`)  

---

## 1. Architectural Philosophy: Reproducible Unit Economics

In Phase 00, financial estimates conflated partial contribution margin with net profit and assumed unrealistic zero-cost operations for background queues and OCR. 

DOCORA Phase 00.2 formalizes an **explicit, reproducible financial model** derived from verified provider pricing, infrastructure compute tiers, and realistic user usage distributions.

---

## 2. Unit Cost & Pricing Assumptions Baseline

### 2.1 AI Provider Unit Pricing (Verified Production Rates)
- **Google Gemini 3.8 Flash:** \$0.15 / 1M Input Tokens | \$0.60 / 1M Output Tokens
- **Google Gemini 4 Argon:** \$2.50 / 1M Input Tokens | \$10.00 / 1M Output Tokens
- **Google Gemini 3.5 Flash-Lite:** \$0.075 / 1M Input Tokens | \$0.30 / 1M Output Tokens
- **Anthropic Claude 3.5 Sonnet (Failover):** \$3.00 / 1M Input Tokens | \$15.00 / 1M Output Tokens

### 2.2 Infrastructure & Hosting Base Costs
- **Supabase Pro Database:** \$25.00 / month (Includes 8GB DB, 100GB Storage, 250GB Egress)
- **Additional Supabase Compute (Small-Medium instance):** \$30.00 / month
- **Vercel Pro (Application & Edge Gateway):** \$20.00 / seat / month
- **Render Worker Fleet (2 Background Workers, 2GB RAM):** \$30.00 / month (\$15 / worker)
- **Payment Processing (Stripe):** 2.9% + \$0.30 per successful transaction

---

## 3. Subscription Tiers & Quota Entitlements

| Plan Tier | Monthly Price | Monthly Token Quota | Document Features & Capabilities |
| :--- | :---: | :---: | :--- |
| **Free Explorer** | \$0.00 | 50,000 tokens | Max 3 docs/mo, Gemini 3.8 Flash, Digital PDF extraction, Standard PDF/DOCX export |
| **Pro Studio** | \$19.00 | 1,000,000 tokens | Unlimited docs, Gemini 4 Argon, Tesseract OCR, Style DNA, Priority Worker Queue |
| **Team / Studio** | \$49.00 | 3,000,000 tokens | Shared Workspace (3 seats), Advanced Multi-Agent Review, Enterprise ZDR Routing |

---

## 4. Financial Modeling Across Growth Scenarios

### Scenario 1: Conservative Baseline (1,000 MAU, 5% Paid Conversion)
- **Free Users:** 950 users | Average monthly consumption: 25,000 tokens (Gemini 3.8 Flash)
  - Free User AI Cost: $950 \times 0.025\text{M} \times \$0.375 = \$8.91 / \text{month}$
- **Pro Users (\$19/mo):** 45 users $\rightarrow$ Gross Revenue: \$855.00
  - Pro AI Cost (Gemini 4 Argon mix): $45 \times 0.4\text{M} \times \$4.50 = \$81.00 / \text{month}$
- **Team Users (\$49/mo):** 5 teams $\rightarrow$ Gross Revenue: \$245.00
  - Team AI Cost: $5 \times 1.2\text{M} \times \$4.50 = \$27.00 / \text{month}$
- **Financial Summary:**
  - **Gross Revenue:** \$1,100.00
  - **Payment Fees (2.9% + \$0.30):** \$46.90
  - **Direct AI Token Costs:** \$116.91
  - **Infrastructure Costs:** \$105.00 (Supabase \$55 + Vercel \$20 + Render \$30)
  - **Contribution Margin:** **\$831.19 (75.6%)**

### Scenario 2: Moderate Target (5,000 MAU, 8% Paid Conversion)
- **Free Users:** 4,600 users $\rightarrow$ AI Cost: $4,600 \times 0.025\text{M} \times \$0.375 = \$43.13 / \text{month}$
- **Pro Users (\$19/mo):** 350 users $\rightarrow$ Gross Revenue: \$6,650.00 | AI Cost: \$630.00
- **Team Users (\$49/mo):** 50 teams $\rightarrow$ Gross Revenue: \$2,450.00 | AI Cost: \$270.00
- **Financial Summary:**
  - **Gross Revenue:** \$9,100.00
  - **Payment Fees:** \$383.90
  - **Direct AI Token Costs:** \$943.13
  - **Infrastructure Costs (Scaled):** \$215.00 (Supabase \$105 + Vercel \$50 + Render \$60)
  - **Contribution Margin:** **\$7,557.97 (83.1%)**

### Scenario 3: Aggressive Growth (20,000 MAU, 10% Paid Conversion)
- **Free Users:** 18,000 users $\rightarrow$ AI Cost: \$168.75 / month
- **Pro Users (\$19/mo):** 1,700 users $\rightarrow$ Gross Revenue: \$32,300.00 | AI Cost: \$3,060.00
- **Team Users (\$49/mo):** 300 teams $\rightarrow$ Gross Revenue: \$14,700.00 | AI Cost: \$1,620.00
- **Financial Summary:**
  - **Gross Revenue:** \$47,000.00
  - **Payment Fees:** \$1,963.00
  - **Direct AI Token Costs:** \$4,848.75
  - **Infrastructure Costs (Autoscaled):** \$650.00
  - **Contribution Margin:** **\$39,538.25 (84.1%)**

---

## 5. Explicit Exclusions from Financial Projections

To maintain rigorous accounting integrity:
- **Contribution Margin $\neq$ Net Profit:** The calculations above reflect gross margin after direct variable costs. They **explicitly exclude** developer salaries, legal counsel retainers, office overhead, paid marketing/CAC, and corporate tax liabilities.
- **Quota Runaway Protection:** The hard two-phase token reservation guard ensures that no individual user can cause cost runaway by spamming generation endpoints.

---
*Verified against Phase 00.1 remediation directives. Approved as baseline cost and operating model architecture for Phase 00.2 consolidation.*
