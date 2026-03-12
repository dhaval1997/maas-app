# MaaS Transit Pass App (Next.js)

Frontend + backend APIs are hosted in one Next.js app (`app/api/*`) with Postgres storage.

## Database provider for Vercel

Use **Neon (Serverless Postgres)** from the Vercel Marketplace.

## Setup

1. Create a DB from Vercel dashboard:
   1. `Storage` -> `Neon` -> `Create`
   2. Copy connection string
2. Add env vars in Vercel project:
   1. `DATABASE_URL=<your_neon_connection_string>`
   2. `NEXT_PUBLIC_USE_MOCK_API=false`
3. Local setup:
   1. Copy `.env.example` to `.env.local`
   2. Fill `DATABASE_URL`
4. Run:

```bash
npm install
npm run dev
```

The app auto-creates tables and seed users on first API request.

## Seed users

- `superadmin@test.com` / `password123`
- `admin@test.com` / `password123`
- `validator@test.com` / `password123`
- `commuter@test.com` / `password123`

## Role rules

- Public register => `COMMUTER` only
- `SUPER_ADMIN` can create `ADMIN` and `VALIDATOR`
- `ADMIN` can create `VALIDATOR`
- Admin and super-admin can view all users

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

