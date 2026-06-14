# BioFiling — 实验室生物安全备案管理系统

> 面向高校与科研机构的实验室安全备案全栈信息管理系统，覆盖备案表单填报、材料上传、审批管理及标准 Word 文档一键导出全流程。

## 技术栈

| 层级      | 技术选型                                                 |
| --------- | -------------------------------------------------------- |
| 前端框架  | Vue 3 (Composition API +`<script setup>`) + TypeScript |
| UI 组件库 | TDesign Vue Next                                         |
| 构建工具  | Vite 7                                                   |
| 状态管理  | Pinia                                                    |
| 路由      | Vue Router 4                                             |
| 后端框架  | Express 4 + TypeScript                                   |
| ORM       | Prisma 7 (LibSQL 适配器)                                 |
| 数据库    | SQLite (开发零依赖，生产可切换 PostgreSQL)               |
| 认证      | CAS 统一身份认证 + JWT                                   |
| 表单校验  | Vee-Validate + Zod (前后端共享 Schema)                   |
| 文档生成  | docx-templates (模板渲染) + archiver (批量 ZIP 打包)     |
| 安全防护  | Helmet + CORS + express-rate-limit                       |
| 日志      | Winston + Morgan                                         |

## 功能亮点

### 🔐 认证与权限

- **CAS 统一认证**：对接高校 CAS 单点登录系统，支持生产模式 CAS 票据校验与开发模式本地直登一键切换
- **JWT 无状态鉴权**：HS256 签名，8 小时有效期，Bearer Token 透传
- **角色分级管控**：管理员（`ADMIN_IDS` 环境变量配置）与普通用户两级权限模型
  - 普通用户：填报、编辑、查看、删除本人备案记录，下载本人 Word 文档
  - 管理员：查看全量记录、关键词/状态检索、审批（通过/驳回并留言）、批量导出 ZIP、删除任意记录
- **接口级权限拦截**：`authenticate` 中间件 + `req.user.isAdmin` 路由守卫双重校验

### 📝 备案表单

- **六大信息分区**：基本信息 → 人员信息 → 风险评估 → 地点与时间 → 实验内容 → 附件上传
- **动态表单**：实验人员表格支持增删行，动物/病原体信息联动显隐，风险操作复选框组
- **图片上传管线**：UUIDv7 命名 → 临时目录暂存 → 提交时按 `YYYY/MM` 归档 → 静态资源托管
- **一键 Mock 数据**：开发模式快速填充示例数据，提升调试效率
- **暗色模式**：CSS 自定义属性驱动，支持亮/暗主题切换，响应式布局适配移动端

### 🛡️ 数据校验

- 前后端共享 Zod Schema 定义(`src/shared/validation/`)，确保校验逻辑一致
- 复杂条件校验：有毒物质必填说明、公开信息必填描述、动物/病原体依赖关系
- 前端 Vee-Validate + `@vee-validate/zod` 适配器，实时表单校验与错误提示
- 后端 Zod 校验中间件覆盖所有写入接口，拒绝非法数据入库

### 📄 文档导出

- **Word 模板渲染**：基于 `docx-templates` 引擎，服务端读取 `template.docx` 模板，将备案数据动态填充为标准化 Word 文件
- **图片嵌入**：表单上传的图片自动读取并嵌入 Word 文档，支持宽高设定
- **单条下载**：同步生成 Buffer 直接返回文件流
- **批量打包**：利用 `archiver` 流式 ZIP 压缩，管理员一键打包导出全部备案记录；导出失败的记录生成 `ERROR_xxx.txt` 错误说明，不影响其他文件

### 🛠️ 工程化

- **单一仓库全栈**：`src/client/` + `src/server/` + `src/shared/` 同仓协作，TypeScript 严格模式
- **开发体验**：`concurrently` 并行启动 Vite (8080) + Nodemon (3000)，Vite 代理 `/api` 转发
- **生产构建**：`vue-tsc` 类型检查 → `vite build` 前端 SPA → `tsup` 打包后端 ESM，单文件部署
- **安全加固**：Helmet 安全头 + CORS 白名单 + 全局速率限制(100 次/15 分钟/IP) + 文件上传类型/大小校验
- **日志体系**：Winston 分级日志(文件轮转 5MB × 5)，Morgan HTTP 请求日志，敏感字段(密码/token)自动脱敏
- **优雅退出**：SIGTERM/SIGINT 信号处理，关闭 HTTP Server → 断开 Prisma → 清理退出

## 项目结构

```
BioFiling/
├── prisma/
│   ├── schema.prisma          # 数据模型定义 (SQLite)
│   ├── migrations/            # 数据库迁移文件
│   └── fallback.db            # SQLite 本地数据库文件
├── src/
│   ├── client/                # Vue 3 前端
│   │   ├── api/               # Axios 封装 + API 接口定义
│   │   ├── assets/            # 样式 (Less + CSS 变量主题)
│   │   ├── components/        # 通用组件 + 备案表单六大分区组件
│   │   ├── composables/       # 组合式函数
│   │   ├── router/            # 路由配置 + CAS 导航守卫
│   │   ├── stores/            # Pinia 状态管理 (auth/filing/app)
│   │   └── views/             # 页面 (首页列表 / 表单填报)
│   ├── server/                # Express 后端
│   │   ├── controllers/       # 路由处理器 (auth/filing/docx/upload)
│   │   ├── middlewares/       # 全局错误处理中间件
│   │   ├── routes/            # 路由定义
│   │   ├── services/          # 业务逻辑层 (filing/docx)
│   │   ├── utils/             # 工具 (CAS/JWT/Prisma/日志/错误类)
│   │   ├── server.ts          # 服务入口
│   │   └── types.ts           # 公共类型定义
│   └── shared/                # 前后端共享
│       ├── types/             # TypeScript 接口定义
│       └── validation/        # Zod 校验 Schema
├── template.docx              # Word 导出模板
├── uploads/                   # 上传文件目录 (运行时生成)
├── .env.development           # 开发环境变量
├── .env.production            # 生产环境变量
├── vite.config.ts             # Vite 构建配置
├── tsconfig.json              # TypeScript 配置
└── package.json               # 项目依赖与脚本
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.development
# 编辑 .env.development 设置 JWT_SECRET、ADMIN_IDS 等

# 开发模式启动 (Vite :8080 + Express :3000)
pnpm dev

# 生产构建
pnpm build

# 生产启动
pnpm start
```

## 主要 API 端点

| 方法  | 路径                          | 认证   | 说明                   |
| ----- | ----------------------------- | ------ | ---------------------- |
| POST  | `/api/auth/cas/validate`    | 否     | CAS 票据校验，返回 JWT |
| GET   | `/api/auth/me`              | JWT    | 获取当前用户信息       |
| POST  | `/api/filings/submit`       | JWT    | 提交备案记录           |
| GET   | `/api/filings/my`           | JWT    | 获取本人备案列表       |
| GET   | `/api/filings`              | 管理员 | 获取全部备案列表       |
| GET   | `/api/filings/:id/download` | JWT    | 下载单条 Word 文档     |
| GET   | `/api/filings/exports`      | 管理员 | 批量导出 ZIP 压缩包    |
| PATCH | `/api/filings/:id/audit`    | 管理员 | 审批备案（通过/驳回）  |
| POST  | `/api/upload/image`         | JWT    | 上传图片               |
