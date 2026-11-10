import type { TransitionBeforePreparationEvent } from "astro:transitions/client";

let clearLoading: (() => void) | undefined;

document.addEventListener("astro:before-preparation", event => {
  // Downloads and non-HTML documents use the browser's own loading UI.
  if (event.defaultPrevented || /\.[^/]+$/.test(event.to.pathname)) return;

  clearLoading?.();
  const overlay = document.getElementById("navigation-loading");
  const message = document.getElementById("navigation-loading-message");
  const main = document.querySelector("main");
  if (!overlay || !message || !main) return;

  const root = document.documentElement;
  const previousBusy = main.getAttribute("aria-busy");
  const previousInert = main.inert;
  const headerBottom =
    document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
  overlay.style.setProperty(
    "--navigation-loading-top",
    `${Math.max(0, headerBottom)}px`
  );
  message.textContent = event.to.pathname.includes("/posts/")
    ? "正在加载文章…"
    : "正在加载页面…";
  overlay.hidden = false;
  root.dataset.navigationLoading = "";
  main.setAttribute("aria-busy", "true");
  main.inert = true;

  const slowTimer = window.setTimeout(() => {
    message.textContent = "网络较慢，仍在加载…你也可以使用浏览器返回。";
  }, 8000);

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(slowTimer);
    event.signal.removeEventListener("abort", finish);
    overlay.hidden = true;
    delete root.dataset.navigationLoading;
    main.inert = previousInert;
    if (previousBusy === null) main.removeAttribute("aria-busy");
    else main.setAttribute("aria-busy", previousBusy);
    if (clearLoading === finish) clearLoading = undefined;
  };
  clearLoading = finish;
  event.signal.addEventListener("abort", finish, { once: true });

  // Keep the placeholder until the DOM is swapped, including stylesheet loading.
  // Restore the old page if a later listener cancels or the router falls back.
  const load: TransitionBeforePreparationEvent["loader"] = event.loader;
  event.loader = async () => {
    try {
      await load();
    } catch (error) {
      finish();
      throw error;
    } finally {
      if (event.defaultPrevented || event.signal.aborted) finish();
    }
  };
  queueMicrotask(() => {
    if (event.defaultPrevented || event.signal.aborted) finish();
  });
});

document.addEventListener("astro:after-swap", () => clearLoading?.());
window.addEventListener("pageshow", () => clearLoading?.());
