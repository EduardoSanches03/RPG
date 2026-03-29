const CAMPAIGN_BOOK_PREFIX = "__CAMPAIGN_BOOK_V1__:";

export type CampaignBookChapter = {
  pageIndex: number;
  title: string;
};

export type CampaignBookSessionLink = {
  pageIndex: number;
  sessionId: string;
};

export type CampaignBookPayload = {
  pages: string[];
  chapters: CampaignBookChapter[];
  sessionLinks: CampaignBookSessionLink[];
};

function normalizePages(input: unknown): string[] {
  if (!Array.isArray(input)) return [""];
  const pages = input.map((page) => (typeof page === "string" ? page : ""));
  return pages.length > 0 ? pages : [""];
}

function normalizeChapters(input: unknown, pagesLength: number): CampaignBookChapter[] {
  if (!Array.isArray(input)) return [];

  const chaptersByPage = new Map<number, string>();

  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;

    const title =
      "title" in entry && typeof entry.title === "string" ? entry.title.trim() : "";
    const pageIndex =
      "pageIndex" in entry && typeof entry.pageIndex === "number"
        ? Math.trunc(entry.pageIndex)
        : Number.NaN;

    if (!title) continue;
    if (!Number.isInteger(pageIndex)) continue;
    if (pageIndex < 0 || pageIndex >= pagesLength) continue;

    chaptersByPage.set(pageIndex, title);
  }

  return [...chaptersByPage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pageIndex, title]) => ({ pageIndex, title }));
}

function normalizeSessionLinks(input: unknown, pagesLength: number): CampaignBookSessionLink[] {
  if (!Array.isArray(input)) return [];

  const sessionLinkByPage = new Map<number, string>();

  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;

    const sessionId =
      "sessionId" in entry && typeof entry.sessionId === "string" ? entry.sessionId.trim() : "";
    const pageIndex =
      "pageIndex" in entry && typeof entry.pageIndex === "number"
        ? Math.trunc(entry.pageIndex)
        : Number.NaN;

    if (!sessionId) continue;
    if (!Number.isInteger(pageIndex)) continue;
    if (pageIndex < 0 || pageIndex >= pagesLength) continue;

    sessionLinkByPage.set(pageIndex, sessionId);
  }

  return [...sessionLinkByPage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pageIndex, sessionId]) => ({ pageIndex, sessionId }));
}

export function parseCampaignBook(raw: string | undefined): CampaignBookPayload {
  if (!raw) return { pages: [""], chapters: [], sessionLinks: [] };

  const trimmed = raw.trim();
  if (!trimmed) return { pages: [""], chapters: [], sessionLinks: [] };

  if (!trimmed.startsWith(CAMPAIGN_BOOK_PREFIX)) {
    return { pages: [raw], chapters: [], sessionLinks: [] };
  }

  try {
    const parsed = JSON.parse(trimmed.slice(CAMPAIGN_BOOK_PREFIX.length)) as {
      pages?: unknown;
      chapters?: unknown;
      sessionLinks?: unknown;
    };
    const pages = normalizePages(parsed.pages);
    return {
      pages,
      chapters: normalizeChapters(parsed.chapters, pages.length),
      sessionLinks: normalizeSessionLinks(parsed.sessionLinks, pages.length),
    };
  } catch {
    return { pages: [raw], chapters: [], sessionLinks: [] };
  }
}

export function serializeCampaignBook(input: CampaignBookPayload | string[]) {
  const normalizedPages = normalizePages(Array.isArray(input) ? input : input.pages);
  const normalizedChapters = normalizeChapters(
    Array.isArray(input) ? [] : input.chapters,
    normalizedPages.length,
  );
  const normalizedSessionLinks = normalizeSessionLinks(
    Array.isArray(input) ? [] : input.sessionLinks,
    normalizedPages.length,
  );

  if (
    normalizedPages.length === 1 &&
    normalizedChapters.length === 0 &&
    normalizedSessionLinks.length === 0
  ) {
    return normalizedPages[0];
  }

  const payload: {
    pages: string[];
    chapters?: CampaignBookChapter[];
    sessionLinks?: CampaignBookSessionLink[];
  } = { pages: normalizedPages };

  if (normalizedChapters.length > 0) {
    payload.chapters = normalizedChapters;
  }

  if (normalizedSessionLinks.length > 0) {
    payload.sessionLinks = normalizedSessionLinks;
  }

  return `${CAMPAIGN_BOOK_PREFIX}${JSON.stringify(payload)}`;
}

export function flattenCampaignBook(raw: string | undefined) {
  return parseCampaignBook(raw)
    .pages
    .map((page) => page.trim())
    .filter(Boolean)
    .join("\n\n");
}
