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
- 计算机网络笔记可从 `_network-notes.md` 复制，物联网控制笔记可从 `_iot-notes.md` 复制；两份模板都包含图片写法、代码块和实验记录结构。它们本身不会出现在网站上。
- 建议使用 `计算机网络`、`物联网控制` 作为主题标签，再加 `TCP`、`MQTT` 等具体知识点；标签页会自动汇总已发布的笔记。
- 文章日期使用带时区的 ISO 8601，例如 `2026-11-09T10:00:00+08:00`；站点时区为 `Asia/Shanghai`。
- `draft: true` 及以下划线开头的文章不会生成公开页面。未来日期的文章需在发布日期重新构建后才会显示。
- 图片放到 `public/images/`，正文写 `![图片说明](/images/example.webp)`。也可以把图片放在文章旁并用相对路径引用，让 Astro 在构建时优化。
- 关于页面：`src/content/pages/about.md`。
- 站点标题、描述、社交链接：`astro-paper.config.ts`。
- 首页介绍：`src/pages/index.astro`。

目前保留原版文章列表；正文支持图片，列表封面及评论尚未添加。

已导入的课程笔记：

- 物联网控制：期中复习笔记，正文在 `src/content/posts/iot-control-midterm.md`，原图在 `public/images/iot-control-midterm/`。
- 计算机网络：数据链路层笔记，正文在 `src/content/posts/computer-networks-data-link.md`，原图在 `public/images/computer-networks-data-link/`。

两篇笔记保留原有正文，图片统一使用 Markdown 引用，适应正文宽度并支持点击放大。以后可直接修改上述博客文件，保存后运行 `blog-preview-update`。电脑原始学习目录中的文件不会自动同步到博客。

## 备案期间的私人预览

服务器提供仅监听 `127.0.0.1:4321` 的预览入口，不需要在安全组开放 4321 端口。预览根目录为 `/var/www/wingsluo.com/preview`，独立于公网网站的 `current` 目录；源文件修改后需要重新构建、更新预览目录才能看到变化。

当前服务器已安装 Node.js 24 和更新命令。保存文章后，在 VS Code 的远程终端执行：

```sh
blog-preview-update
```

看到“私人预览已更新”后刷新浏览器。该命令使用服务器当前保存的源码，无需先提交 Git；首次运行或依赖变化时自动安装依赖，并重新生成页面和搜索索引。它只更新私人预览目录，构建失败时保留已有预览。

命令源码为 `deploy/update-preview.sh`，安装位置为 `/usr/local/bin/blog-preview-update`，Node.js 位于 `/opt/node-v24.22.2-linux-x64`。构建任务限制为 900 MB 内存、1 GB Swap 和一个 CPU 核心；需要 root 或 sudo 权限。构建输出和报错会显示在运行命令的终端中。以上限制用于控制构建资源，不能保证在任何资源条件下都成功。

在 VS Code 通过 Remote SSH 连接服务器，打开 `/srv/wingsluo.com`，在“端口”面板点击“转发端口”，填写 `4321`，然后打开该行的本地地址。也可以在自己电脑的终端执行：

```sh
ssh -N -L 127.0.0.1:4322:127.0.0.1:4321 root@120.25.207.55
```

保持 SSH 连接，在本机浏览器打开 `http://127.0.0.1:4322/`。断开连接后该本地地址即失效。

需要修改后即时预览时，在装有 Node.js 24 的开发电脑上运行 `npm run dev`。私人预览入口独立于公网域名；使用中国内地服务器正式对外提供网站服务前，仍需完成备案并按审核要求配置。

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
