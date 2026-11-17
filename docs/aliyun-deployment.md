# 阿里云部署与更新

正式站点使用阿里云 `120.25.207.55`，Caddy 提供 HTTPS 静态文件服务。
GitHub 的默认博客分支为 `feat/astropaper-blog`，保留 `main` 中的旧简历。

## 更新文章

在本地仓库修改、提交并推送到 `feat/astropaper-blog`。
GitHub Actions 的 **Build blog** 会检查代码、构建站点，然后自动部署到阿里云。
只有检查和构建成功才会更新网站；部署后检查失败会恢复上一版本。
不需要在服务器上运行 Node 或手动执行构建。

```bash
git add <本次修改的文件>
git commit -m "更新文章"
git push origin feat/astropaper-blog
```

Actions 页面可以查看构建及部署结果，也可以通过 **Run workflow** 手动重新部署博客分支。
`https://wingsluo.com/deployment.json` 显示当前部署的提交编号。
Cloudflare 原有构建可保留作为备用；域名通过灰云 A 记录直连阿里云。

## 服务器目录

- `/srv/wingsluo.com`：源代码，修改这里不会自动触发 GitHub Actions，需要提交并推送。
- `/var/www/wingsluo-live/current`：线上静态文件的符号链接，不要直接修改。
- `/var/www/wingsluo-live/releases`：保留最近至少 5 个发布版本。
- `/var/www/wingsluo-live/previous`：上一个成功发布的版本。
- `/etc/caddy/Caddyfile`：HTTPS 和静态文件服务配置。
- `/usr/local/bin/wingsluo-deploy`：受限部署接收程序。

GitHub Actions 通过专用 `blogdeploy` 用户上传构建产物。部署密钥只能运行部署命令，
不能获得普通 SSH 终端，服务器不保存 GitHub 访问令牌。
上传使用受限 rsync，只传输有变化的文件，避免每次更新文章都重复上传图片和 PDF。
上传到 `incoming/build` 后才生成独立发布目录；未完成的上传不影响线上版本。
仓库 Secrets：`ALIYUN_DEPLOY_KEY`、`ALIYUN_KNOWN_HOSTS`。

## 回退与排查

以 root 登录服务器后，可以原子切回上一个版本：

```bash
flock /var/www/wingsluo-live/.deploy.lock bash -c '
  cd /var/www/wingsluo-live
  ln -s "$(readlink -f previous)" .rollback-manual
  mv -Tf .rollback-manual current
'
```

查看服务和证书日志：

```bash
systemctl status caddy
journalctl -u caddy -n 80 --no-pager
curl --resolve wingsluo.com:443:127.0.0.1 https://wingsluo.com/deployment.json
```

服务器重启后 Caddy 自动启动。已有私人预览端口 4321 仍可使用原来的 SSH 转发方式。

## 域名与备案

Cloudflare 中解除原 Worker 的 `wingsluo.com` 自定义域名绑定，然后设置：

| 类型 | 名称 | 内容          | 代理状态       |
| ---- | ---- | ------------- | -------------- |
| A    | @    | 120.25.207.55 | 仅 DNS（灰云） |

不要保留指向旧站的冲突 A、AAAA 或 CNAME 记录。无需删除 Worker 本身。
HTTPS 由 Caddy 自动签发和续期。灰云时 Cloudflare 的 SSL 模式不影响浏览器到服务器的连接。
页脚显示已核实的网站备案号“粤ICP备2026182938号-1”，并链接至工信部备案平台。
以后可通过仓库变量 `PUBLIC_ICP_NUMBER` 覆盖默认编号。
