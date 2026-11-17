# PDF 文件与下载

网站直接提供 PDF 文件链接，由浏览器或设备自带的阅读器打开，不提供内置阅读页。

## 添加 PDF

1. 将文件放入 `public/pdfs/` 下，例如 `public/pdfs/notes/example.pdf`。
2. 在文章中添加直接链接：

   ```md
   [打开 PDF](/pdfs/notes/example.pdf)
   ```

3. 如需下载入口，可以添加：

   ```html
   <a href="/pdfs/notes/example.pdf" download="示例文档.pdf">下载 PDF</a>
   ```

4. 将 PDF 文件和文章一起提交并推送，等待自动部署完成。

PDF 本身的排版不变；能否在浏览器内预览、使用何种阅读界面，由浏览器和设备决定。
