# Urgent Printers — Admin Panel

Staff dashboard for the Urgent Printers online printing business. Built with Next.js 16, React 19, Tailwind CSS v4, and shadcn/Base UI.

## Stack

- **Framework:** Next.js 16.2.4 (App Router)
- **UI:** Tailwind CSS v4 · shadcn 4.x (Base UI)
- **State:** TanStack Query v5 · Zustand v5
- **Forms:** React Hook Form · Zod v4
- **Charts:** Recharts
- **Auth:** Custom JWT (access token in memory, refresh token in HttpOnly cookie)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_API_URL
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `https://api.urgentprinters.com/api/v1`) |

## Related

- `urgent-printers-backend/` — FastAPI backend
- `urgent-printers-frontend/` — Customer storefront
