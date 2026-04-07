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
- **Status management** — Toggle employee status (e.g. Active / Deactive) with validation aligned to database constraints.
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

Create a `.env.local` file in the project root (do not commit this file):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

- Copy **Project URL** and **anon / public** key from the Supabase dashboard: **Project Settings → API**.
- Never commit real keys or service role secrets to version control.

### 4. Database setup

SQL migrations live under `supabase/migrations/`. Apply them to your Supabase project in order (e.g. via the Supabase SQL Editor or [Supabase CLI](https://supabase.com/docs/guides/cli)) so that tables such as `employees`, `departments`, `sections`, constraints, RLS policies, and storage policies match the application expectations.

After migrations, ensure the **`employee-docs`** storage bucket (or equivalent configured in your app) exists if you use document uploads.

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
│   ├── supabase/                   # Supabase browser & server clients
│   ├── storage/                    # Storage upload helpers (employee documents)
│   ├── validations/                # Zod schemas for forms
│   ├── fetch-*.ts                  # Data fetching for employees, filters, and related APIs
│   ├── employee-table-columns.ts   # Column visibility & persistence helpers
│   └── social-links.ts             # Social link keys and normalization
├── supabase/
│   └── migrations/                 # SQL migrations (schema, RLS, storage)
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

## Deployment

This application can be deployed on any platform that supports Next.js (e.g. [Vercel](https://vercel.com)). Set the same `NEXT_PUBLIC_*` environment variables in your hosting provider’s project settings. Run `npm run build` to verify the project builds successfully before deploying.

---

## Security notes

- Use the **anon** key only in client-exposed `NEXT_PUBLIC_*` variables.
- Keep **service role** keys server-side only and never embed them in frontend code.
- Review Row Level Security (RLS) policies for production to match your authentication model.

---

## License

Specify a license in a `LICENSE` file when you publish or share this repository (for example MIT, Apache-2.0, or proprietary terms).
