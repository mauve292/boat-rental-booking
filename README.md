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
```

## Notes

- All apps use Next.js App Router, TypeScript, Tailwind CSS, and ESLint.
- Shared packages are wired through workspace imports.
- `packages/domain` contains the shared fleet, price rules, mock bookings, mock availability blocks, booking season config, and pure helpers such as boat lookup, slot keys, seasonal checks, and booking preselection helpers.
- Boat preselection works through a shared `boat` query param. Example booking path: `/?boat=aurora`.
- The public site uses shared helpers to link into the booking app with either a preselected boat or a generic booking entry.
- `packages/validation` now holds draft-friendly booking form and query schemas that align with the shared domain model.
- Everything remains mocked for now: no database, no auth, no payments, no server persistence, and no admin CRUD yet.
- The structure is ready for future additions such as Prisma/Postgres, Better Auth, shared booking logic, and rate limiting without coupling those concerns into the initial scaffold.
