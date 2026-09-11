# Yomu Extensions

Source extensions for the Yomu iOS and iPadOS reader.

This repository contains source only. The catalog the app installs is generated in CI and published to GitHub Pages.

## Catalog URL

In Yomu, add this repository URL:

```
https://kodari-io.github.io/yomu-extensions/index.json
```

## Requirements

- Node.js 22 or later
- npm 10 or later

## Commands

```sh
npm install
npm run verify
```

`npm run verify` lints, type-checks, builds artifacts into `dist/`, and runs tests. `dist/` is gitignored and is not the install source.

## Structure

- `packages/extension-kit` defines the TypeScript contract matching `YomuExtensionKit` contract version 1.
- `extensions/*` are individual source packages.
- `scripts/generate-index.ts` validates manifests and writes `dist/index.json`.
- GitHub Actions publishes `dist/` to GitHub Pages on every push to `main`.
