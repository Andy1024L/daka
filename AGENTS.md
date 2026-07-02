# Codex 项目约定

## 应用更新版本

- 每次做了用户能感知到的应用改动后，都要同步更新 `lib/app-version.ts` 和 `public/version.json`。
- `APP_VERSION`、`APP_UPDATED_AT`、`version`、`updatedAt` 必须保持一致。
- 时间使用中国本地时间，固定格式为：`YYYY-MM-DD HH:mm`，例如 `2026-06-22 21:36`。
- 修改影响应用行为的代码后，提交前运行 `npm run build` 检查。
