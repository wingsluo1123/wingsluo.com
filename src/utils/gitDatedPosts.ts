import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { relative, resolve } from "node:path";
import { glob, type Loader } from "astro/loaders";

/** Keep the authored publication date, and derive the latest edit from Git. */
export function gitDatedPosts(base: string): Loader {
  const source = glob({ pattern: "**/[^_]*.{md,mdx}", base });

  return {
    name: "git-dated-posts",
    async load(context) {
      const root = fileURLToPath(context.config.root);
      const git = (...args: string[]) =>
        execFileSync("git", args, {
          cwd: root,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
      let revision = "";
      try {
        revision = git("rev-parse", "HEAD");
      } catch {
        // Source archives without Git use only the authored frontmatter dates.
      }

      await source.load({
        ...context,
        // Revalidate cached entries after a commit, including a new file's
        // first commit where its Markdown content itself hasn't changed.
        generateDigest: data => context.generateDigest({ data, revision }),
        async parseData(props) {
          if (revision && props.filePath && !props.data.modDatetime) {
            const path = relative(root, resolve(root, props.filePath));
            const dates = git(
              "log",
              "--follow",
              "-2",
              "--format=%cI",
              "--",
              path
            )
              .split("\n")
              .filter(Boolean);
            // A first upload is a publication, not an edit.
            if (dates.length > 1) {
              const modified = new Date(dates[0]);
              const published = new Date(
                props.data.pubDatetime as string | Date
              );
              if (modified.getTime() > published.getTime()) {
                return context.parseData({
                  ...props,
                  data: { ...props.data, modDatetime: modified },
                });
              }
            }
          }
          return context.parseData(props);
        },
      });
    },
  };
}
