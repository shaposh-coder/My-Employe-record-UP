# Employee Record

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A modern **employee directory and HR-style record system** built with Next.js and Supabase. Manage employee profiles, organizational structure (departments and sections), document uploads, and directory views from a single dashboard.

---

## Visuals

> **Note:** Add your own PNG or WebP files under [`docs/screenshots/`](./docs/screenshots/) and replace the placeholder paths below (or embed images from any URL). Suggested size: **1280×720** or similar widescreen aspect ratio.

| Area | Preview |
|------|---------|
| **Landing / entry** | ![Landing page — add your screenshot](./docs/screenshots/landing.png) |
| **Employee Management (directory)** | ![Employee table, search, and filters — add your screenshot](./docs/screenshots/employee-directory.png) |
| **Add / Edit employee (form tabs)** | ![Multi-tab employee form — add your screenshot](./docs/screenshots/employee-form.png) |
| **Employee detail (modal)** | ![Employee detail modal — add your screenshot](./docs/screenshots/employee-detail-modal.png) |
| **Configuration (departments & sections)** | ![Departments and sections configuration — add your screenshot](./docs/screenshots/configuration.png) |

*If images are missing, your Git host may show a broken icon until you add the files.*

---

## Features

- **Employee directory** — Searchable, filterable table with configurable columns, pagination, and real-time filtering (debounced server queries).
- **Rich employee profiles** — Multi-tab add/edit forms covering personal details, work & education, social links, family information, and document uploads (profile photo, CNIC, family documents, and more).
- **Status management** — Toggle employee status (e.g. Active / Un-Active) with validation aligned to database constraints.
- **Configuration** — Maintain **Departments** and **Sections** with usage counts, safe deletion when no employees reference a value, and quick access to employees per department or section.
- **Detail views** — Modal-based employee detail view with tabs and optional navigation to edit mode.
- **Responsive UI** — Dashboard shell with sidebar navigation, top bar, and a polished dark-mode–friendly interface (Tailwind CSS).

---

## Tech Stack

| Area | Technology |
|------|------------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| Backend / DB | [Supabase](https://supabase.com/) (PostgreSQL, Auth-ready schema, Storage) |
| Forms & validation | React Hook Form, Zod |
| Components | Radix UI (Popover), Lucide React icons |

---

## Prerequisites

- **Node.js** 20+ (recommended)
- **npm** (or compatible package manager)
- A **Supabase** project with the database schema and storage bucket applied (see [Database setup](#database-setup))

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Employee-Record.git
cd Employee-Record
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy the example file and fill in values from the Supabase dashboard (**Project Settings → API**):

```bash
cp .env.local.example .env.local
```

| Variable | Where it runs | Purpose |
|----------|----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser & server | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser & server | Public anon key (safe to expose in client bundles). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Used by API routes (e.g. creating users with passwords in **Settings**). Never commit real values or expose this key in client code. |

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

- The **service role** key is optional for read-only use, but **required** if admins should add or remove users with login passwords from the app.
- Never commit `.env.local` or real secrets to Git.

### 4. Database setup

There is a **single** SQL migration: [`supabase/migrations/employee_record_complete.sql`](./supabase/migrations/employee_record_complete.sql). Apply it **once** on a new Supabase project:

1. Open the **Supabase SQL Editor**, create a new query, paste the full file contents, and **Run**; or  
2. Use the **[Supabase CLI](https://supabase.com/docs/guides/cli)** (`supabase db push` / `supabase db reset` for a linked local project).

The script creates tables, RLS policies, the **`employee-docs`** storage bucket and policies, and seeds a **default admin** for the first login:

| Field | Value |
|--------|--------|
| Email | `admin@admin.com` |
| Password | `admin123` |
| Full name | Admin |
| Access | **admin** (`public.user_access`; password stored only as **bcrypt** in `auth.users`) |

Change this password after the first successful sign-in on any shared or production deployment.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Run the production server (after `build`) |
| `npm run lint` | Run ESLint |

---

## Project structure

```
Employee-Record/
├── src/
│   ├── app/                          # Next.js App Router: pages, layouts, route groups
│   │   ├── (dashboard)/            # Authenticated-style shell: employees, configuration, settings, etc.
│   │   ├── layout.tsx                # Root layout (fonts, providers)
│   │   └── page.tsx                # Entry / landing route
│   └── components/                 # App-level UI (e.g. theme toggle, theme provider)
├── components/                     # Feature & shared React components
│   ├── configuration/              # Departments / sections settings UI
│   ├── dashboard/                  # Shell: sidebar, top bar, layout context (e.g. top bar slot)
│   ├── employees/                  # Table, forms, modals, filters, uploads
│   └── providers.tsx               # App-wide providers (e.g. theme)
├── hooks/                          # Reusable React hooks (e.g. document upload helpers)
├── lib/                            # Services, data layer, and shared logic (no React UI)
│   ├── supabase/                   # Supabase browser, server, and admin clients
│   ├── actions/                    # Server Actions (directory data, config refresh, user access)
│   ├── storage/                    # Storage upload helpers (employee documents)
│   ├── validations/                # Zod schemas for forms
│   ├── fetch-*.ts                  # Data fetching for employees, filters, configuration
│   ├── employee-table-columns.ts   # Column visibility & persistence helpers
│   └── social-links.ts             # Social link keys and normalization
├── supabase/
│   └── migrations/                 # `employee_record_complete.sql` — full schema + default admin
├── docs/
│   └── screenshots/                # Optional README screenshots (see Visuals section)
├── public/                         # Static assets
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

**Conventions**

- **`lib/`** — Treat as the **service / API layer**: Supabase calls, validation schemas, and utilities used by components and route handlers. There is no separate `services/` folder; fetch and domain logic live here alongside `lib/supabase/`.
- **`hooks/`** — Custom hooks that encapsulate behavior (e.g. uploads) for reuse across components.
- **`components/`** (repo root) — Primary UI modules; **`src/components/`** holds smaller cross-cutting pieces tied to the App Router tree.

---

## Deployment (Vercel)

This app targets **[Vercel](https://vercel.com)** (Next.js–native hosting). Other Node hosts work if they support the Next.js App Router and environment variables.

### Before you push to GitHub

1. Run **`npm run build`** locally and fix any errors.
2. Confirm **`.env.local`** is listed in **`.gitignore`** (it should be) and never stage real secrets.
3. Optionally run **`npm run lint`**.

### Connect GitHub → Vercel

1. Push your repository to GitHub.
2. In Vercel: **Add New… → Project → Import** the repository.
3. Framework preset should detect **Next.js**. Root directory: project root (default).
4. Under **Environment Variables**, add the same keys as in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (production value; **Sensitive** in Vercel)
5. Deploy. Vercel will run `npm run build` on each push to the connected branch.

### After the first production deploy

1. In **Supabase → Authentication → URL configuration**, set **Site URL** to your Vercel URL (e.g. `https://your-app.vercel.app`) and add the same URL under **Redirect URLs** if you use email links or OAuth later.
2. Log in with the seeded admin (`admin@admin.com` / `admin123`), then **change the password** and rotate credentials for anything exposed during testing.

### Troubleshooting

- **Build fails on Vercel:** Check the build log; often a missing env var or TypeScript error.
- **Login works locally but not on Vercel:** Verify `NEXT_PUBLIC_*` values match your Supabase project and Auth URL settings include your production domain.

---

## Security notes

- Use the **anon** key only in client-exposed `NEXT_PUBLIC_*` variables.
- Keep **service role** keys server-side only and never embed them in frontend code.
- Review Row Level Security (RLS) policies for production to match your authentication model.

---

## License

Specify a license in a `LICENSE` file when you publish or share this repository (for example MIT, Apache-2.0, or proprietary terms).
