import { getDocument, GlobalWorkerOptions, TextLayer } from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

let dispose: (() => void) | undefined;

function initReader() {
  dispose?.();
  const root = document.querySelector<HTMLElement>("[data-pdf-reader]");
  if (!root) return;
  const query = <T extends HTMLElement>(selector: string) => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing reader control: ${selector}`);
    return element;
  };
  const stage = query<HTMLDivElement>("[data-stage]");
  const paper = query<HTMLDivElement>("[data-paper]");
  const status = query<HTMLParagraphElement>("[data-status]");
  const error = query<HTMLDivElement>("[data-error]");
  const pageInput = query<HTMLInputElement>("#pdf-page");
  const previous = query<HTMLButtonElement>("[data-prev]");
  const next = query<HTMLButtonElement>("[data-next]");
  const zoom = query<HTMLSelectElement>("[data-zoom]");
  const pageForm = query<HTMLFormElement>("[data-page-form]");
  const searchForm = query<HTMLFormElement>("[data-search-form]");
  const searchInput = query<HTMLInputElement>("#pdf-search");
  const searchStatus = query<HTMLParagraphElement>("[data-search-status]");
  const searchResults = query<HTMLOListElement>("[data-search-results]");
  const outline = query<HTMLElement>("[data-outline]");
  const outlineStatus = query<HTMLParagraphElement>("[data-outline-status]");
  const navigation = query<HTMLDetailsElement>("[data-navigation]");
  if (window.matchMedia("(max-width: 800px)").matches) navigation.open = false;

  const events = new AbortController();
  let pdf: PDFDocumentProxy | undefined;
  let task: ReturnType<typeof getDocument> | undefined;
  let rendering: RenderTask | undefined;
  let textLayer: TextLayer | undefined;
  let pageNumber = 1;
  let renderId = 0;
  let searchId = 0;
  let loadId = 0;
  let closed = false;
  let searchTerm = "";
  const pageText = new Map<number, Promise<string>>();
  const on = <K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    name: K,
    listener: (event: HTMLElementEventMap[K]) => void
  ) => element.addEventListener(name, listener, { signal: events.signal });

  function showError(message: string) {
    status.textContent = message;
    error.hidden = false;
    stage.setAttribute("aria-busy", "false");
  }

  function highlight() {
    const term = searchTerm.toLocaleLowerCase();
    paper.querySelectorAll<HTMLSpanElement>(".textLayer span").forEach(span => {
      span.classList.toggle(
        "reader-search-hit",
        !!term && (span.textContent ?? "").toLocaleLowerCase().includes(term)
      );
    });
  }

  async function renderPage() {
    if (!pdf || closed) return;
    const id = ++renderId;
    rendering?.cancel();
    textLayer?.cancel();
    stage.setAttribute("aria-busy", "true");
    status.textContent = `正在显示第 ${pageNumber} 页…`;
    error.hidden = true;
    pageInput.value = String(pageNumber);
    previous.disabled = pageNumber <= 1;
    next.disabled = pageNumber >= pdf.numPages;
    try {
      const page = await pdf.getPage(pageNumber);
      if (closed || id !== renderId) return;
      const padding =
        parseFloat(getComputedStyle(stage).paddingInlineStart) * 2;
      const available = Math.max(160, stage.clientWidth - padding);
      const natural = page.getViewport({ scale: 1 });
      const scale =
        zoom.value === "fit" ? available / natural.width : Number(zoom.value);
      const viewport = page.getViewport({ scale });
      // Limit a single canvas on high-DPI phones and unusually large PDF pages.
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        2,
        Math.sqrt(8_000_000 / (viewport.width * viewport.height))
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width * ratio);
      canvas.height = Math.ceil(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.setAttribute("aria-label", `第 ${pageNumber} 页`);
      canvas.setAttribute("role", "img");
      const render = page.render({
        canvas,
        viewport,
        transform: [ratio, 0, 0, ratio, 0, 0],
        background: "rgb(255,255,255)",
      });
      rendering = render;
      await render.promise;
      if (closed || id !== renderId) return;
      const layer = document.createElement("div");
      layer.className = "textLayer";
      paper.style.setProperty("--scale-factor", String(scale));
      paper.style.setProperty("--user-unit", String(page.userUnit));
      paper.style.setProperty(
        "--total-scale-factor",
        String(scale * page.userUnit)
      );
      paper.style.width = `${viewport.width}px`;
      paper.style.height = `${viewport.height}px`;
      paper.replaceChildren(canvas, layer);
      const textContent = await page.getTextContent();
      if (closed || id !== renderId) return;
      textLayer = new TextLayer({
        textContentSource: textContent,
        container: layer,
        viewport,
      });
      await textLayer.render();
      if (closed || id !== renderId) return;
      highlight();
      status.textContent = `第 ${pageNumber} 页，共 ${pdf.numPages} 页`;
      stage.setAttribute("aria-busy", "false");
    } catch {
      if (!closed && id === renderId)
        showError("页面显示失败，可以重试或下载 PDF。");
    }
  }

  function goToPage(number: number) {
    if (!pdf || !Number.isFinite(number)) return;
    pageNumber = Math.max(1, Math.min(pdf.numPages, Math.trunc(number)));
    const url = new URL(location.href);
    url.hash = `page=${pageNumber}`;
    history.replaceState(history.state, "", url);
    stage.scrollTo({ top: 0, left: 0, behavior: "instant" });
    void renderPage();
  }

  async function destinationPage(destination: unknown): Promise<number | null> {
    if (!pdf) return null;
    const target =
      typeof destination === "string"
        ? await pdf.getDestination(destination)
        : destination;
    if (!Array.isArray(target) || target.length === 0) return null;
    const index =
      typeof target[0] === "number"
        ? target[0]
        : await pdf.getPageIndex(target[0]);
    return index + 1;
  }

  async function loadOutline() {
    if (!pdf) return;
    try {
      const items = await pdf.getOutline();
      if (closed) return;
      if (!items?.length) {
        outlineStatus.textContent =
          "这份 PDF 没有内置目录，可使用页码或搜索定位。";
        return;
      }
      type OutlineItem = (typeof items)[number];
      const list = (entries: OutlineItem[]): HTMLOListElement => {
        const ol = document.createElement("ol");
        entries.forEach(entry => {
          const li = document.createElement("li");
          if (entry.dest) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = entry.title;
            on(button, "click", () => {
              void destinationPage(entry.dest)
                .then(page => {
                  if (closed || page === null) return;
                  goToPage(page);
                  if (window.matchMedia("(max-width: 800px)").matches)
                    navigation.open = false;
                })
                .catch(() => {
                  outlineStatus.textContent =
                    "此目录项无法定位，请使用页码跳转。";
                });
            });
            li.append(button);
          } else {
            const label = document.createElement("span");
            label.textContent = entry.title;
            li.append(label);
          }
          if (entry.items.length) li.append(list(entry.items));
          ol.append(li);
        });
        return ol;
      };
      outline.replaceChildren(list(items));
      outlineStatus.textContent = "";
    } catch {
      if (!closed)
        outlineStatus.textContent = "目录暂时无法读取，可使用页码或搜索。";
    }
  }

  function textForPage(number: number) {
    let text = pageText.get(number);
    if (!text) {
      text = pdf!
        .getPage(number)
        .then(page => page.getTextContent())
        .then(content =>
          content.items.map(item => ("str" in item ? item.str : "")).join("")
        );
      pageText.set(number, text);
    }
    return text;
  }

  async function search() {
    if (!pdf) return;
    const id = ++searchId;
    searchTerm = searchInput.value.trim();
    const term = searchTerm.toLocaleLowerCase();
    highlight();
    searchResults.replaceChildren();
    if (!term) {
      searchStatus.textContent = "";
      return;
    }
    searchStatus.textContent = "正在搜索…";
    let hits = 0;
    let hasText = false;
    try {
      for (let number = 1; number <= pdf.numPages; number++) {
        const text = await textForPage(number);
        if (closed || id !== searchId) return;
        hasText ||= !!text.trim();
        const index = text.toLocaleLowerCase().indexOf(term);
        if (index < 0) continue;
        hits++;
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `第 ${number} 页 · ${text.slice(Math.max(0, index - 12), index + term.length + 35)}`;
        on(button, "click", () => {
          goToPage(number);
          if (window.matchMedia("(max-width: 800px)").matches)
            navigation.open = false;
        });
        li.append(button);
        searchResults.append(li);
        searchStatus.textContent = `已找到 ${hits} 页，正在继续搜索…`;
      }
      searchStatus.textContent = !hasText
        ? "此 PDF 没有可搜索的文字层，可能是扫描件。"
        : hits
          ? `在 ${hits} 页中找到关键词，点击结果跳转。`
          : "没有找到匹配内容。";
    } catch {
      if (!closed && id === searchId)
        searchStatus.textContent = "搜索未完成，请重试。";
    }
  }

  async function load() {
    const id = ++loadId;
    status.textContent = "正在加载文档…";
    error.hidden = true;
    stage.setAttribute("aria-busy", "true");
    try {
      task = getDocument({
        url: root!.dataset.file!,
        cMapUrl: `${root!.dataset.resources}cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${root!.dataset.resources}standard_fonts/`,
        wasmUrl: `${root!.dataset.resources}wasm/`,
      });
      const loaded = await task.promise;
      if (closed || id !== loadId) return;
      pdf = loaded;
      query("[data-page-count]").textContent = String(pdf.numPages);
      pageInput.max = String(pdf.numPages);
      root!
        .querySelectorAll<
          HTMLInputElement | HTMLSelectElement | HTMLButtonElement
        >("input, select, button")
        .forEach(control => {
          control.disabled = false;
        });
      const requested = Number(
        new URLSearchParams(location.hash.slice(1)).get("page")
      );
      goToPage(requested || 1);
      void loadOutline();
    } catch {
      if (!closed && id === loadId)
        showError("文档加载失败，请检查网络后重试。");
    }
  }

  on(previous, "click", () => goToPage(pageNumber - 1));
  on(next, "click", () => goToPage(pageNumber + 1));
  on(pageForm, "submit", event => {
    event.preventDefault();
    goToPage(pageInput.valueAsNumber);
  });
  on(zoom, "change", () => {
    void renderPage();
  });
  on(searchForm, "submit", event => {
    event.preventDefault();
    void search();
  });
  on(searchInput, "input", () => {
    ++searchId;
    searchTerm = "";
    highlight();
    searchResults.replaceChildren();
    searchStatus.textContent = "";
  });
  on(query("[data-retry]"), "click", () => {
    if (pdf) void renderPage();
    else {
      void task?.destroy().catch(() => {});
      void load();
    }
  });
  on(stage, "keydown", event => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.target !== stage
    )
      return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      goToPage(pageNumber + (event.key === "ArrowLeft" ? -1 : 1));
    }
  });
  let resizeTimer: number;
  let lastWidth = stage.clientWidth;
  const observer = new ResizeObserver(() => {
    if (lastWidth === stage.clientWidth) return;
    lastWidth = stage.clientWidth;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (zoom.value === "fit") void renderPage();
    }, 150);
  });
  observer.observe(stage);
  dispose = () => {
    closed = true;
    ++renderId;
    ++searchId;
    events.abort();
    observer.disconnect();
    window.clearTimeout(resizeTimer);
    rendering?.cancel();
    textLayer?.cancel();
    void task?.destroy().catch(() => {});
    dispose = undefined;
  };
  void load();
}

// ClientRouter runs page-load after both direct visits and client navigation.
document.addEventListener("astro:page-load", initReader);
document.addEventListener("astro:before-swap", () => dispose?.());
