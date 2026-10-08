# ADR 0001: Remain on TypeScript 5 until tsc-alias supports TypeScript 6

**Date:** 2026-10-08

## Context

The project uses TypeScript with `tsc` directly and does not use a bundler.

The source code uses path aliases:

- `main/*` → `src/musea-server/main/*`
- `renderer/*` → `src/musea-server/renderer/*`

`tsc-alias` is used after compilation to rewrite these aliases in the generated JavaScript so that they can be resolved by Electron and the browser-based renderer.

TypeScript 6 removes the need for `baseUrl` when using `paths`. However, the version of `tsc-alias` currently used by the project still depends on `baseUrl` for alias rewriting.

Migrating to TypeScript 6 therefore requires either replacing or changing the current alias-resolution approach, or waiting for `tsc-alias` to support the TypeScript 6 configuration.

## Decision

Stay on TypeScript 5 for now and continue using `baseUrl` together with `paths` and `tsc-alias`.

## Future migration

Migrate to TypeScript 6 once `tsc-alias` (or an equivalent solution) supports the project's `paths` configuration without requiring `baseUrl`.

Or implement another solution for path-resolving without bundler.

## Consequences

For now, the project remains on an older TypeScript major version than the current release.

This decision should be revisited when the relevant tooling supports the TypeScript 6 configuration.