# Employee Record — Project overview (for AI / Gemini context)

Yeh file is liye hai ke tum (Gemini ya koi aur assistant) jaldi samajh sako ke project **kaise organize** hai aur **kahan kya milta** hai. Isay prompt ke sath attach karke help maang sakte ho.

---

## 1. Maqsad (Purpose)

**Employee Record** ek internal HR-style web app hai: employees ki directory, add/edit forms, departments/sections ka configuration, aur Supabase par data persistence.

---

## 2. Tech stack

| Area | Technology |
|------|------------|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19**, **Tailwind CSS 4** |
| Backend / DB | **Supabase** (Postgres + Auth-ready client; abhi anon key + RLS policies) |
| Forms | **react-hook-form** + **Zod** validation |
| Icons | **lucide-react**, **react-icons** |
| Toasts | **sonner** |
| Theming | **next-themes** (dark/light) |

---

## 3. Repo layout (high level)

```
Employee-Record/
├── src/app/                    # Next.js routes (App Router)
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing
│   └── (dashboard)/            # Dashboard group
│       ├── layout.tsx          # DashboardShell wrapper
│       ├── dashboard/page.tsx
│       ├── employees/page.tsx  # Employee table (server-side pagination, search)
│       ├── employees/new/page.tsx
│       ├── employees/[id]/edit/page.tsx
│       ├── configuration/page.tsx   # Departments & Sections
│       └── settings/page.tsx
├── components/                 # React components (feature-based folders)
│   ├── dashboard/
│   ├── employees/
│   └── configuration/          # department-section-settings.tsx
├── lib/                        # Shared logic (no UI)
│   ├── supabase/client.ts      # Browser Supabase client
│   ├── supabase/server.ts      # Server client (if used)
│   ├── fetch-employees.ts      # Paginated + filtered employee fetch (.range, ilike)
│   ├── fetch-employee-filter-options.ts
│   ├── employee-table-columns.ts
│   ├── validations/
│   └── ...
├── supabase/migrations/        # SQL migrations (run on Supabase project)
└── .env.local                  # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 4. Important concepts

### 4.1 Supabase client

- **`lib/supabase/client.ts`**: client components me `createClient()` se data read/write.
- Env: **`NEXT_PUBLIC_SUPABASE_URL`** aur **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (`.env.local`).

### 4.2 Employees list (scale)

- **`lib/fetch-employees.ts`**: `fetchEmployees({ page, pageSize, search, department, section, city })`
  - Supabase **`.range(from, to)`** — poori table fetch nahi, sirf current page.
  - Search: **`.or(...)`** + **`ilike`** multiple columns par (server-side).
  - Count: **`select(..., { count: "exact" })`**.

### 4.3 Configuration (Departments / Sections)

- Tables: **`departments`**, **`sections`** (titles + descriptions).
- Employees table par **`department`**, **`section`** text fields — directory rows se **title matching** (`normalize_title_key` SQL / app-side formatting).
- **`supabase/migrations/20260420120000_employee_record_complete.sql`**: full schema + RPCs (**`department_employee_counts()`**, **`section_employee_counts()`**, etc.) + default admin seed.
- UI: **`components/configuration/department-section-settings.tsx`** — realtime subscriptions, search, modals add/edit, delete guards.

### 4.4 UI patterns

- **Client components** jahan `"use client"` ho (tables, forms, modals).
- **Column visibility** (employees table): `lib/employee-table-columns.ts` + localStorage — hydration ke liye default pehle, phir load.

---

## 5. Database (migrations)

- **`supabase/migrations/20260420120000_employee_record_complete.sql`** — ek hi file; Supabase SQL Editor / CLI se apply karo.
- Important pieces: `employees`, `departments` / `sections` (with `department_id`), indexes, RLS, storage, default admin (`admin@admin.com` / bcrypt).

---

## 6. Commands

```bash
npm install
npm run dev      # development
npm run build    # production build check
npm run lint
```

---

## 7. Jab Gemini se help lo

Prompt me yeh cheezen clear karo:

1. **Kaunsa feature** — e.g. employees table, configuration, forms.
2. **File path** — upar wale table se (e.g. `lib/fetch-employees.ts`).
3. **Error message** ya **expected vs actual** behaviour.
4. Agar DB change ho: **migration** likhni hai `supabase/migrations/` me.

Is file ko attach karne se model ko stack aur structure ka context mil jata hai bina poora repo padhe.

---

*Last updated: project structure as of maintenance — paths verify kar lena agar refactor ho chuka ho.*
