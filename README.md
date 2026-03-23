# Boat Rental Booking Monorepo

Portable pnpm workspace scaffold for a boat-rental booking demo. The repository is split into separate Next.js apps so it can map cleanly to a main site, booking subdomain, and admin subdomain later without carrying business logic yet.

## Workspace Structure

```text
apps/
  admin/      Admin dashboard shell
  booking/    Booking app shell
  site/       Public marketing site shell
packages/
  config/     Shared Tailwind + TS config helpers
  db/         Prisma schema, seed script, client, and repository layer
  domain/     Shared booking domain types, mock data, and pure helpers
  types/      Shared TypeScript types/constants
  ui/         Shared UI component package
  validation/ Shared Zod schemas for booking/query input drafts
```

## Install

If `pnpm` is not installed globally, enable Corepack first:

```bash
corepack enable
corepack pnpm install
```

If `pnpm` is already available:

```bash
pnpm install
```

## Run

Run all apps in development with Turborepo:

```bash
corepack pnpm dev
```

Run a single app:

```bash
corepack pnpm dev:site
corepack pnpm dev:booking
corepack pnpm dev:admin
```

Default local ports:

- `site`: `http://localhost:3000`
- `booking`: `http://localhost:3001`
- `admin`: `http://localhost:3002`

## Workspace Commands

```bash
corepack pnpm build
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:push
corepack pnpm db:seed
```

## Notes

- All apps use Next.js App Router, TypeScript, Tailwind CSS, and ESLint.
- Shared packages are wired through workspace imports.
- `packages/db` introduces the first real persistence layer with Prisma configured for PostgreSQL and a standard `DATABASE_URL`.
- Copy [.env.example](C:/Users/bill2/Desktop/ithaca%20usefull/boat-rental-booking/.env.example) to `.env` and set `DATABASE_URL` before running Prisma migrations or seed commands.
- Local DB flow: `corepack pnpm db:generate`, `corepack pnpm db:migrate` (or `corepack pnpm db:push` if you intentionally want schema sync without migrations), then `corepack pnpm db:seed`.
- `packages/domain` contains the shared fleet, price rules, mock bookings, mock availability blocks, booking season config, and pure helpers such as boat lookup, slot keys, seasonal checks, and booking preselection helpers.
- Boat preselection works through a shared `boat` query param. Example booking path: `/?boat=aurora`.
- The public site uses shared helpers to link into the booking app with either a preselected boat or a generic booking entry.
- `packages/validation` now holds draft-friendly booking form and query schemas that align with the shared domain model.
- The apps now read through `@boat/db` repository functions. When `DATABASE_URL` is not configured, the repository layer falls back to the existing domain mock data so the UI can still build.
- Prisma seed data is derived from the shared domain mock dataset so the initial Postgres contents match the current demo fleet and sample booking state.
- Still intentionally missing: auth, payments, booking submission flows, admin CRUD, and production notification delivery.
- The structure is ready for future additions such as Prisma/Postgres, Better Auth, shared booking logic, and rate limiting without coupling those concerns into the initial scaffold.
