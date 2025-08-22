# Restaurant Monorepo

## Install
pnpm install

## Dev (all apps at once)
pnpm run dev

- API: http://localhost:4000
- Web: http://localhost:5173
- Mobile: `pnpm --filter @restaurant/mobile dev` (QR code)

## Environment
Copy each `.env.example` to `.env` and fill values.

## Database
Run the SQL migration you already have in Supabase. Ensure you have 2 admins seeded.

## Notes
- All API calls forward the user JWT to Supabase, so **RLS** and **secure RPCs** enforce permissions.
- Extend shared `@restaurant/types` with more Zod schemas as features grow.