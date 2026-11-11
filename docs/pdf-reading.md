# PDF 阅读页

阅读器使用 PDF.js，在当前标签页打开，沿用博客主题。PDF 原始排版和页面颜色保持不变。

## 添加 PDF

1. 将文件放入 `public/pdfs/` 下，例如 `public/pdfs/notes/example.pdf`。
2. 在 `src/data/documents.ts` 的数组中添加一项：

   ```ts
   {
     id: "example",
     title: "示例文档",
     file: "pdfs/notes/example.pdf",
     article: "posts/your-article/",
   },
   ```

3. 在文章中加入 `[开始阅读](/read/example/)`，然后将 PDF、配置和文章一起提交。

`id` 决定阅读页地址；`article` 决定“返回文章”的位置。阅读页还支持 `#page=3`，便于分享指定页。

## 功能与限制

- 支持页码跳转、左右按钮和聚焦页面后的左右方向键翻页。
- 支持适合宽度和比例缩放、文字选择、关键词搜索及下载。
- 目录来自 PDF 内置书签，没有书签时可使用搜索或页码。
- 扫描件若没有文字层，需要先做 OCR 才能搜索或复制文字。
- 当前每次渲染一页，避免手机同时渲染整本文档而占用大量内存。

## 本地运行与部署

照常执行 `npm ci`、`npm run dev` 或 `npm run build`。开发及构建前会将当前版本 PDF.js 的 CMaps、字体和 WASM 复制到 `public/pdfjs/`；这些生成文件无需提交。PDF.js 脚本和资源均从本站加载，不依赖外部 CDN。

部署时上传整个 `dist/`。服务器需为 `.mjs` 提供 JavaScript MIME 类型，为 `.wasm` 提供 `application/wasm`。Cloudflare 静态资源支持这些类型；自建服务器时需保留相应 MIME 配置。
