# Magpie - Product Requirements Document (PRD)
## MVP: Scholarship Platform to End All Scholarship Applications

**Version:** 1.0  
**Last Updated:** February 14, 2026  
**Status:** Ready for Development  
**Owner:** Engineering Team

---

## Executive Summary

Magpie is a scholarship discovery and application platform designed to solve the fundamental inefficiencies in the current scholarship ecosystem. The MVP focuses on three core innovations:

1. **Frictionless Onboarding** - Common App PDF import for instant profile creation
2. **Local Discovery** - AI-powered search for community, municipal, and state scholarships
3. **Knowledge Base** - Reusable essays and activities to eliminate repetitive data entry

**Target Launch:** 12 weeks from project start  
**Target Users:** High school seniors applying to college  
**Geographic Focus:** Single county/metropolitan area for MVP

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
3. [User Personas](#3-user-personas)
4. [Product Architecture](#4-product-architecture)
5. [Technical Stack](#5-technical-stack)
6. [Database Schema](#6-database-schema)
7. [User Flows](#7-user-flows)
8. [Feature Specifications](#8-feature-specifications)
9. [UI/UX Design](#9-uiux-design)
10. [Chrome Extension](#10-chrome-extension)
11. [Success Metrics](#11-success-metrics)
12. [Development Phases](#12-development-phases)
13. [Launch Criteria](#13-launch-criteria)
14. [Future Considerations](#14-future-considerations)

---

## 1. Problem Statement

### Current State

Students applying for scholarships face systemic inefficiencies:

**Pain Point 1: Information Overload**
- National platforms (Bold.org, Fastweb, Niche) aggregate thousands of scholarships
- Competition pools of 20,000-50,000+ applicants per scholarship
- Win rates < 0.1% for most national scholarships

**Pain Point 2: Repetitive Data Entry**
- Students re-enter identical information across 50+ applications
- Common fields: name, address, GPA, test scores, activities, essays
- Average time per application: 45-60 minutes
- Total time investment for 50 applications: 37.5-50 hours

**Pain Point 3: No Feedback Loop**
- 85% of scholarship applications never receive confirmation or rejection
- Students have no visibility into application status
- No way to track what they've applied to

**Pain Point 4: Local Scholarships Are Hidden**
- Community foundations, Rotary clubs, local businesses offer scholarships
- These have 20-100 applicants (vs 20,000+)
- Win rates 50-100x higher than national scholarships
- Discovery requires manual research (high school counselors, local websites)

### Market Validation

From user research:
- "I applied to 200+ scholarships on Bold.org. Won nothing." - Sarah J.
- "Typed 'describe a challenge you've overcome' 47 times." - Marcus T.
- "Never heard back. Not even a rejection email." - Priya M.

**Opportunity:** Students will pay with their data/attention for a platform that:
1. Saves them 30+ hours of repetitive work
2. Matches them with winnable (local) scholarships
3. Provides transparency and tracking

---

## 2. Solution Overview

### Product Vision

**Magpie is the last scholarship platform students will ever need.**

We solve the core problems through:

1. **Instant Onboarding** - Upload Common App PDF → Profile auto-populated in 30 seconds
2. **Local-First Discovery** - AI-powered scraping of community foundations, local businesses, state programs
3. **Knowledge Base** - Essays, activities, and responses stored with smart reuse suggestions
4. **Tracking & Transparency** - Every application tracked, deadlines monitored, status updates
5. **Chrome Extension** - Auto-fill scholarship forms on external sites (Phase 2)

### Core Value Proposition

| Problem | Magpie Solution | Competitor Approach |
|---------|----------------|-------------------|
| Re-entering info 47 times | Upload once, autofill everywhere | Manual entry every time |
| Finding local scholarships | AI scraping + manual curation | National aggregation only |
| No feedback on applications | Track every application's status | No tracking |
| Competing with 50K students | Local scholarships (20-100 applicants) | National pools |

### Non-Goals (Out of Scope for MVP)

- ❌ Direct scholarship application submission (users still apply on-site)
- ❌ National scholarship aggregation (focus on local only)
- ❌ Payment processing or premium features
- ❌ Mobile native apps (web-responsive only)
- ❌ Recommendation letter management
- ❌ Financial aid calculators or FAFSA help
- ❌ Social features (sharing, collaboration)

---

## 3. User Personas

### Primary Persona: Sarah - The Grinder

**Demographics:**
- Age: 17-18 (high school senior)
- Location: Suburban/urban area
- GPA: 3.5+ (college-bound)
- Has applied to college via Common App

**Behaviors:**
- Applies to 50+ scholarships per year
- Spends 5-10 hours/week on scholarship applications
- Frustrated by repetitive data entry
- Organized (uses spreadsheets to track deadlines)

**Pain Points:**
- "I've typed my name and GPA 100 times"
- "I never know if I actually won or lost"
- "Local scholarships are impossible to find"

**Goals:**
- Win $5,000-$15,000 in scholarships
- Minimize time spent on applications
- Maximize win rate by applying to less competitive scholarships

**Success Criteria:**
- Sarah uses Magpie to find 20+ local scholarships she didn't know existed
- She applies to 5x more scholarships in the same time (knowledge base reuse)
- She wins at least 1-2 local scholarships worth $3,000-$8,000

---

## 4. Product Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Browser    │  │ Chrome Ext   │  │   Mobile     │ │
│  │  (Desktop)   │  │  (Phase 2)   │  │  (Responsive)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Next.js 14 (App Router)                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │ Landing  │  │Onboarding│  │  Dashboard   │   │ │
│  │  │  Page    │  │  Flow    │  │   + Search   │   │ │
│  │  └──────────┘  └──────────┘  └──────────────┘   │ │
│  │                                                    │ │
│  │  ┌────────────────────────────────────────────┐  │ │
│  │  │        API Routes (Backend Logic)          │  │ │
│  │  │  /api/parse-common-app                     │  │ │
│  │  │  /api/scholarships/search                  │  │ │
│  │  │  /api/user/profile                         │  │ │
│  │  │  /api/cart                                 │  │ │
│  │  └────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │ Vercel Blob  │  │ Clerk Auth   │ │
│  │  (Supabase)  │  │ (File Store) │  │   (Users)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PDF Parser  │  │  Web Scraper │  │    Resend    │ │
│  │ (pdf-parse)  │  │ (Playwright) │  │   (Email)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**Onboarding Flow:**
```
User uploads PDF → 
  PDF-parse extracts text → 
    Regex parser converts to structured JSON → 
      Save to PostgreSQL (users, profiles, essays, activities) → 
        Redirect to Dashboard
```

**Scholarship Discovery Flow:**
```
User profile data → 
  Matching algorithm (SQL queries) → 
    Filter by: location, GPA, demographics → 
      Return ranked scholarships → 
        Display as swipeable cards
```

**Application Tracking Flow:**
```
User adds scholarship to cart → 
  Save to user_scholarships table (status: "in_cart") → 
    Display in cart/checklist view → 
      User clicks "Apply" → Update status to "applied" → 
        Track deadline and decision date
```

---

## 5. Technical Stack

### Frontend

**Framework:** Next.js 14 (App Router)
- **Rationale:** SSR for SEO, React for rich UX, API routes for backend, Vercel deployment
- **Alternative Considered:** Remix (rejected - smaller ecosystem)

**UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animations:** Framer Motion
- **Icons:** Lucide React

**State Management:**
- **Server State:** React Query (TanStack Query)
- **Client State:** Zustand (cart, filters)
- **Form State:** React Hook Form + Zod validation

**Rationale for Tailwind:** Faster development, smaller bundle size vs styled-components, better DX

### Backend

**API:** Next.js API Routes (collocated with frontend)
- **Rationale:** Monolith for MVP simplicity, can split to microservices later

**Database:** PostgreSQL 15 (hosted on Supabase)
- **ORM:** Drizzle ORM
- **Rationale:** Type-safe, faster than Prisma, excellent DX

**File Storage:** Vercel Blob Storage
- **Use Case:** PDF uploads, user-generated files
- **Rationale:** Native Vercel integration, simple pricing

### Authentication

**Provider:** Clerk
- **Features Needed:** Email/password auth, email verification, user management
- **Rationale:** Beautiful UI, handles edge cases, 10K MAU free tier

### Email

**Provider:** Resend
- **Use Case:** Email verification, deadline reminders
- **Rationale:** Modern API, 3K emails/month free, excellent DX

### Infrastructure

**Hosting:** Vercel
- **Frontend:** Edge network, automatic HTTPS
- **API Routes:** Serverless functions
- **Rationale:** Zero-config Next.js deployment, generous free tier

**Database Hosting:** Supabase
- **Rationale:** PostgreSQL + real-time features, 500MB free tier, row-level security

**Monitoring:**
- **Analytics:** Vercel Analytics (Web Vitals)
- **Error Tracking:** Sentry
- **Logging:** Vercel Logs

### PDF Processing

**Library:** pdf-parse (Node.js)
- **Approach:** Extract text → Regex parsing (not LLM for MVP)
- **Rationale:** $0 cost, fast, predictable

**Fallback:** Manual form entry if PDF parsing fails

### Scholarship Discovery Pipeline (Local Scholarships)

The scholarship data layer uses a **three-tier hybrid approach** to maximize coverage while keeping hallucination risk near zero. The core principle: LLMs are used to *read and extract from real pages*, never to *generate* scholarship information from memory.

**Tier 1 — Manual Seed Database:**
- Manually curate 50–100 verified local scholarships before any automation
- Human-verified source of truth for MVP launch
- No scraper, no LLM — just accurate data students can trust

**Tier 2 — Targeted Playwright Scraper:**
- **Tool:** Playwright (headless browser)
- **Targets:** Known high-yield sources — county community foundations, state higher-ed commission scholarship pages, Rotary/Lions/Kiwanis chapter sites, high school counselor pages
- **Frequency:** Weekly cron job
- **Storage:** Raw HTML/text saved to staging table pending extraction

**Tier 3 — AI-Assisted Extraction & Discovery:**
- **Search API:** Tavily API (or Perplexity API) used to *discover* new scholarship pages by region — the model finds URLs, not facts
- **Extraction LLM:** Claude Haiku (low cost, fast) reads scraped page content and pulls structured fields: name, organization, amount, deadline, eligibility criteria, URL
- **Hallucination mitigation:** The LLM is grounded to the actual page text — it cannot invent scholarships that don't exist on the page. Source URL is always stored alongside extracted data.
- **Human review gate:** AI-extracted scholarships land in a `scholarships_pending` staging table and require admin approval before going live in the main `scholarships` table
- **Cost estimate:** ~$0.001–0.003 per scholarship extracted with Haiku; discovery queries via Tavily ~$0.01/search

**Data Refresh:**
- Cron runs Tier 2 scraper weekly
- Tier 3 extraction triggered on new/changed pages
- Stale scholarship detection: flag records where `deadline` has passed or page returns 404

**Manual Curation:** Always the starting point for each new geographic area expanded into

---

## 6. Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   users     │───────│   profiles   │       │ scholarships │
│             │ 1:1   │              │       │              │
│ id (PK)     │       │ user_id (FK) │       │ id (PK)      │
│ email       │       │ first_name   │       │ name         │
│ clerk_id    │       │ gpa          │       │ amount       │
└─────────────┘       │ city         │       │ deadline     │
      │               │ state        │       │ min_gpa      │
      │               └──────────────┘       │ states[]     │
      │                                      └──────────────┘
      │                      │                      │
      │               ┌──────┴──────┐              │
      │               │             │              │
      ▼               ▼             ▼              │
┌─────────────┐ ┌─────────────┐ ┌──────────────┐ │
│   essays    │ │ activities  │ │user_scholar- │ │
│             │ │             │ │   ships      │◄┘
│ id (PK)     │ │ id (PK)     │ │              │
│ user_id(FK) │ │ user_id(FK) │ │ user_id (FK) │
│ topic       │ │ title       │ │ scholar (FK) │
│ text        │ │ description │ │ status       │
│ word_count  │ │ hours/week  │ │ applied_at   │
└─────────────┘ └─────────────┘ └──────────────┘
```

### Table Definitions

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  clerk_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
```

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Personal (DO NOT encrypt for MVP, add later)
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Address
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Academic
  high_school TEXT,
  graduation_year INTEGER,
  gpa DECIMAL(3,2),
  weighted_gpa DECIMAL(3,2),
  sat_score INTEGER,
  act_score INTEGER,
  class_rank TEXT, -- "15/350"
  
  -- Demographics (optional, for matching)
  gender TEXT,
  ethnicity TEXT[], -- ["hispanic", "white"]
  first_generation BOOLEAN,
  
  -- Financial (ranges only, never exact)
  agi_range TEXT, -- "under_30k", "30k_60k", "60k_100k", "over_100k"
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_location ON profiles(city, state);
```

#### `essays`
```sql
CREATE TABLE essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  topic TEXT NOT NULL, -- "leadership", "challenge", "community_service"
  word_count INTEGER,
  text TEXT NOT NULL,
  tags TEXT[], -- ["debate", "captain", "state_championship"]
  
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_essays_user_id ON essays(user_id);
CREATE INDEX idx_essays_topic ON essays(topic);
```

#### `activities`
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  position TEXT, -- "Captain", "Volunteer", etc.
  
  -- Multiple character count versions
  description_short TEXT, -- 50 chars max
  description_medium TEXT, -- 150 chars max
  description_long TEXT, -- 300+ chars
  
  hours_per_week INTEGER,
  weeks_per_year INTEGER,
  grades INTEGER[], -- [9, 10, 11, 12]
  
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
```

#### `scholarships`
```sql
CREATE TABLE scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  organization TEXT,
  amount INTEGER, -- in dollars
  deadline DATE,
  application_url TEXT NOT NULL,
  
  -- Description
  short_description TEXT, -- 200 chars for cards
  full_description TEXT,
  
  -- Eligibility Filters
  min_gpa DECIMAL(3,2),
  max_gpa DECIMAL(3,2),
  
  -- Geographic
  is_national BOOLEAN DEFAULT FALSE,
  states TEXT[], -- ["CA", "NY"] or NULL
  cities TEXT[], -- ["San Francisco", "Oakland"]
  counties TEXT[], -- ["Alameda County"]
  high_schools TEXT[], -- Specific schools only
  
  -- Demographic
  required_demographics TEXT[], -- ["first_gen", "female", "hispanic"]
  required_major TEXT[], -- ["STEM", "engineering"]
  
  -- Athletic / EC eligibility
  required_athletics TEXT[], -- ["varsity", "football", "any_sport"]
  required_ec_categories TEXT[], -- ["community_service", "arts", "stem_club"]
  
  -- Financial
  agi_max INTEGER, -- income cap (e.g., 60000)
  
  -- Requirements
  requires_essay BOOLEAN DEFAULT FALSE,
  essay_prompts TEXT[], -- ["Describe your leadership...", "..."]
  essay_word_count INTEGER, -- 500
  requires_recommendation BOOLEAN DEFAULT FALSE,
  requires_transcript BOOLEAN DEFAULT FALSE,
  requires_resume BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  source TEXT, -- "manually_entered", "scraped", "ai_extracted"
  source_url TEXT, -- always stored for AI-extracted records (hallucination audit trail)
  last_verified TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  competition_level TEXT, -- "local", "regional", "state", "national"
  estimated_applicants INTEGER, -- for ranking
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scholarships_location ON scholarships(states, cities);
CREATE INDEX idx_scholarships_deadline ON scholarships(deadline);
CREATE INDEX idx_scholarships_active ON scholarships(is_active);
```

#### `scholarships_pending` (AI Extraction Staging Table)
```sql
CREATE TABLE scholarships_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Raw source
  source_url TEXT NOT NULL,
  raw_page_text TEXT, -- full text of scraped page (ground truth)
  
  -- AI-extracted fields (mirrors scholarships table)
  extracted_data JSONB, -- full extracted scholarship JSON
  extraction_model TEXT, -- e.g. "claude-haiku-4-5"
  extraction_confidence DECIMAL(3,2), -- 0.0 - 1.0, model self-assessed confidence
  
  -- Review workflow
  status TEXT DEFAULT 'pending', -- "pending", "approved", "rejected", "needs_review"
  reviewer_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  
  -- On approval, scholarship_id is set and record moves to scholarships table
  scholarship_id UUID REFERENCES scholarships(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pending_status ON scholarships_pending(status);
CREATE INDEX idx_pending_source ON scholarships_pending(source_url);
```

#### `user_scholarships`
```sql
CREATE TABLE user_scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scholarship_id UUID REFERENCES scholarships(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL, 
  -- "saved" - bookmarked for later
  -- "in_cart" - actively planning to apply
  -- "applied" - submitted application
  -- "rejected_by_user" - swiped left, don't show again
  -- "won" - received scholarship
  -- "lost" - did not receive
  
  -- Tracking
  added_to_cart_at TIMESTAMP,
  applied_at TIMESTAMP,
  decision_date DATE,
  amount_won INTEGER, -- if won
  
  -- Notes
  user_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, scholarship_id)
);

CREATE INDEX idx_user_scholarships_user_id ON user_scholarships(user_id);
CREATE INDEX idx_user_scholarships_status ON user_scholarships(status);
CREATE INDEX idx_user_scholarships_deadline ON user_scholarships(scholarship_id, added_to_cart_at);
```

#### `extension_events` (for debugging)
```sql
CREATE TABLE extension_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  event_type TEXT, -- "form_detected", "autofill_success", "autofill_failed"
  page_url TEXT,
  data JSONB, -- flexible storage for debugging
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_extension_events_user_id ON extension_events(user_id);
CREATE INDEX idx_extension_events_type ON extension_events(event_type);
```

---

## 7. User Flows

### 7.1 Landing Page → Sign Up Flow

```
┌─────────────────────────────────────────────────────────┐
│                    LANDING PAGE                         │
│  User sees value prop, features, testimonials          │
│  Clicks: "Get Started" or "Start Finding Money"        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              CLERK SIGN UP MODAL                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  Create your account                           │    │
│  │  Email: [_______________]                      │    │
│  │  Password: [_______________]                   │    │
│  │  [✓] I agree to Terms & Privacy               │    │
│  │  [Create Account]                              │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│           EMAIL VERIFICATION (Clerk)                    │
│  "Check your email to verify your account"             │
│  User clicks link in email → Email verified            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│         REDIRECT TO ONBOARDING                          │
│         /onboarding                                     │
└─────────────────────────────────────────────────────────┘
```

**Technical Implementation:**

```tsx
// app/page.tsx (Landing Page)
import { SignUpButton } from '@clerk/nextjs';

<SignUpButton mode="modal" redirectUrl="/onboarding">
  <button>Get Started</button>
</SignUpButton>

// Clerk webhook creates user in our DB
// POST /api/webhooks/clerk
// → Create user record with clerk_id
```

### 7.2 Onboarding Flow

```
┌─────────────────────────────────────────────────────────┐
│               ONBOARDING: STEP 1                        │
│              Import or Manual Entry                     │
│                                                         │
│  [📄 Upload Common App PDF] ← RECOMMENDED              │
│              OR                                         │
│  [📝 Fill Out Manually]                                │
└─────────────────┬───────────────────────────────────────┘
                  │
          ┌───────┴───────┐
          │               │
   PDF Upload      Manual Entry
          │               │
          ▼               ▼
┌──────────────┐   ┌──────────────┐
│ PDF Upload   │   │ Manual Form  │
│ Processing   │   │ Name, GPA,   │
│              │   │ School, etc. │
│ Regex parse  │   │              │
│ → Extract    │   │ [Next]       │
│   fields     │   │              │
└──────┬───────┘   └──────┬───────┘
       │                  │
       └────────┬─────────┘
                ▼
┌─────────────────────────────────────────────────────────┐
│               ONBOARDING: STEP 2                        │
│            Confirmation / Review                        │
│                                                         │
│  We found your info! Please confirm:                   │
│  ┌────────────────────────────────────────────┐        │
│  │ Name: Sarah Johnson            [Edit]     │        │
│  │ GPA: 3.85                      [Edit]     │        │
│  │ School: Lincoln High           [Edit]     │        │
│  │ Location: San Francisco, CA    [Edit]     │        │
│  │                                            │        │
│  │ Essays (1): Personal Statement ✓          │        │
│  │ Activities (5): Debate, Volunteer, ...    │        │
│  └────────────────────────────────────────────┘        │
│                                                         │
│  [Looks Good - Continue]                               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│               ONBOARDING: STEP 3 (Optional)             │
│          Tell us more (for better matching)             │
│                                                         │
│  Demographics (optional):                              │
│  [ ] First-generation college student                  │
│  [ ] Low income (AGI < $60K)                          │
│  Ethnicity: [___] (optional)                           │
│                                                         │
│  [Skip] [Save & Continue]                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│           ONBOARDING COMPLETE                           │
│       Mark user.onboarding_completed = true             │
│       Redirect to: /dashboard                           │
└─────────────────────────────────────────────────────────┘
```

**Technical Details:**

- **PDF Upload:** POST /api/parse-common-app
  - Accepts: multipart/form-data (PDF file)
  - Returns: Parsed JSON with confidence score
  - If confidence < 70% → Show error, fallback to manual

- **Save Profile:** POST /api/user/profile
  - Creates/updates profile record
  - Creates essay records from extracted essays
  - Creates activity records from extracted activities

### 7.3 Dashboard & Search Flow

```
┌─────────────────────────────────────────────────────────┐
│                     DASHBOARD                           │
│  Welcome back, Sarah!                                   │
│                                                         │
│  ⚠️ 3 deadlines this week                              │
│  📊 In Cart: 7 | Applied: 3 | Won: $0                 │
│  🆕 12 new matches for you                             │
│                                                         │
│  [Browse Scholarships →]                               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              SCHOLARSHIP SEARCH                         │
│  Filters: [Local ✓] [State ✓] [Amount: $1K+]          │
│                                                         │
│  Showing 47 matches                                    │
│                                                         │
│  ┌──────────────────────────────────────────┐          │
│  │  CARD 1: Rotary Club Scholarship        │          │
│  │  $5,000 • Mar 15 • Local only           │          │
│  │  🟢 Low competition (20 applicants)     │          │
│  │                                          │          │
│  │  [❌ Pass]    [More Info]    [✅ Add]   │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  ← Swipe or tap to navigate →                         │
└─────────────────┬───────────────────────────────────────┘
                  │
          User clicks "Add"
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│         SCHOLARSHIP ADDED TO CART                       │
│         Status: "in_cart"                               │
│         Show next card                                  │
└─────────────────────────────────────────────────────────┘
```

**Matching Algorithm (Pseudo-SQL):**

```sql
SELECT * FROM scholarships
WHERE is_active = true
  AND deadline >= CURRENT_DATE
  AND (states IS NULL OR user.state = ANY(states))
  AND (cities IS NULL OR user.city = ANY(cities))
  AND (min_gpa IS NULL OR user.gpa >= min_gpa)
  AND (agi_max IS NULL OR user.agi_range_max <= agi_max)
  AND (
    required_demographics IS NULL 
    OR required_demographics && user.ethnicity  -- array overlap
    OR required_demographics && ARRAY[
        CASE WHEN user.first_generation THEN 'first_gen' END,
        CASE WHEN user.gender IS NOT NULL THEN user.gender END
    ]
  )
  AND (
    required_athletics IS NULL
    OR required_athletics && user.activity_tags  -- user has a matching sport/athletics EC
  )
  AND (
    required_ec_categories IS NULL
    OR required_ec_categories && user.ec_categories
  )
ORDER BY 
  -- Prioritize local over state over national
  CASE 
    WHEN user.city = ANY(cities) THEN 1
    WHEN user.state = ANY(states) THEN 2
    ELSE 3
  END,
  deadline ASC
LIMIT 50;
```

**Discovery Pipeline Flow (how scholarships enter the DB):**

```
[Tavily/Perplexity Search API]
  "scholarships [county] [state] 2026 site:*.org"
          │
          ▼ Returns URLs of candidate pages
[Playwright Scraper]
  Fetches page HTML → extracts raw text
          │
          ▼ raw_page_text stored in scholarships_pending
[Claude Haiku Extraction]
  Reads raw text, outputs structured JSON:
  { name, organization, amount, deadline, eligibility, url }
  Grounded to page content only — no recall from training
          │
          ▼ extracted_data + source_url stored in scholarships_pending
[Admin Review Queue]
  Human approves / rejects / flags needs_review
          │
          ▼ On approval: INSERT into scholarships, link scholarship_id
[Live in DB → SQL Matching → User Feed]
```

### 7.4 Cart & Application Flow

```
┌─────────────────────────────────────────────────────────┐
│                  MY CART (7 items)                      │
│  Total Potential: $43,500                              │
│  Earliest Deadline: Mar 15 (2 days!)                   │
│                                                         │
│  [Export to Spreadsheet] [Calendar View]               │
│                                                         │
│  ┌────────────────────────────────────────────┐        │
│  │ ☐ Rotary Club Scholarship                 │        │
│  │   $5,000 • Due: Mar 15 • ⚠️ 2 days        │        │
│  │                                            │        │
│  │   What you need:                           │        │
│  │   ✓ Essay (500w) → Leadership Essay [Copy]│        │
│  │   ☐ Recommendation letter                 │        │
│  │   ✓ Resume → [Download PDF]               │        │
│  │                                            │        │
│  │   [Apply Now →] [Remove from Cart]        │        │
│  └────────────────────────────────────────────┘        │
└─────────────────┬───────────────────────────────────────┘
                  │
          User clicks "Apply Now"
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│            APPLICATION HELPER                           │
│                                                         │
│  Opening: rotary.org/scholarships                      │
│                                                         │
│  From your Knowledge Base:                             │
│  ┌────────────────────────────────────────────┐        │
│  │ Leadership Essay (500 words)               │        │
│  │ [Copy to Clipboard] ✓ Copied              │        │
│  └────────────────────────────────────────────┘        │
│                                                         │
│  ┌────────────────────────────────────────────┐        │
│  │ Resume.pdf                                 │        │
│  │ [Download]                                 │        │
│  └────────────────────────────────────────────┘        │
│                                                         │
│  After you apply, come back and mark as submitted:     │
│  [✓ I Applied] [Cancel]                                │
└─────────────────┬───────────────────────────────────────┘
                  │
          Opens scholarship URL in new tab
          User applies on external site
          Returns and clicks "I Applied"
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│         UPDATE STATUS TO "APPLIED"                      │
│         applied_at = NOW()                              │
│         Move to "Applied" section                       │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Feature Specifications

### 8.1 Landing Page

**Purpose:** Convert visitors to sign-ups

**Route:** `/`

**Key Sections:**

1. **Navigation Bar**
   - Logo + "magpie" wordmark
   - "How it works" link (smooth scroll)
   - "Get Started" CTA (Clerk SignUpButton)

2. **Hero Section**
   - Headline: "Stop applying to, Start winning scholarships"
   - Subheadline: Value prop (local, no repetition, transparency)
   - Primary CTA: "Start Finding Money" (Clerk SignUpButton)
   - Secondary CTA: "See how it works" (scroll to features)
   - Stats: "$43K avg found", "12 scholarships", "5min setup"
   - Animated magpie illustration

3. **Problem Section** (dark background)
   - "You know the drill..."
   - 4 pain points with emojis
   - "The scholarship game is broken. We're fixing it. 🔧"

4. **Features Section**
   - "How Magpie works"
   - 3 cards: Import (30s), Local Discovery, Apply (1-click)
   - Each with icon, step number, description, benefit

5. **Social Proof Section**
   - "Real students, real money"
   - 3 testimonials with quote, student name, school, amount won
   - Real-looking (even if placeholder for MVP)

6. **Final CTA Section** (gradient background)
   - "Stop grinding. Start winning. 💰"
   - Large CTA button: "Get Started Free"
   - Trust signals: "No credit card • 5min setup • Actually free"

7. **Footer**
   - Logo, Privacy/Terms/Contact links
   - Copyright

**Design Requirements:**
- Mobile responsive (320px - 1920px)
- Smooth scroll behavior
- Hover states on all interactive elements
- Framer Motion animations (floating elements, fade-ins on scroll)
- Accessible (WCAG AA)

**Performance:**
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s

**Copy Tone:**
- Direct, conversational, slightly irreverent
- Avoid corporate jargon
- Speak to student frustrations directly
- Use specific numbers ($43K, 47 times, etc.)

### 8.2 Onboarding Flow

**Purpose:** Get user from sign-up to usable profile in < 5 minutes

**Routes:**
- `/onboarding` - Import or manual choice
- `/onboarding/confirm` - Review parsed data
- `/onboarding/manual` - Manual form (if no PDF)
- `/onboarding/preferences` - Optional demographics

**Step 1: Import Method**

**UI:**
```
┌────────────────────────────────────────┐
│  Let's build your profile             │
├────────────────────────────────────────┤
│                                        │
│  FASTEST (30 seconds)                 │
│  ┌──────────────────────────────────┐ │
│  │ 📄 Upload Common App PDF         │ │
│  │                                  │ │
│  │ [Drop file or click to upload]  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ────── OR ──────                     │
│                                        │
│  [📝 Fill Out Manually] (10 min)     │
│                                        │
└────────────────────────────────────────┘
```

**Requirements:**
- Accepts .pdf files only
- Max file size: 10MB
- Shows upload progress bar
- On error: "Couldn't parse. Try manual entry?"

**Step 2: PDF Processing**

**API Endpoint:** POST /api/parse-common-app

**Input:**
```typescript
{
  pdf: File // multipart/form-data
}
```

**Process:**
1. Extract text with pdf-parse
2. Parse with regex (see parseCommonApp.ts)
3. Calculate confidence score
4. Return structured JSON

**Output:**
```typescript
{
  success: boolean,
  confidence: number, // 0.0 - 1.0
  data: {
    personal: {
      firstName: string,
      lastName: string,
      email: string,
      phone: string,
      address: string,
      city: string,
      state: string,
      zip: string
    },
    academic: {
      gpa: string,
      weightedGpa?: string,
      sat?: string,
      act?: string,
      classRank?: string
    },
    activities: Array<{
      title: string,
      description: string,
      hoursPerWeek?: number,
      weeksPerYear?: number,
      grades?: number[]
    }>,
    essays: Array<{
      prompt: string,
      text: string,
      wordCount: number
    }>
  }
}
```

**Error Handling:**
- If confidence < 0.7 → Show partial data + "Some fields couldn't be parsed. Please review."
- If complete failure → Redirect to manual entry

**Step 3: Confirmation Screen**

**UI:**
```
┌────────────────────────────────────────┐
│  ✅ Review your information            │
├────────────────────────────────────────┤
│                                        │
│  PERSONAL INFO          [Edit]         │
│  Sarah Johnson                         │
│  sarah.j@email.com                    │
│  San Francisco, CA 94102              │
│                                        │
│  ACADEMIC INFO          [Edit]         │
│  Lincoln High School                   │
│  GPA: 3.85 | SAT: 1450                │
│  Class of 2026                         │
│                                        │
│  ACTIVITIES (5)         [Review]       │
│  ✓ Debate Team Captain                │
│  ✓ Volunteer Tutor                    │
│  ...                                   │
│                                        │
│  ESSAYS (1)             [View]         │
│  ✓ Personal Statement (650 words)     │
│    Saved to Knowledge Base!            │
│                                        │
│  [Everything Looks Good ✓]            │
│                                        │
└────────────────────────────────────────┘
```

**Requirements:**
- Each section expandable/editable inline
- Auto-save on edit
- "Edit" opens inline form, "Save" commits to DB
- "Everything Looks Good" → Mark onboarding_completed = true → Redirect /dashboard

**Step 4: Manual Entry (Fallback)**

**Form Fields:**
- Personal: Name, Email, Phone, Address
- Academic: High School, Grad Year, GPA, SAT/ACT
- Activities: Title, Description (textarea)
- Essays: Topic dropdown, Text (textarea)

**Progressive Disclosure:**
- Start with Personal + Academic only
- "Add Activity" button (up to 10)
- "Add Essay" button (up to 5)

**Validation:**
- Required: Name, Email, City, State, High School, Grad Year
- GPA: 0.0 - 5.0
- SAT: 400 - 1600
- ACT: 1 - 36

### 8.3 Dashboard

**Purpose:** Central hub for scholarship discovery and tracking

**Route:** `/dashboard`

**Layout:**
```
┌────────┬──────────────────────────────────────┐
│        │                                      │
│ Sidebar│          Main Content               │
│        │                                      │
│ Home   │  ┌────────────────────────────────┐ │
│ Find $ │  │ Welcome back, Sarah!           │ │
│ My KB  │  │                                │ │
│ Cart   │  │ ⚠️ 3 deadlines this week       │ │
│ Settings│ │                                │ │
│        │  │ 📊 Stats: 7 in cart, 3 applied│ │
│        │  │                                │ │
│        │  │ 🆕 12 new matches             │ │
│        │  │ [Browse →]                    │ │
│        │  └────────────────────────────────┘ │
│        │                                      │
└────────┴──────────────────────────────────────┘
```

**Sections:**

1. **Home Tab** (default)
   - Welcome message with first name
   - Upcoming deadlines (next 7 days)
   - Stats: scholarships in cart, applied, won, total $
   - New matches count
   - Quick actions

2. **Find Money Tab**
   - Scholarship search/browse interface
   - Filters sidebar
   - Card swipe UI

3. **My Knowledge Base Tab**
   - Essays section (list + add new)
   - Activities section (list + add new)
   - Resume upload

4. **Cart Tab**
   - Checklist view of saved scholarships
   - Sort by: deadline, amount, competition
   - Export to CSV button
   - Bulk actions

5. **Settings Tab**
   - Profile editing
   - Email preferences
   - Account deletion

**Responsive Behavior:**
- Desktop: Sidebar always visible
- Mobile: Hamburger menu, bottom navigation tabs

### 8.4 Scholarship Search

**Purpose:** Discover and save local scholarships

**Route:** `/dashboard/search`

**UI Design:** Tinder-style swipe cards

**Card Design:**
```
┌────────────────────────────────────────┐
│                                        │
│  ROTARY CLUB LEADERSHIP SCHOLARSHIP    │
│                                        │
│  💰 $5,000                            │
│  📅 Deadline: March 15, 2026          │
│  📍 San Francisco (local only)        │
│  🟢 Low competition (~30 applicants)  │
│                                        │
│  Requirements:                         │
│  • GPA 3.0+ ✓ You qualify             │
│  • Essay (500 words on leadership)    │
│  • Recommendation letter              │
│                                        │
│  Awarded by Rotary Club of SF to      │
│  students demonstrating leadership... │
│                                        │
│                                        │
│  ❌ Pass    [More Info]    ✅ Add     │
│                                        │
└────────────────────────────────────────┘
```

**Interactions:**
- Swipe left / Click "Pass" → Status = "rejected_by_user", don't show again
- Swipe right / Click "Add" → Status = "in_cart", show success toast
- Click card / "More Info" → Expand to full details modal

**Filters (Left Sidebar):**
- Location: Local / State / National
- Amount: Any / $1K+ / $5K+ / $10K+
- Deadline: Any / This month / This quarter
- Competition: Any / Low (<100) / Medium / High
- Requirements: Essay / No essay / Rec letter / etc.

**Matching Logic:**
- Pre-filter on backend by eligibility
- Don't show scholarships user already rejected
- Prioritize local > state > national
- Sort by deadline (soonest first)

**Performance:**
- Lazy load cards (5 at a time)
- Preload next 5 cards in background
- Cache filters client-side

### 8.5 Knowledge Base

**Purpose:** Reusable content library

**Route:** `/dashboard/knowledge`

**Sections:**

**Essays Tab:**
```
┌────────────────────────────────────────┐
│  My Essays                    [+ New]  │
├────────────────────────────────────────┤
│                                        │
│  ▼ Leadership (2 versions)            │
│    • 500 words (used in 3 apps)       │
│    • 250 words (used in 5 apps)       │
│    [Edit] [Delete] [Copy]             │
│                                        │
│  ▼ Overcoming Challenges (1)          │
│    • 650 words (Common App)           │
│    [Edit] [Delete] [Copy]             │
│                                        │
└────────────────────────────────────────┘
```

**Essay Form:**
```
Topic: [Leadership ▼]
Word Count: 487
Tags: #debate #captain #state_finals

[Rich text editor]
"The moment I stepped onto the debate stage..."

[Save] [Copy to Clipboard]
```

**Activities Tab:**
```
┌────────────────────────────────────────┐
│  My Activities                [+ New]  │
├────────────────────────────────────────┤
│                                        │
│  Debate Team Captain                   │
│  Position: Captain (11-12)             │
│  15 hrs/week, 40 weeks/year           │
│                                        │
│  Versions:                             │
│  • 50 chars: "Debate Captain, led..." │
│  • 150 chars: "Captain of debate..."  │
│  • 300 chars: [Full description]      │
│                                        │
│  Used in: 8 applications              │
│  [Edit] [Delete]                      │
│                                        │
└────────────────────────────────────────┘
```

**Character Count Auto-Generation:**
When user enters long description, auto-generate shorter versions:
- 300 chars → Full description
- 150 chars → Truncate intelligently (keep first sentence + key details)
- 50 chars → Title + key verb ("Debate Captain, led team to state finals")

**Features:**
- Real-time character counter
- Warning when approaching limit
- Quick copy buttons
- Usage tracking ("Used in 3 applications")
- Search/filter by topic or tag

### 8.6 Cart & Application Tracking

**Purpose:** Organize and track scholarship applications

**Route:** `/dashboard/cart`

**View Modes:**

**Checklist View (Default):**
```
┌────────────────────────────────────────┐
│  My Cart (7 items)                     │
│  Total: $43,500 | Earliest: Mar 15    │
│                                        │
│  [Export CSV] [Calendar View]          │
├────────────────────────────────────────┤
│                                        │
│  ☐ Rotary Club Scholarship            │
│     $5,000 • Due: Mar 15 • ⚠️ 2 days  │
│                                        │
│     You need:                          │
│     ✓ Essay (500w) → [Copy Essay]     │
│     ☐ Recommendation letter           │
│     ✓ Resume → [Download]             │
│                                        │
│     [Apply →] [Remove]                │
│  ───────────────────────────────────── │
│                                        │
│  ☐ Community Foundation Scholarship    │
│     $3,000 • Due: Mar 17 • 4 days     │
│     ...                                │
│                                        │
└────────────────────────────────────────┘
```

**Status Tracking:**

**In Cart Tab:**
- Scholarships with status = "in_cart"
- Sorted by deadline (urgent first)
- Shows days remaining

**Applied Tab:**
- Status = "applied"
- Shows application date
- Decision date (if known)
- Status: Pending / Won / Lost

**Won Tab:**
- Status = "won"
- Shows amount won
- Confetti animation 🎉

**Export Feature:**

CSV columns:
- Name
- Organization
- Amount
- Deadline
- Status
- Application URL
- Notes

**Calendar Integration:**
- Generate .ics file with deadlines
- One event per scholarship
- Reminder 7 days before, 3 days before, 1 day before

---

## 9. UI/UX Design

### 9.1 Design System

**Color Palette:**

Primary Colors:
- Blue: `#2563eb` (blue-600)
- Indigo: `#4f46e5` (indigo-600)
- Purple: `#7c3aed` (purple-600)

Neutral Colors:
- Slate 50: `#f8fafc` (backgrounds)
- Slate 600: `#475569` (body text)
- Slate 900: `#0f172a` (headings)

Accent Colors:
- Green: `#16a34a` (success, "won" status)
- Red: `#dc2626` (danger, deadlines)
- Yellow: `#eab308` (warnings)

**Typography:**

Font Family: Inter (Google Fonts)

Scale:
- Display: 72px / 4.5rem / font-black
- H1: 60px / 3.75rem / font-black
- H2: 48px / 3rem / font-bold
- H3: 36px / 2.25rem / font-bold
- H4: 24px / 1.5rem / font-semibold
- Body: 16px / 1rem / font-normal
- Small: 14px / 0.875rem / font-medium

**Spacing:**

Base unit: 4px (Tailwind default)

Common spacings:
- xs: 8px (2 units)
- sm: 12px (3 units)
- md: 16px (4 units)
- lg: 24px (6 units)
- xl: 32px (8 units)
- 2xl: 48px (12 units)

**Shadows:**

```css
sm: 0 1px 2px rgba(0, 0, 0, 0.05)
md: 0 4px 6px rgba(0, 0, 0, 0.07)
lg: 0 10px 15px rgba(0, 0, 0, 0.1)
xl: 0 20px 25px rgba(0, 0, 0, 0.15)
```

**Border Radius:**

- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px
- 2xl: 24px
- full: 9999px (pills)

### 9.2 Component Library (shadcn/ui)

**Components to Install:**

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
```

**Custom Components:**

1. **ScholarshipCard** - Swipeable card for search
2. **EssayEditor** - Rich text editor with character count
3. **ActivityForm** - Multi-field activity entry
4. **ChecklistItem** - Cart item with requirements
5. **StatCard** - Dashboard stat display

### 9.3 Animation Guidelines

**Motion Principles:**
- Purposeful: Animations should guide attention, not distract
- Snappy: Duration 200-400ms for most transitions
- Natural: Use easing functions (ease-in-out, ease-out)

**Framer Motion Patterns:**

**Page Transitions:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
```

**Card Swipe:**
```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(e, info) => {
    if (info.offset.x > 100) addToCart();
    if (info.offset.x < -100) reject();
  }}
>
```

**Hover States:**
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

**Loading States:**
```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity }}
>
```

### 9.4 Accessibility Requirements

**WCAG 2.1 AA Compliance:**

- Color contrast ratio ≥ 4.5:1 for body text
- Color contrast ratio ≥ 3:1 for large text (18pt+)
- All interactive elements keyboard accessible
- Focus indicators visible on all focusable elements
- Alt text for all images
- Semantic HTML (headings hierarchy, landmarks)
- Form labels associated with inputs
- Error messages descriptive and accessible

**Screen Reader Support:**
- ARIA labels where needed
- Live regions for dynamic content
- Skip navigation link

**Keyboard Navigation:**
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals
- Arrow keys for card navigation (optional)

---

## 10. Chrome Extension

**Status:** Phase 2 (Post-MVP)

**Purpose:** Auto-fill scholarship forms on external websites

**Architecture:**

```
extension/
├── manifest.json          # Extension config
├── background.js          # Service worker
├── content.js            # Injected into pages
├── sidepanel.html        # Cluely-style panel
├── sidepanel.js          # Panel logic
└── lib/
    ├── formDetector.ts   # Detect scholarship forms
    ├── fieldMapper.ts    # Map fields to user data
    └── autofill.ts       # Fill form fields
```

### 10.1 Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "Magpie - Scholarship Autofill",
  "version": "1.0.0",
  "description": "Never fill out the same scholarship form twice",
  
  "permissions": [
    "storage",
    "sidePanel",
    "activeTab"
  ],
  
  "host_permissions": [
    "https://*/*"
  ],
  
  "background": {
    "service_worker": "background.js"
  },
  
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],
  
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  
  "action": {
    "default_title": "Open Magpie",
    "default_icon": "icon.png"
  }
}
```

### 10.2 Form Detection Logic

**Heuristics:**

Detect scholarship form if page has:
- Input field matching /name|first|last/i
- Input field matching /email/i
- Either:
  - Textarea with maxLength > 200 (essay field)
  - Input matching /gpa|grade/i
  - Input matching /school|college/i

**Common Field Patterns:**

```javascript
const fieldPatterns = {
  firstName: /first.?name|fname/i,
  lastName: /last.?name|lname|surname/i,
  email: /email/i,
  phone: /phone|mobile|tel/i,
  address: /address|street/i,
  city: /city/i,
  state: /state/i,
  zip: /zip|postal/i,
  gpa: /gpa|grade.?point/i,
  sat: /sat/i,
  act: /act/i,
  essay: /essay|statement|describe/i
};
```

### 10.3 Side Panel UI (Cluely-style)

**Design:**

- Slides in from right side
- 320px width
- Dark overlay on rest of page
- Non-intrusive until activated

**Contents:**

```
┌────────────────────────┐
│ 🎓 Magpie             │
├────────────────────────┤
│ We detected a form!    │
│                        │
│ We can fill:           │
│ ✓ Name                 │
│ ✓ Email                │
│ ✓ GPA                  │
│ ✓ Essay (500w)         │
│                        │
│ [Autofill Form]        │
│                        │
│ Your Knowledge Base:   │
│ ┌────────────────────┐ │
│ │ Leadership Essay   │ │
│ │ 500 words          │ │
│ │ [Copy]             │ │
│ └────────────────────┘ │
└────────────────────────┘
```

### 10.4 Data Sync

**Storage Strategy:**

- User data synced to `chrome.storage.sync` (encrypted)
- Sync on login, update on profile changes
- Max 100KB (Chrome limit)

**Sync Payload:**

```javascript
{
  user: {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah@example.com",
    // ... other profile fields
  },
  essays: [
    { id: "uuid", topic: "leadership", text: "...", wordCount: 500 }
  ],
  activities: [
    { id: "uuid", title: "Debate Captain", description: "..." }
  ],
  lastSyncAt: "2026-02-14T10:30:00Z"
}
```

### 10.5 Autofill Execution

**Process:**

1. Detect form fields (content.js)
2. Map to user data (fieldMapper.ts)
3. Fill fields programmatically
4. Dispatch 'input' events (for React forms)
5. Show success toast

**Code Example:**

```javascript
function autofillField(element, value) {
  // Set value
  element.value = value;
  
  // Dispatch events for React/Vue detection
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Visual feedback
  element.style.backgroundColor = '#dcfce7'; // light green
  setTimeout(() => {
    element.style.backgroundColor = '';
  }, 1000);
}
```

### 10.6 Privacy & Security

**User Data Protection:**

- Never send data to external servers (only Magpie API)
- Encrypt sensitive fields in chrome.storage
- Clear data on logout
- Request minimal permissions

**Terms of Service Compliance:**

- Don't auto-submit forms (user must click)
- Respect robots.txt
- Don't scrape scholarship provider sites
- User must manually click "Autofill" button

---

## 11. Success Metrics

### 11.1 Product Metrics

**Acquisition:**
- Unique visitors to landing page
- Sign-up conversion rate (target: >15%)
- Email verification completion rate (target: >80%)

**Activation:**
- Onboarding completion rate (target: >70%)
- PDF upload success rate (target: >85%)
- Time to first scholarship in cart (target: <10 min)

**Engagement:**
- Weekly active users (WAU)
- Average scholarships added to cart per user (target: >5)
- Average scholarships applied to per user (target: >3)
- Knowledge base usage (% of users with >1 essay saved)

**Retention:**
- D1, D7, D30 retention
- Weekly return rate

**Revenue (Future):**
- Premium conversion rate (when launched)
- Average revenue per user (ARPU)

### 11.2 User Satisfaction

**Qualitative:**
- Net Promoter Score (NPS) - target: >50
- User interviews (10 per month)
- Support ticket volume and sentiment

**Quantitative:**
- Task completion rate (onboarding, search, apply)
- Time saved vs manual application (survey)
- Win rate (scholarships won / applied)

### 11.3 Technical Metrics

**Performance:**
- Lighthouse score (target: >90)
- Core Web Vitals (all green)
- API response time p95 (target: <500ms)
- Database query time p95 (target: <100ms)

**Reliability:**
- Uptime (target: 99.9%)
- Error rate (target: <0.1%)
- Failed PDF parses (target: <15%)

**Growth:**
- User growth rate (week-over-week)
- Scholarship database growth
- Geography expansion (cities covered)

---

## 12. Development Phases

### Phase 0: Foundation (Week 1-2)

**Goals:**
- [ ] Set up development environment
- [ ] Initialize Next.js project
- [ ] Configure Tailwind + shadcn/ui
- [ ] Set up Supabase database
- [ ] Configure Clerk auth
- [ ] Deploy to Vercel (staging)

**Deliverables:**
- Working Next.js app
- Database schema created
- Auth flow working
- CI/CD pipeline

### Phase 1: Landing Page (Week 2-3)

**Goals:**
- [ ] Build landing page (all sections)
- [ ] Implement Clerk sign-up flow
- [ ] Add Framer Motion animations
- [ ] Mobile responsive
- [ ] SEO optimization

**Deliverables:**
- Public landing page live
- Sign-up working end-to-end
- Analytics tracking

### Phase 2: Onboarding (Week 3-5)

**Goals:**
- [ ] PDF upload UI
- [ ] Build regex Common App parser
- [ ] Confirmation screen
- [ ] Manual entry form (fallback)
- [ ] Save to database

**Deliverables:**
- Users can onboard via PDF or manual
- Profile data saved correctly
- Essays/activities in knowledge base

### Phase 3: Core App (Week 5-7)

**Goals:**
- [ ] Dashboard UI
- [ ] Scholarship search/browse
- [ ] Card swipe interface
- [ ] Knowledge base CRUD
- [ ] Cart/checklist system

**Deliverables:**
- Users can search scholarships
- Add to cart
- View knowledge base
- Track applications

### Phase 4: Scholarship Data Pipeline (Week 7-9)

**Goals:**
- [ ] Manually curate and verify 50–100 local scholarships (Tier 1 seed)
- [ ] Build targeted Playwright scraper for known source types (community foundations, state higher-ed pages, Rotary/Lions chapters)
- [ ] Integrate Tavily API for URL discovery by region
- [ ] Build Claude Haiku extraction pipeline: raw page text → structured JSON
- [ ] Build `scholarships_pending` admin review queue (simple internal UI or direct DB access for MVP)
- [ ] Set up weekly cron job for Tier 2 + Tier 3 refresh
- [ ] Verify extraction accuracy against manually-entered ground truth

**Deliverables:**
- 50+ verified scholarships in `scholarships` table
- Scraper working for 5+ site types
- AI extraction pipeline live (Tavily → Playwright → Haiku → pending queue)
- Admin can approve/reject extracted scholarships
- Data refresh cron job running

### Phase 5: Polish & Beta (Week 9-11)

**Goals:**
- [ ] Bug fixes
- [ ] UI polish
- [ ] Email notifications (deadline reminders)
- [ ] Export to CSV
- [ ] Beta testing with 20 students

**Deliverables:**
- Private beta live
- Feedback collected
- Bugs triaged

### Phase 6: Public Launch (Week 11-12)

**Goals:**
- [ ] Final bug fixes
- [ ] Performance optimization
- [ ] Public launch
- [ ] Marketing push

**Deliverables:**
- Public product live
- Press release / social media
- First 100 users

---

## 13. Launch Criteria

**Must Have (Blockers):**
- ✅ Landing page live with sign-up
- ✅ Onboarding working (PDF import OR manual)
- ✅ Dashboard with scholarship search
- ✅ Cart/checklist functionality
- ✅ Knowledge base (essays + activities)
- ✅ 50+ scholarships in database
- ✅ Mobile responsive
- ✅ No critical bugs
- ✅ Privacy policy + Terms of Service

**Should Have (Launch Day):**
- ✅ Email verification
- ✅ Email deadline reminders
- ✅ Export to CSV
- ✅ Testimonials on landing page

**Nice to Have (Post-Launch):**
- ⭕ Chrome extension
- ⭕ Calendar integration
- ⭕ Social sharing
- ⭕ Referral program

**Metrics for Success:**
- 100 sign-ups in first week
- 70%+ onboarding completion
- 5+ scholarships added to cart per user
- 3+ applications per user
- NPS > 50

---

## 14. Future Considerations

### Post-MVP Features (Phase 2)

**Chrome Extension:**
- Auto-fill scholarship forms
- Cluely-style side panel
- Smart field detection

**Enhanced Discovery:**
- AI-powered matching (not just filters)
- Personalized recommendations
- Email alerts for new scholarships

**Social Features:**
- Share scholarships with friends
- Group applications (study groups)
- Leaderboards (gamification)

**Premium Features:**
- Essay editing service
- Resume builder
- Interview prep
- Premium support

### Scaling Considerations

**Technical Scaling:**
- Split monolith into microservices
- Add Redis cache layer
- CDN for static assets
- Database read replicas

**Geographic Expansion:**
- Expand from 1 county → state → national
- Partner with more community foundations
- Build relationships with scholarship providers

**Data Partnerships:**
- Integrate with Common App API (if available)
- Partner with high schools (Naviance, Scoir)
- Scholarship provider partnerships

**Monetization:**
- Freemium model (basic free, premium $5/mo)
- B2B (sell to high schools)
- Scholarship provider leads
- Native advertising (ethical)

---

## Appendix A: Tech Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript | SSR for SEO, great DX, Vercel native |
| **Styling** | Tailwind CSS, shadcn/ui | Fast development, accessible components |
| **Animation** | Framer Motion | Best-in-class React animations |
| **Backend** | Next.js API Routes | Monolith for MVP simplicity |
| **Database** | PostgreSQL (Supabase) | Relational data, free tier, great DX |
| **ORM** | Drizzle | Type-safe, fast, excellent DX |
| **Auth** | Clerk | Beautiful UI, handles edge cases |
| **File Storage** | Vercel Blob | Native integration, simple |
| **Email** | Resend | Modern API, generous free tier |
| **Hosting** | Vercel | Zero-config Next.js deploys |
| **Monitoring** | Vercel Analytics, Sentry | Web Vitals, error tracking |
| **PDF Parsing** | pdf-parse | Free, fast, predictable |
| **Web Scraping** | Playwright | Headless browser automation |
| **Search Discovery** | Tavily API | Find scholarship page URLs by region; grounded search, not LLM recall |
| **AI Extraction** | Claude Haiku (Anthropic API) | Extract structured fields from scraped page text; ~$0.001–0.003/scholarship |

---

## Appendix B: API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/parse-common-app` | POST | Upload PDF, get parsed data |
| `/api/user/profile` | GET/PUT | Fetch or update user profile |
| `/api/essays` | GET/POST/PUT/DELETE | CRUD essays |
| `/api/activities` | GET/POST/PUT/DELETE | CRUD activities |
| `/api/scholarships/search` | GET | Search scholarships (with filters) |
| `/api/scholarships/discover` | POST | Trigger Tavily discovery for a region → queues Playwright + Haiku extraction |
| `/api/admin/pending` | GET | List scholarships_pending records for review |
| `/api/admin/pending/:id/approve` | POST | Approve extracted scholarship → moves to live table |
| `/api/admin/pending/:id/reject` | POST | Reject extracted scholarship |
| `/api/cart` | GET/POST/DELETE | Manage cart |
| `/api/cart/export` | GET | Export cart to CSV |
| `/api/webhooks/clerk` | POST | Clerk user creation webhook |

---

## Appendix C: Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PDF parsing fails for >20% of users | Medium | High | Build robust manual entry fallback, test on diverse PDFs |
| Can't scrape enough local scholarships | Medium | Critical | Three-tier pipeline (manual seed → Playwright → AI extraction via Tavily + Haiku) mitigates single point of failure; manual curation always available as floor |
| AI extraction hallucinates scholarship data | Low | High | LLM is grounded to scraped page text, not training memory; source_url always stored; human review gate before any record goes live |
| Users don't complete onboarding | High | High | Make PDF import dead simple, show value immediately |
| Scholarship data goes stale | Medium | Medium | Build refresh cron job, user reporting |
| Users don't actually apply | Medium | High | Add tracking, reminders, make application easier |
| Chrome extension violates ToS | Low | High | Get legal review, respect robots.txt, don't auto-submit |
| Database costs exceed budget | Low | Medium | Monitor usage, optimize queries, upgrade if needed |
| Security breach (user data) | Low | Critical | Encrypt sensitive fields, regular security audits |

---

## Sign-off

**Product Owner:** [Name]  
**Engineering Lead:** [Name]  
**Design Lead:** [Name]  
**Date:** February 14, 2026

---

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-14 | Engineering Team | Initial PRD for MVP |
| 1.1 | 2026-02-19 | Engineering Team | Revised scholarship discovery pipeline: three-tier hybrid (manual seed + Playwright scraper + Tavily/Haiku AI extraction); added `scholarships_pending` staging table and admin review workflow; expanded eligibility schema (athletics, EC categories); updated matching algorithm, API endpoints, risk register, and tech stack |

---

*This PRD is a living document and will be updated as we learn from users and iterate on the product.*