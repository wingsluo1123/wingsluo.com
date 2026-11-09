# wingsluo.com

WingsLuo 的个人博客，基于 [AstroPaper v7.1.0](https://github.com/satnaing/astro-paper/tree/v7.1.0)。保留原版布局，添加简体中文界面。

正式访问地址：**https://wingsluo.com/**。部署目标为个人云服务器，Cloudflare 负责 DNS 与代理。旧简历首页已被博客替换，原内容仍在 Git 历史中。

## 本地开发

使用 Node.js 24（见 `.nvmrc`）和 npm。

```sh
npm ci
npm run dev
```

开发地址通常为 `http://localhost:4321`。

```sh
npm run lint
npm run format:check
npm run build
npm run preview
```

`npm run build` 会检查类型、生成静态网站及 Pagefind 搜索索引，最终产物在 `dist/`。搜索首次使用前需先构建。服务器只需要提供 `dist/` 中的文件，无需运行 Node.js 或数据库。

Google Sans Code 字体已随项目保存到 `src/assets/fonts/`，构建时无需连接 Google 字体服务。中文使用系统字体。社交分享使用静态 PNG，未启用动态分享图生成。

## 写文章与插图

- 文章在 `src/content/posts/`，支持 `.md` / `.mdx`。
- 复制 `_writing-template.md` 并移除新文件名开头的 `_`，修改标题、日期、摘要和标签后，将 `draft` 改成 `false`。
- 文章日期使用带时区的 ISO 8601，例如 `2026-11-09T10:00:00+08:00`；站点时区为 `Asia/Shanghai`。
- `draft: true` 及以下划线开头的文章不会生成公开页面。未来日期的文章需在发布日期重新构建后才会显示。
- 图片放到 `public/images/`，正文写 `![图片说明](/images/example.webp)`。也可以把图片放在文章旁并用相对路径引用，让 Astro 在构建时优化。
- 关于页面：`src/content/pages/about.md`。
- 站点标题、描述、社交链接：`astro-paper.config.ts`。
- 首页介绍：`src/pages/index.astro`。

目前保留原版文章列表；正文支持图片，列表封面及评论尚未添加。

## 部署到云服务器

GitHub Actions 会进行检查与构建，并提供名为 `wingsluo-blog` 的静态网站压缩包。可以在本地或 CI 构建后上传，减少 2 GB 内存服务器的构建负担。

推荐发布目录结构：

```text
/var/www/wingsluo.com/
├── releases/       # 每次构建存放到单独的子目录
└── current         # 指向已确认发布的构建目录的符号链接
```

`deploy/Caddyfile` 是独立站点的 Caddy 配置示例，根目录为 `/var/www/wingsluo.com/current`。Caddy 会申请并续期 HTTPS 证书。若已有 Nginx、Caddy、1Panel 或其他网站，先检查现有站点及端口，再把博客加入现有服务配置，避免覆盖其他服务。

首次发布顺序：

1. 检查服务器系统、现有 Web 服务和 80/443 端口；确认博客目录。
2. 构建，将 `dist/` 的内容上传到独立的 release 目录，验证后让 `current` 指向它。
3. 配置 Web 服务并通过 `http://120.25.207.55/` 预览。确认云服务器安全组允许入站 TCP 80 和 443。Caddy 会在域名指向服务器后通过 HTTP 验证申请 HTTPS 证书。
4. 在 Cloudflare 将根域名 `@` 的 A 记录改为服务器公网 IPv4。检查是否有指向旧站的 AAAA、CNAME、Pages/Workers 自定义域名或路由，按实际情况调整；不要改动其他子域名。
5. 首次签发证书时先使用 **DNS only（灰云）**，待 `https://wingsluo.com/` 的源站证书签发成功后，再启用代理并使用 **Full (strict)** 模式，检查首页、文章、搜索、RSS、HTTPS 和 404。
6. 源站发布成功后，如仍显示旧页面，再清理相关 Cloudflare 缓存。

若需要 `www.wingsluo.com`，另行添加 DNS 及跳转到根域名的站点配置。当前配置只启用 `wingsluo.com`。

如果旧 Cloudflare 项目仍监听本仓库，不要直接合并或推送生产分支触发旧部署；先协调停止旧项目部署或调整构建为 `npm run build`、输出目录为 `dist`。保留的 `wrangler.jsonc` 只允许发布 `dist/`，不会把源码目录当作网站发布。

远程发布需要可用的 SSH 身份；VS Code 的 Remote SSH 会话不等于其他应用自动获得服务器访问权限。

## 来源与许可

基于 AstroPaper v7.1.0，源提交 `2e8bcbe61d85d52cb3420e876e2c308f37322d0d`。保留上游 MIT 许可，见 `LICENSE`。

Google Sans Code 字体使用 SIL Open Font License，许可文件为 `src/assets/fonts/OFL.txt`，来源为 [google/fonts](https://github.com/google/fonts/tree/main/ofl/googlesanscode)。
