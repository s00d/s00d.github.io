# s00d.github.io

Personal site: <https://s00d.github.io>. Static Nuxt 4 + Nuxt UI (Tailwind 4).

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm generate   # static site in .output/public
```

The project list is pulled from the GitHub API at build time (`server/api/projects.json.get.ts`).
Set `NUXT_GITHUB_TOKEN` to avoid the anonymous rate limit. Pushing to `master` deploys to the
`gh-pages` branch (`.github/workflows/deploy.yaml`).
