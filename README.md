# 每日打卡

记录锻炼和拉伸的个人 PWA，提供首页打卡、统计和数据管理，支持离线记录、自动同步及 Excel 导入导出。

## 当前维护入口

- 正式网站：https://6668080.xyz
- 唯一维护仓库：https://github.com/Andy1024L/daka，分支 `main`。
- 本地目录：`C:\1.个人开发\12_daka`。
- 托管：腾讯云 EdgeOne Makers / Pages，现有云端项目仍叫 `daka-kv`，项目 ID 为 `makers-kapdb028mmbi`。
- 数据：EdgeOne KV，通过 `/api/records` 读写；前端先保存到本地，联网后自动同步。

此前的 `daka-kv` 仓库已更名为 `daka`；旧 Supabase 仓库和本地副本已删除。云端项目名与 GitHub 仓库名可以不同，保留现有云端项目和 KV 绑定即可。

## 本地运行

当前使用 Node.js 24 和 npm；依赖版本以 `package-lock.json` 为准。

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

已有 `.env.local` 时保留原文件。按需在本机配置 `APP_PASSWORD`、`AUTH_SECRET` 和 `EDGEONE_KV_BINDING_NAME`，变量说明见 `.env.example`。EdgeOne CLI 关联项目会将云端环境变量拉取到 `.env`；这些私密文件均不进入 Git。

普通 Next.js 本地开发不具备云端 KV 绑定，不能用本地 KV 连接失败来判断生产故障。调试 KV 需要 EdgeOne 的对应开发环境。

```powershell
npm run lint
npm test
npm run build
```

## 部署与维护

现有 EdgeOne 项目使用 GitHub 集成部署；2026-11-11 已核实平台中的仓库地址为 `https://github.com/Andy1024L/daka`。推送 `main` 后，在 EdgeOne 核对构建是否触发、代码提交是否正确以及部署是否成功。若自动构建未触发，在现有项目里检查仓库关联，保留域名、环境变量和 KV 绑定。

应用改动需要同步更新 `lib/app-version.ts` 和 `public/version.json`。部署后检查网站、`/version.json` 及登录后的记录读取；文档或包名整理不改变应用版本号。

HTTPS 由 EdgeOne 免费证书自动验证和续签，保持域名 CNAME 指向现有项目。页面正常加载不等于数据同步正常，排障时同时核对证书、API 和待同步操作。

## 归档和备份

完整恢复需要分别保存三部分：

1. **代码**：本仓库及 Git 历史，包括 `edge-functions/`、配置和测试。GitHub 归档只会将仓库设为只读，不会备份云端数据。
2. **打卡数据**：在手机桌面 PWA 的“数据”页导出表格。Safari 与桌面 PWA 的本地数据独立；仍有离线记录时分别保留，先确认同步完成。若要迁移或关闭云服务，还需备份当前 KV 命名空间，保留 `workouts_all` 和 `workouts_deleted`。
3. **私密配置**：在私人备份位置保存环境变量、KV 绑定、域名及部署关联信息，凭据不上传公开仓库。

`.next/`、`node_modules/`、日志和 `tsconfig.tsbuildinfo` 都是可重新生成的本地产物，可以在归档副本中省略；本地 `.env`、`.env.local` 和 `.edgeone/project.json` 应另行妥善保留。继续使用网站时，保留正在运行的 EdgeOne 项目、KV 命名空间和域名配置。
