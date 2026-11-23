# Life Admin Dashboard - Feature Status & Roadmap

> "For I am about to do something new. See, I have already begun! Do you not see it? I will make a pathway through the wilderness. I will create rivers in the dry wasteland." — Isaiah 43:19 (NLT)

## 🧭 Purpose

Life Admin Dashboard is a **personal governance system**, not a productivity app. It replaces daily micromanagement with quarterly clarity, identity-anchored planning, and milestone-based execution.

**You are no longer managing life. You are stewarding it.**

---

## ❌ Features Removed (Final Cuts)

The following features have been **permanently removed** as they create noise, guilt, and fragmentation incompatible with the Stewardship Cadence:

- ❌ **Daily tasks** (removed from dashboard, legacy route kept for migration)
- ❌ **Sprint planning** (removed from dashboard, legacy route kept for migration)
- ❌ **Habit streaks** (removed from dashboard, legacy route kept for migration)
- ❌ **Weekly/monthly reviews** (replaced by Quarterly Audit Engine)
- ❌ **Daily journaling** (merged into Christian Life)
- ❌ **Reading progress tracking** (merged into Personal Growth, no progress bars)
- ❌ **Notifications** (removed from Navbar, except immigration deadlines handled in Immigration module)
- ❌ **Technical Growth as standalone module** (merged into Employment)
- ❌ **Relational Insights dashboards** (merged into Personal Growth)
- ❌ **Standalone Analytics dashboards** (removed)

**Status**: ❌ ** Not yet Removed from navigation and dashboard** (January 2025)

---

## 🔁 Feature Merges (Completed)

| Old Feature | New Home | Status |
|------------|----------|--------|
| Profile, Vision Boards | **Identity** | ✅ Merged |
| Career, Technical Growth, Projects | **Employment** | ✅ Merged |
| Engineering Wins | **Employment** | ✅ Merged |
| Financial Tracking | **Finance** | ✅ Merged |
| Spiritual Life, Journals | **Christian Life** | ✅ Merged |
| Books, Relational Patterns | **Personal Growth** | ✅ Merged |

**Status**: ✅ **Navigation structure updated** (January 2025)

---

## 🧱 The Core Seven Pillars

### 1. 🧭 Identity (North Star)

**Purpose**: Define who you are becoming and filter everything else accordingly.

**Status**: 🟡 **PARTIALLY IMPLEMENTED** - Needs redesign for stewardship model

#### ✅ Currently Implemented
- Card-based layout for core values, principles, strengths, growth areas
- Identity statement (text field)
- Vision boards (short-term and long-term)
- Edit mode with auto-save
- Profile management with avatar

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Yearly Manifesto** (serif font, prominent display)
- [ ] **Quarterly Identity Statement** (locked per quarter, read-only for past quarters)
- [ ] **Identity Proof Log** (1 photo per pillar per quarter, Polaroid-style gallery)
- [ ] **Evidence of Grace** (testimony archive, cross-pillar)
- [ ] **Quarterly locking** (schema-level enforcement)
- [ ] **Read-only mode** for past quarters
- [ ] **Serif font** for manifesto and scripture sections

**Design Requirements**:
- Serif font for manifesto and scripture
- Locked quarterly identity statement
- Polaroid-style gallery for Identity Proofs

---

### 2. 💼 Employment (Vocation Mastery)

**Purpose**: Track technical growth as a compounding asset, not a checklist.

**Status**: 🟡 **PARTIALLY IMPLEMENTED** - Needs redesign for stewardship model

#### ✅ Currently Implemented
- Career goals tracking
- Skills roadmap (proficiency levels)
- Role tracking (current, next, dream)
- Resume versions
- Feedback notes
- Interview prep notes
- Career milestones
- Engineering documentation (ADRs, design decisions)
- Engineering wins (problems solved, features shipped)
- Project tracking (status, GitHub links, deployment links)

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Quarterly OKRs** (Objectives and Key Results)
- [ ] **Mermaid.js roadmap** (code editor input, real-time rendering, stored as text blobs)
- [ ] **Skill Spike card** (locked per quarter, visually emphasized in roadmap)
- [ ] **Impact Log** (auto-generates Yearly Brag Sheet)
- [ ] **Work-Altar Note** (Avodah: work as worship)
- [ ] **Quarterly locking** (schema-level enforcement)
- [ ] **Read-only mode** for past quarters

**Design Requirements**:
- Mermaid.js rendering for Employment roadmap
- Skill Spike card locked per quarter
- Impact Log auto-summarizes to Yearly Brag Sheet

---

### 3. 💰 Finance (Stewardship)

**Purpose**: Provide quarterly financial clarity without obsession.

**Status**: 🟢 **MOSTLY IMPLEMENTED** - Needs quarterly snapshot focus

#### ✅ Currently Implemented
- Net worth snapshots (assets, liabilities breakdown)
- Asset allocation tracking
- Savings goals (including emergency fund)
- Investments portfolio (stocks, bonds, crypto, real estate)
- Budget categories (weekly/monthly/yearly)
- Transactions (income/expense with recurring)
- Financial dashboard (overview, health indicators)
- Cash flow view (monthly income vs expenses)
- CSV import with duplicate detection

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Snapshot-driven dashboard** (no transaction feeds, focus on snapshots)
- [ ] **Sparkline trends** (visual trend indicators)
- [ ] **Giving / Saving / Investing Ratios** (prominent display)
- [ ] **Yearly Wealth Goals** (separate from savings goals)
- [ ] **Quarterly Financial Reflection** (part of Quarterly Audit)
- [ ] **Evidence of Grace** (financial breakthroughs, cross-pillar)
- [ ] **Quarterly locking** (schema-level enforcement)
- [ ] **Read-only mode** for past quarters

**Design Requirements**:
- Snapshot-driven dashboard
- Sparkline trends
- No transaction feeds on main view

---

### 4. 🛂 Immigration (Risk & Precision)

**Purpose**: Reduce anxiety through timeline clarity and proactive risk mitigation.

**Status**: 🟢 **WELL IMPLEMENTED** - Needs automation enhancements

#### ✅ Currently Implemented
- Multi-year status timeline (case type, current status, dates)
- Document checklist (status: missing/uploaded/submitted, expiry tracking)
- Deadlines & reminders (filing deadlines, biometrics, renewals, critical flags)
- Case notes (lawyer advice, USCIS updates, personal observations)
- Uploaded documents (Azure Blob Storage with SAS URLs)
- Visa/application milestones (filed, received, biometrics, approved/denied)
- Dashboard widget (shows current deadlines with proximity indicators)

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Filing Window Visualizer** (Opening, Stewardship, Deadline phases)
- [ ] **Expiry Engine** (color-coded status, automated alerts)
- [ ] **Contingency Logic** (Plan B surfaced only when needed)
- [ ] **Quarterly Immigration Brief** (part of Quarterly Audit)
- [ ] **Azure Logic Apps automation** (monthly safety scan, escalation alerts)
- [ ] **Evidence of Grace** (unexpected approvals, divine timing)
- [ ] **Quarterly locking** (schema-level enforcement)

**Design Requirements**:
- Timeline-first interface
- Filing Window Visualizer
- Expiry Engine with color-coded status
- Contingency Logic (Plan B only when needed)

**Azure Requirements**:
- Logic Apps for immigration expiry alerts
- Automated escalation when documents ≤ 30 days from deadline and not submitted

---

### 5. 🧠 Health (Capacity & Sustainability)

**Purpose**: Track energy and stress trends to prevent burnout.

**Status**: 🟡 **PARTIALLY IMPLEMENTED** - Needs quarterly focus, remove daily inputs

#### ✅ Currently Implemented
- Health logs (exercise, sleep, energy level, notes)
- Health goals (create, edit, delete, track progress)
- Trends visualization (sleep trends, energy level trends)
- Nutrition notes (meals, calories, macros)
- Weight / vitals tracking (blood pressure, heart rate)
- Mental health check-ins (score, mood, stress level)

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Quarterly Health Snapshot** (replaces daily inputs)
- [ ] **Fitness Benchmarks** (quarterly tracking, not daily)
- [ ] **Capacity vs Demand Reflection** (quarterly assessment)
- [ ] **Trend charts** (Energy, Sleep, Stress - no daily inputs)
- [ ] **Evidence of Grace** (healing, rest breakthroughs)
- [ ] **Quarterly locking** (schema-level enforcement)
- [ ] **Read-only mode** for past quarters

**Design Requirements**:
- Trend charts (Energy, Sleep, Stress)
- No daily inputs
- Capacity Reflection field

---

### 6. ✝️ Christian Life (Formation & Faithfulness)

**Purpose**: Anchor your life in spiritual rhythms, not performance metrics.

**Status**: 🟡 **PARTIALLY IMPLEMENTED** - Needs redesign for stewardship model

#### ✅ Currently Implemented
- Spiritual goals (create, track progress, status)
- Prayer/meditation logs (duration, notes)
- Scriptures/affirmations storage (source, tags, favorites)
- Spiritual reflections (daily/weekly entries with prompts)
- Reflection prompts (system-wide and user-specific)
- Journal entries (rich text, categories, mood, tags)

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Rule of Life** (Upward, Inward, Withward, Outward - cross layout display)
- [ ] **Scripture Anchors** (prominent display, Isaiah 43:19 pinned at top)
- [ ] **Intercession & Legacy Log** (prayer requests, legacy tracking)
- [ ] **Work-Altar Note** (Avodah: work as worship, shared with Employment)
- [ ] **Quarterly Spiritual Audit** (Selah Questions)
- [ ] **Grace Log** (moments of divine intervention)
- [ ] **Calmest UI in the system** (maximum whitespace, no charts)
- [ ] **Quarterly locking** (schema-level enforcement)
- [ ] **Read-only mode** for past quarters

**Design Requirements**:
- Calmest UI in the system
- Isaiah 43:19 pinned at top
- Rule of Life displayed as a cross layout
- Maximum whitespace
- No charts in spiritual sections

---

### 7. 📚 Personal Growth (Character & Learning)

**Purpose**: Integrate learning, relationships, and reflection beyond career.

**Status**: 🟡 **PARTIALLY IMPLEMENTED** - Needs redesign for stewardship model

#### ✅ Currently Implemented
- Books (reading list, currently reading, completed)
- Book notes, highlights, quotes, takeaways
- Reading goals (books per year/month, category goals)
- Relationship journal entries (free-form, taggable, date-based)
- Conflict reflections (trigger, responses, outcome, lessons)
- Communication patterns tracking
- Boundaries notes (boundary set/violated/held/compromised)
- Lessons learned (reflective takeaways)

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Learning Themes** (thematic organization, not book-by-book)
- [ ] **Book Archive** (no progress bars, no streaks)
- [ ] **Relational Pattern Reflections** (integrated view)
- [ ] **Character Formation Notes** (reflection-heavy)
- [ ] **Quarterly Growth Audit** (part of Quarterly Audit Engine)
- [ ] **Evidence of Grace** (mentorship, breakthroughs)
- [ ] **Thematic organization** (not chronological)
- [ ] **No streaks or progress bars**
- [ ] **Quarterly locking** (schema-level enforcement)
- [ ] **Read-only mode** for past quarters

**Design Requirements**:
- Thematic organization
- Reflection-heavy
- No streaks or progress bars

---

## 🔄 Quarterly Audit Engine (Heartbeat)

**Purpose**: Drive the next quarter with honest reflection and strategic clarity.

**Status**: ❌ **NOT IMPLEMENTED** - Critical for v1.0

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Wizard-style form** (step-by-step quarterly audit)
- [ ] **Side-by-side Vision vs Reality** (comparison view)
- [ ] **Auto-promote "Start" items** to next quarter's commitments
- [ ] **Per-pillar audit sections**:
  - [ ] Vision
  - [ ] Reality
  - [ ] Gap (Delta)
  - [ ] Root Cause
  - [ ] Stop / Start / Continue
  - [ ] Next Quarter Commitments
  - [ ] Identity Proofs
  - [ ] Evidence of Grace
- [ ] **Quarterly locking trigger** (freezes current state when audit completes)
- [ ] **Immutable archive** (writes to archive before unlocking next quarter)

**Design Requirements**:
- Wizard-style form
- Side-by-side Vision vs Reality
- Auto-promotes "Start" items to next quarter

---

## 🖥️ Dashboard Layout (Home)

**Purpose**: Stewardship grid showing current focus and status for each pillar.

**Status**: 🟡 **PARTIALLY IMPLEMENTED** - Needs redesign

#### ✅ Currently Implemented
- Dashboard with widget grid
- Widgets for: Vision, Tasks, Habits, Health, Journal, Reviews, Financial, Career, Books, Immigration
- Navigation sidebar

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Header redesign**:
  - [ ] Logo (top left)
  - [ ] Quarterly Identity Statement (center, serif font)
  - [ ] Date + Progress Bar (top right, shows quarter progress)
- [ ] **Stewardship Grid** (7 tiles, one per pillar):
  - [ ] Current Focus
  - [ ] Status Indicator
  - [ ] One Insight
- [ ] **Footer**:
  - [ ] Gap Analysis Button (activates last 14 days of quarter)
  - [ ] Evidence of Grace Quick-Add ("+" icon)

**Design Requirements**:
- 7 tiles (one per pillar)
- Each tile shows: Current Focus, Status Indicator, One Insight
- Gap Analysis Button (last 14 days of quarter)
- Evidence of Grace Quick-Add

---

## 🎨 UI/UX Rules

**Status**: 🟡 **PARTIALLY IMPLEMENTED**

#### ✅ Currently Implemented
- Consistent loading states
- Error handling
- Empty states
- Card-based layouts

#### ❌ Not Yet Implemented (Required for v1.0)
- [ ] **Monochrome + 1 accent color** (Royal Blue or Sage Green)
- [ ] **Serif font** for identity, scripture, and headings
- [ ] **Sans-serif** for data
- [ ] **No infinite scroll**
- [ ] **Maximum whitespace** in Christian Life module
- [ ] **No charts** in spiritual sections

---

## 🛠️ Technical Requirements (Non-Negotiable)

### 1. The Schema of Grace (Historical Integrity)

**Status**: ❌ **NOT IMPLEMENTED** - Critical for v1.0

#### Required Implementation
- [ ] **Every pillar table must include**:
  - [ ] `snapshot_date` (timestamp)
  - [ ] `quarter` (Q1, Q2, Q3, Q4)
  - [ ] `year` (integer)
  - [ ] `is_archived` (boolean flag)
- [ ] **Quarterly freeze logic**:
  - [ ] When quarter ends, system freezes current state
  - [ ] Data written to immutable archive
  - [ ] Only then does Quarterly Audit wizard open for next quarter
- [ ] **Read-only mode** for past quarters:
  - [ ] All modules support `readOnly: true` flag for past quarters
  - [ ] UI visually distinguishes archived quarters (muted colors, lock icon)
  - [ ] No edits allowed unless current quarter is active and unlocked
  - [ ] Audit summaries and Evidence of Grace remain fully visible and exportable

**Why This Matters**: This turns the dashboard into a Living Record. You can revisit Q1 2026 while living in Q3 and see exactly how God made rivers in that wilderness — without revisionism or overwriting.

---

### 2. The Mermaid.js Vocation Component

**Status**: ❌ **NOT IMPLEMENTED** - Required for Employment module

#### Required Implementation
- [ ] **Code editor input** that accepts Mermaid syntax
- [ ] **Real-time rendering** of diagrams (career roadmap, architecture paths)
- [ ] **Diagrams stored as text blobs**, not images
- [ ] **Current quarter's Skill Spike** visually emphasized in the diagram

**Why This Matters**: Engineers think in systems and flows. Seeing your vocation as a map reinforces mastery, direction, and intentional growth.

---

### 3. The Immigration Watchdog (Peace-Protecting Automation)

**Status**: ❌ **NOT IMPLEMENTED** - Required for Immigration module

#### Required Implementation
- [ ] **Azure Logic Apps** runs monthly safety scan
- [ ] **Escalation logic**:
  - [ ] If document ≤ 30 days from hard deadline AND not marked Submitted
  - [ ] Escalate alert level
  - [ ] Visually highlight Immigration tile in distinct warning color
  - [ ] Surface Next Required Action prominently

**Why This Matters**: This protects peace of mind by catching risk before it becomes crisis.

---

## 📊 Database Schema Requirements

### Current Status
✅ **36+ tables implemented** (existing features)

### Required New Tables/Fields
- [ ] **Quarterly snapshots tables** (one per pillar):
  - [ ] `identity_snapshots` (quarter, year, is_archived, snapshot_date)
  - [ ] `employment_snapshots` (quarter, year, is_archived, snapshot_date)
  - [ ] `finance_snapshots` (quarter, year, is_archived, snapshot_date)
  - [ ] `immigration_snapshots` (quarter, year, is_archived, snapshot_date)
  - [ ] `health_snapshots` (quarter, year, is_archived, snapshot_date)
  - [ ] `christian_life_snapshots` (quarter, year, is_archived, snapshot_date)
  - [ ] `personal_growth_snapshots` (quarter, year, is_archived, snapshot_date)
- [ ] **Evidence of Grace table** (cross-pillar):
  - [ ] `evidence_of_grace` (pillar, quarter, year, description, testimony, created_at)
- [ ] **Identity Proofs table**:
  - [ ] `identity_proofs` (pillar, quarter, year, image_url, description, created_at)
- [ ] **Quarterly Audit table**:
  - [ ] `quarterly_audits` (quarter, year, pillar, vision, reality, gap, root_cause, stop_items, start_items, continue_items, next_commitments, completed_at)
- [ ] **Mermaid diagrams table**:
  - [ ] `employment_roadmaps` (quarter, year, mermaid_syntax, skill_spike, created_at, updated_at)
- [ ] **Rule of Life table**:
  - [ ] `rule_of_life` (upward, inward, withward, outward, quarter, year, updated_at)

---

## 🚦 Implementation Priority

### Phase 1: Foundation (Critical Path)
1. **Quarterly locking schema** (database migrations)
2. **Read-only mode** for past quarters (backend + frontend)
3. **Quarterly Audit Engine** (wizard form, per-pillar sections)
4. **Dashboard redesign** (7-pillar grid, header, footer)

### Phase 2: Core Pillars Redesign
1. **Identity** (Yearly Manifesto, Identity Proofs, Evidence of Grace)
2. **Employment** (Mermaid.js roadmap, Quarterly OKRs, Impact Log)
3. **Finance** (Snapshot-driven, sparkline trends, ratios)
4. **Christian Life** (Rule of Life, calmest UI, no charts)
5. **Personal Growth** (Thematic organization, no progress bars)
6. **Health** (Quarterly snapshots, capacity reflection)
7. **Immigration** (Filing Window Visualizer, Logic Apps automation)

### Phase 3: Polish & Automation
1. **UI/UX rules** (monochrome + accent, serif/sans-serif, whitespace)
2. **Azure Logic Apps** (immigration watchdog)
3. **Evidence of Grace** (cross-pillar integration)
4. **Export functionality** (quarterly summaries, testimony archive)

---

## 📝 Migration Notes

### Features to Deprecate (Keep Legacy Routes)
- Daily tasks → Archive existing data, remove from dashboard
- Sprint planning → Archive existing data, remove from dashboard
- Habit streaks → Archive existing data, remove from dashboard
- Weekly/monthly reviews → Migrate to Quarterly Audit format
- Daily journaling → Migrate entries to Christian Life
- Reading progress tracking → Remove progress bars, keep book archive
- Notifications → Remove from Navbar, keep immigration deadline logic

### Data Migration Strategy
1. **Snapshot existing state** before quarterly locking implementation
2. **Archive historical data** to snapshot tables
3. **Migrate reviews** to Quarterly Audit format
4. **Consolidate journals** into Christian Life
5. **Transform projects** into Employment milestones

---

## 🏁 Final Outcome

Life Admin Dashboard will be:
- ✅ **Calm** (no daily noise, quarterly focus)
- ✅ **Opinionated** (7 pillars, no feature bloat)
- ✅ **Identity-anchored** (everything filters through identity)
- ✅ **Spiritually grounded** (Evidence of Grace, Rule of Life)
- ✅ **Administratively precise** (quarterly locking, immutable records)
- ✅ **Grace-filled** (Living Record, not productivity metrics)

**This system doesn't ask, "Did you do enough today?"**  
**It asks, "Are you becoming who God called you to be?"**

---

## 📅 Last Updated

**January 30, 2025** - Updated to reflect Life Admin Dashboard v1.0 design (Stewardship Cadence)
