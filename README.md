# noloop

A desktop-first toolset that makes job applying faster and less repetitive — without automating or generating content. You write everything; noloop removes the menial work.

> No aggregator. No AI content generator. No autofill bot.

---

## ✦ What it does

| Page                    | What it's for                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Quick Copy**          | One-click copy for your personal info, links, and files                                               |
| **Cover Letter Editor** | Full-page Tiptap editor with two variations, token substitution, one-page enforcement, and PDF export |
| **Answer Bank**         | Up to 8 reusable Q&A entries with short/long variants _(coming soon)_                                 |
| **Application Tracker** | Notion-inspired table + board to track every application _(coming soon)_                              |

---

## 🗂 Project structure

```
noloop/
├── client/
│   └── src/
│       ├── api/              — Supabase client, base API client, TanStack Query hooks
│       ├── components/
│       │   ├── cover-letter/ — editor, toolbar, side panel, token highlight extension
│       │   ├── layout/       — sidebar, app shell
│       │   ├── quick-copy/   — copy buttons, cover letter card, resume button
│       │   └── ui/           — shadcn components
│       ├── context/          — React context (auth)
│       ├── hooks/            — shared custom hooks
│       ├── icons/            — brand SVG icons (GitHub, LinkedIn)
│       ├── lib/              — shadcn helpers (cn utility)
│       ├── pages/            — page-level components
│       └── utils/            — pure utility functions
├── server/
│   └── src/
│       ├── middleware/       — JWT auth middleware
│       ├── routes/           — Express route handlers
│       └── utils/            — PDF generation, Tiptap → HTML, browser singleton
├── project-refs/             — specs, wireframes, screenshots
└── package.json              — TurboRepo root
```

---

## 🛠 Tech stack

### Frontend

| Tool           | Purpose                         |
| -------------- | ------------------------------- |
| React + Vite   | App framework                   |
| Tailwind CSS   | Styling                         |
| shadcn/ui      | Component library               |
| Tiptap         | Rich text editor (cover letter) |
| TanStack Query | Server state / data fetching    |
| Supabase JS    | Auth + Storage (client-side)    |
| React Router   | Client-side routing             |
| Sonner         | Toast notifications             |

### Backend

| Tool              | Purpose                                 |
| ----------------- | --------------------------------------- |
| Node.js + Express | API server                              |
| Supabase Postgres | Database (with RLS)                     |
| Supabase Auth     | JWT-based authentication                |
| Supabase Storage  | File storage (resumes, cover letters)   |
| Puppeteer         | Server-side PDF generation via Chromium |

### Infrastructure

- **Client** — Vercel
- **Server** — Render (full Node.js, no serverless constraints)
- **Database / Auth / Storage** — Supabase
