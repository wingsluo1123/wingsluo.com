import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://wingsluo.com/",
    title: "WingsLuo",
    description: "记录开发、学习与生活。",
    author: "WingsLuo",
    profile: "https://wingsluo.com/about/",
    ogImage: "default-og.png",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: { perPage: 6, perIndex: 4 },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: { enabled: false },
    search: "pagefind",
    toc: true,
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/wingsluo1123",
      linkTitle: "WingsLuo 的 GitHub",
    },
    {
      name: "mail",
      url: "mailto:wingsluo1123@gmail.com",
      linkTitle: "通过邮件联系 WingsLuo",
    },
  ],
  shareLinks: [],
});
