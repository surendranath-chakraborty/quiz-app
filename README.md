# QuizForge — Advanced Quiz Builder

A complete, production-ready quiz creation and analytics platform built with HTML, CSS, Vanilla JavaScript, and Supabase.

---

## 📁 File Structure

```
quiz-app/
├── index.html        ← Landing page
├── login.html        ← Auth page (Login + Sign Up)
├── dashboard.html    ← Quiz creator dashboard (protected)
├── quiz.html         ← Public quiz player
├── result.html       ← Results page
├── analytics.html    ← Admin analytics (protected)
├── style.css         ← All styles (dark mode, responsive)
├── script.js         ← Shared utilities & CSV parser
├── supabase.js       ← Supabase client & all DB helpers
└── README.md         ← This file
```

---

## 🚀 Setup Instructions

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in.
2. Click **"New Project"**, give it a name, choose a region, set a database password.
3. Wait ~1–2 minutes for the project to provision.

---

### Step 2 — Run the SQL Schema

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar.
2. Click **"New Query"** and paste the entire SQL below, then click **"Run"**.

```sql
-- ============================================
-- QuizForge Database Schema
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── QUIZZES TABLE ──
CREATE TABLE IF NOT EXISTS quizzes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  timer_seconds   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUESTIONS TABLE ──
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  option_a        TEXT NOT NULL,
  option_b        TEXT NOT NULL,
  option_c        TEXT NOT NULL,
  option_d        TEXT NOT NULL,
  correct_option  TEXT NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── RESPONSES TABLE ──
CREATE TABLE IF NOT EXISTS responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id          UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score            INTEGER NOT NULL DEFAULT 0,
  total_questions  INTEGER NOT NULL DEFAULT 0,
  percentage       FLOAT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE quizzes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Quizzes: owners can do anything; everyone can read (for public quiz player)
CREATE POLICY "Owner full access on quizzes"
  ON quizzes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read quizzes"
  ON quizzes FOR SELECT
  USING (true);

-- Questions: owner can manage; anyone can read (quiz player needs to read them)
CREATE POLICY "Owner full access on questions"
  ON questions FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM quizzes WHERE id = questions.quiz_id)
  );

CREATE POLICY "Anyone can read questions"
  ON questions FOR SELECT
  USING (true);

-- Responses: anyone can insert (quiz player); only owner can read their quiz responses
CREATE POLICY "Anyone can insert responses"
  ON responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owner can read responses"
  ON responses FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM quizzes WHERE id = responses.quiz_id)
  );

-- ── INDEXES for performance ──
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id   ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_responses_quiz_id ON responses(quiz_id);
```

---

### Step 3 — Get Your API Keys

1. In Supabase, go to **Project Settings → API**.
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public key** (a long JWT string)

---

### Step 4 — Update `supabase.js`

Open `supabase.js` and replace the placeholder values:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // ← Replace this
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';            // ← Replace this
```

---

### Step 5 — Configure Auth (Email Confirmation)

In Supabase dashboard:
- Go to **Authentication → Providers → Email**
- For development/testing: turn **off** "Confirm email" so users can log in immediately after signup
- For production: leave it on and configure your email templates

---

## 📊 CSV Import Format

Create a `.csv` file with this exact header row:

```csv
Question,Option A,Option B,Option C,Option D,Correct Option
What is 2+2?,3,4,5,6,B
What color is the sky?,Red,Green,Blue,Yellow,C
Who wrote Hamlet?,Dickens,Shakespeare,Tolkien,Hemingway,B
```

**Rules:**
- Row 1 must be the header (it's skipped during import)
- `Correct Option` must be: `A`, `B`, `C`, or `D` (case-insensitive; `Option A` also works)
- Wrap fields containing commas in double quotes: `"Hello, World"`
- Empty rows are skipped automatically

---

## 🌐 Deployment

### Option A — Netlify (Recommended, Free)

1. Go to [https://netlify.com](https://netlify.com) and sign up.
2. Drag and drop your entire `quiz-app/` folder onto the Netlify dashboard.
3. That's it — you get a live URL instantly!

**Or via Netlify CLI:**
```bash
npm install -g netlify-cli
cd quiz-app
netlify deploy --prod --dir=.
```

---

### Option B — Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up.
2. Install Vercel CLI: `npm i -g vercel`
3. Run in your project folder:
```bash
cd quiz-app
vercel --prod
```
4. Follow the prompts — select "Other" as framework, set output directory to `.`

**Or push to GitHub and import the repo on vercel.com.**

---

### Option C — GitHub Pages

1. Push all files to a GitHub repo.
2. Go to **Settings → Pages**.
3. Set source to `main` branch, root folder `/`.
4. Your app will be live at `https://yourusername.github.io/repo-name/`

---

## 🔒 Security Notes

- **RLS (Row Level Security)** is enabled on all tables — users can only manage their own quizzes.
- The public quiz player can read any quiz by ID (by design — it's meant to be shareable).
- Anyone can submit responses (by design — quiz takers don't need accounts).
- The **anon key** is safe to expose in frontend code — Supabase's RLS policies enforce security.
- Never expose your **service_role** key in frontend code.

---

## ✨ Features Summary

| Feature | Status |
|---|---|
| Email Auth (Sign Up / Login / Logout) | ✅ |
| Protected Dashboard | ✅ |
| Quiz Creator with Dynamic Questions | ✅ |
| Per-Question Timers with SVG countdown | ✅ |
| CSV Import with Preview & Validation | ✅ |
| Drag & Drop CSV Upload | ✅ |
| Public Quiz Player | ✅ |
| Progress Bar | ✅ |
| Auto-advance on Timer Expiry | ✅ |
| Score Calculation | ✅ |
| Results Page with Review | ✅ |
| Save Responses to Supabase | ✅ |
| Analytics Dashboard | ✅ |
| Chart.js Score Distribution | ✅ |
| Response History Table | ✅ |
| One-click Share Link | ✅ |
| Copy to Clipboard | ✅ |
| Dark Mode with localStorage persistence | ✅ |
| Fully Responsive (mobile-first) | ✅ |
| Smooth animations & transitions | ✅ |

---

## 🛠 Local Development

No build step required! Just open the files in a browser:

```bash
# Using Python's built-in server (recommended to avoid CORS issues)
cd quiz-app
python3 -m http.server 8080
# Open: http://localhost:8080
```

Or use the **Live Server** extension in VS Code.

---

## 📝 Tech Stack

- **Frontend**: HTML5, CSS3 (custom properties, grid, flexbox), Vanilla JS (ES2022+)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Chart.js 4.x
- **Fonts**: Google Fonts (Playfair Display + DM Sans + DM Mono)
- **Deployment**: Netlify / Vercel / GitHub Pages
