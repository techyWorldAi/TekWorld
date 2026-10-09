# TekWorld

> Bridging the AI Gap for Modern Businesses — Work Smarter, Scale Faster.

Built in Nairobi 🇰🇪 by **TekWorld**.

Built with **React 18 + TypeScript + Vite + Tailwind CSS**, backed by **Supabase** for the hidden CMS.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (opens at http://localhost:3000)
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

---

## 🗂️ Project Structure

```
tekworld/
├── index.html                    ← Vite entry HTML
├── vite.config.ts                ← Vite config
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── package.json
└── src/
    ├── main.tsx                  ← React entry point
    ├── App.tsx                   ← Root component
    ├── types.ts                  ← TypeScript interfaces
    ├── constants.ts              ← Services data, pricing, colours, PIN
    ├── styles/
    │   └── index.css             ← Tailwind + global styles + animations
    ├── hooks/
    │   ├── useInView.ts          ← Intersection Observer (scroll animations)
    │   └── useSupabase.ts        ← All Supabase API functions
    └── components/
        ├── Logo.tsx              ← SVG hexagon logo mark
        ├── Navbar.tsx            ← Fixed top nav (scroll-aware)
        ├── Hero.tsx              ← Full-screen dark hero section
        ├── Services.tsx          ← 4 services + KES pricing grid
        ├── WorkedWith.tsx        ← CMS-driven companies section
        ├── Stories.tsx           ← CMS-driven success stories
        ├── Contact.tsx           ← Contact form
        ├── Footer.tsx            ← Footer + hidden admin trigger
        └── AdminPanel.tsx        ← PIN-protected CMS panel
```

---

## 🔐 Hidden CMS

Three ways to open the admin panel:

| Method | How |
|--------|-----|
| Keyboard | `Ctrl + Shift + A` |
| Footer | Click the faint `···` bottom-right of the footer |

**Default PIN:** `tw2024`  
To change it, edit `ADMIN_PIN` in `src/constants.ts`.

---

## 🗄️ Supabase Setup

### 1. Create a project
Sign up at [supabase.com](https://supabase.com) → New Project.

### 2. Create tables
Open the admin panel → **SQL SETUP** tab → copy the SQL → run it in your Supabase SQL Editor.

Tables created:
- **companies** — `id, name, industry, logo_url, created_at`
- **stories** — `id, title, company_name, description, platform, link, created_at`

### 3. Connect
Admin panel → **CONFIG** tab → paste:
- **Supabase URL** — e.g. `https://xxxx.supabase.co`
- **Anon Key** — from Project Settings → API → `anon` `public`

Hit **Test Connection** → **Load Data**.

---

## 💰 Pricing (edit in `src/constants.ts`)

| Service | Price |
|---------|-------|
| Smart Website Builds | KES 45,000 starting |
| Business Automation | KES 35,000 / workflow |
| AI Strategy & Integration | KES 60,000 / engagement |
| AI Training Programmes | KES 15,000 / person |

---

## 🎨 Design System

- **Headings** — Georgia (serif), sharp, high contrast
- **Body** — system-ui (sans-serif), clean
- **Colours** — `#0d0d0d` ink, `#ffffff` white, `#f7f7f5` off-white
- **No rounded corners** — precision geometry throughout
- **Sharp grid separators** — 1px `#e8e8e8`

---

## 🚀 Deploy

| Platform | Command |
|----------|---------|
| Vercel | `npx vercel --prod` |
| Netlify | Drag `dist/` folder |
| GitHub Pages | Set `base` in `vite.config.ts` |

---
