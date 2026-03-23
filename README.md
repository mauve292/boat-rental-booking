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
  types/      Shared TypeScript types/constants
  ui/         Shared UI component package
  validation/ Shared Zod placeholder schemas
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
- The scaffold intentionally excludes booking flows, database models, and authentication so domain logic can be added later in isolated packages.
- The structure is ready for future additions such as Prisma/Postgres, Better Auth, shared booking logic, and rate limiting without coupling those concerns into the initial scaffold.
