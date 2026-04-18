# WebXchange — Advanced Website Traffic Exchange Network

A full-stack React + Supabase application. Users earn credits by surfing other members' websites and spend them to receive real human visits back.

---

## 🚀 Quick Start

### 1. Clone & install
```bash
cd webxchange
npm install
```

### 2. Create a Supabase project
1. Go to https://supabase.com and create a free project
2. In the dashboard → **SQL Editor** → paste and run the full contents of:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. In **Settings → API**, copy your **Project URL** and **anon public key**

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env and paste your URL + anon key
```

### 4. (Optional) Enable Google OAuth
- Supabase dashboard → **Authentication → Providers → Google**
- Add your Google OAuth client ID & secret
- Add `http://localhost:3000` to allowed redirect URLs

### 5. Run
```bash
npm start
```

App runs at `http://localhost:3000`

---

## 📁 Project Structure

```
webxchange/
├── .env.example                    ← Copy to .env, add Supabase keys
├── .gitignore
├── package.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← Full DB schema with RLS policies
│
├── public/
│   └── index.html
│
└── src/
    ├── App.jsx                     ← Router + AuthProvider + protected routes
    ├── index.js
    │
    ├── lib/
    │   └── supabaseClient.js       ← Supabase singleton client
    │
    ├── context/
    │   └── AuthContext.jsx         ← Global auth state + profile cache
    │
    ├── services/                   ← All Supabase calls live here
    │   ├── authService.js          ← signUp, signIn, signOut, OAuth, resetPassword
    │   ├── profileService.js       ← getProfile, updateProfile, uploadAvatar
    │   ├── websiteService.js       ← CRUD websites, getNextSurfTarget
    │   ├── surfService.js          ← startSession, completeSession, skipSession
    │   └── analyticsService.js     ← getDashboardStats, getTrafficTrend, getLeaderboard
    │
    ├── components/
    │   ├── Navbar.jsx              ← Live credits balance, avatar, sign-out
    │   ├── ProtectedRoute.jsx      ← Redirects to /auth if not logged in
    │   ├── Footer.jsx
    │   └── UI.jsx                  ← Card, Button, Badge, KPI, Table, Input, etc.
    │
    ├── pages/
    │   ├── Home.jsx                ← Landing page (public)
    │   ├── Auth.jsx                ← Login + Signup tabs (Supabase auth)
    │   ├── Dashboard.jsx           ← Live KPIs, chart, websites table
    │   ├── AddWebsite.jsx          ← Add/edit website form (Supabase insert/update)
    │   ├── Exchange.jsx            ← Surf timer + real session tracking
    │   ├── Leaderboard.jsx         ← Live leaderboard from DB view
    │   └── Pricing.jsx             ← Plans + FAQ (static)
    │
    ├── hooks/
    │   └── useSurfTimer.js         ← Countdown timer hook
    │
    ├── data/
    │   └── mockData.js             ← Fallback/static data (plans, testimonials)
    │
    └── styles/
        └── globals.css             ← CSS variables, fonts, base reset
```

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` — credits, plan, username |
| `websites` | User-submitted URLs with targeting config |
| `surf_sessions` | Each surf event (started, completed, skipped) |
| `credit_transactions` | Full credit ledger (earn / spend / purchase) |
| `traffic_logs` | Delivered visits with geo + device metadata |
| `daily_stats` | Per-user daily aggregate (populated by edge function) |
| `leaderboard_today` | SQL view — top users by visits delivered today |

**RLS (Row-Level Security)** is enabled on every table:
- Users can only read/write their own data
- Active websites are publicly readable (for the surf queue)
- The leaderboard view is public

---

## ⚙️ Key Supabase Features Used

| Feature | Where |
|---------|-------|
| **Email/Password Auth** | `authService.js` → `signIn`, `signUp` |
| **Google OAuth** | `authService.js` → `signInWithGoogle` |
| **Password Reset** | `authService.js` → `resetPassword` |
| **Auth Trigger** | `handle_new_user()` auto-creates profile row |
| **RLS Policies** | All tables in `001_initial_schema.sql` |
| **Database Functions (RPC)** | `complete_surf_session()` — atomic credit transfer |
| **Realtime** | Ready to add via `supabase.channel()` |
| **Storage** | `uploadAvatar()` in `profileService.js` |

---

## 🔮 What to Add Next

### Realtime Updates
```js
// Live credit balance updates
supabase.channel('profile-changes')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
    payload => setCredits(payload.new.credits))
  .subscribe();
```

### Stripe Payments
- Install `@stripe/stripe-js` + create a Supabase Edge Function as the webhook
- On successful payment → insert a `credit_transactions` row with `type = 'purchase'`

### Scheduled Functions (Supabase Edge Functions)
```
supabase/functions/reset-daily-caps/index.ts   ← Call SQL reset_daily_caps() at midnight
supabase/functions/update-daily-stats/index.ts  ← Aggregate traffic_logs → daily_stats
```

### Anti-bot / CAPTCHA
- Add hCaptcha to the surf timer completion step
- Verify token server-side in a Supabase Edge Function before crediting

### Admin Panel
- Create a separate `/admin` route gated by `profile.role = 'admin'`
- Show moderation queue: websites pending approval
- User management: suspend, refund credits
