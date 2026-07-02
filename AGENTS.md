# Project Notes for Codex

## App Update Version

- After every user-visible app change, update both `lib/app-version.ts` and `public/version.json`.
- Keep `APP_VERSION`, `APP_UPDATED_AT`, `version`, and `updatedAt` in sync.
- Use local China time in this exact display format: `YYYY-MM-DD HH:mm`, for example `2026-06-22 21:36`.
- Run `npm run build` before committing changes that affect app behavior.
