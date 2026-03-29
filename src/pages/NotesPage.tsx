import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../app/routes";
import {
  flattenCampaignBook,
  parseCampaignBook,
  serializeCampaignBook,
  type CampaignBookChapter,
  type CampaignBookSessionLink,
} from "../domain/campaignBook";
import { useRpgData } from "../store/RpgDataContext";

function findActiveChapter(chapters: CampaignBookChapter[], pageIndex: number) {
  let activeChapter: CampaignBookChapter | null = null;

  for (const chapter of chapters) {
    if (chapter.pageIndex > pageIndex) break;
    activeChapter = chapter;
  }

  return activeChapter;
}

function formatSessionOption(iso: string, title: string) {
  const date = new Date(iso);
  const dateLabel = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateLabel} - ${timeLabel} - ${title}`;
}

function formatSessionMeta(iso: string) {
  const date = new Date(iso);
  const dateLabel = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateLabel} - ${timeLabel}`;
}

function toRoman(value: number) {
  if (value <= 0) return "0";

  const numerals: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let remaining = value;
  let result = "";

  for (const [amount, numeral] of numerals) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }

  return result;
}

type PageIndexItem = number | "ellipsis-left" | "ellipsis-right";

function buildPageIndex(totalPages: number, currentPageIndex: number): PageIndexItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const currentPage = currentPageIndex + 1;

  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis-right", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis-left", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages];
}

export function NotesPage() {
  const { data, actions } = useRpgData();
  const book = useMemo(() => parseCampaignBook(data.notes.campaign), [data.notes.campaign]);
  const pages = book.pages;
  const chapters = book.chapters;
  const sessionLinks = book.sessionLinks;
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [chapterDraft, setChapterDraft] = useState("");
  const currentPage = pages[currentPageIndex] ?? "";
  const currentChapterStart = useMemo(
    () => chapters.find((chapter) => chapter.pageIndex === currentPageIndex) ?? null,
    [chapters, currentPageIndex],
  );
  const activeChapter = useMemo(
    () => findActiveChapter(chapters, currentPageIndex),
    [chapters, currentPageIndex],
  );
  const currentSessionLink = useMemo(
    () => sessionLinks.find((link) => link.pageIndex === currentPageIndex) ?? null,
    [currentPageIndex, sessionLinks],
  );
  const currentLinkedSession = useMemo(
    () =>
      currentSessionLink
        ? data.sessions.find((session) => session.id === currentSessionLink.sessionId) ?? null
        : null,
    [currentSessionLink, data.sessions],
  );
  const sortedSessions = useMemo(
    () =>
      [...data.sessions].sort(
        (a, b) => new Date(a.scheduledAtIso).getTime() - new Date(b.scheduledAtIso).getTime(),
      ),
    [data.sessions],
  );
  const pageIndexItems = useMemo(
    () => buildPageIndex(pages.length, currentPageIndex),
    [currentPageIndex, pages.length],
  );
  const flattenedNotes = flattenCampaignBook(data.notes.campaign);
  const currentFolio = toRoman(currentPageIndex + 1);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [data.campaign.id]);

  useEffect(() => {
    if (currentPageIndex < pages.length) return;
    setCurrentPageIndex(Math.max(0, pages.length - 1));
  }, [currentPageIndex, pages.length]);

  useEffect(() => {
    setChapterDraft(currentChapterStart?.title ?? "");
  }, [currentChapterStart?.title, currentPageIndex]);

  function persistBook(
    nextPages: string[],
    nextChapters: CampaignBookChapter[] = chapters,
    nextSessionLinks: CampaignBookSessionLink[] = sessionLinks,
  ) {
    actions.setCampaignNotes(
      serializeCampaignBook({
        pages: nextPages,
        chapters: nextChapters,
        sessionLinks: nextSessionLinks,
      }),
    );
  }

  function updateCurrentPage(value: string) {
    const nextPages = [...pages];
    nextPages[currentPageIndex] = value;
    persistBook(nextPages);
  }

  function goToPage(index: number) {
    if (index < 0 || index >= pages.length || index === currentPageIndex) return;
    setCurrentPageIndex(index);
  }

  function goToNextPage() {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      return;
    }

    const nextPageIndex = pages.length;
    persistBook([...pages, ""]);
    setCurrentPageIndex(nextPageIndex);
  }

  function removeCurrentPage() {
    if (pages.length <= 1) return;

    const nextPages = pages.filter((_, index) => index !== currentPageIndex);
    const nextChapters = chapters.flatMap((chapter) => {
      if (chapter.pageIndex === currentPageIndex) return [];
      if (chapter.pageIndex > currentPageIndex) {
        return [{ ...chapter, pageIndex: chapter.pageIndex - 1 }];
      }
      return [chapter];
    });
    const nextSessionLinks = sessionLinks.flatMap((link) => {
      if (link.pageIndex === currentPageIndex) return [];
      if (link.pageIndex > currentPageIndex) {
        return [{ ...link, pageIndex: link.pageIndex - 1 }];
      }
      return [link];
    });

    persistBook(nextPages, nextChapters, nextSessionLinks);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  }

  function saveChapter() {
    const title = chapterDraft.trim();
    if (!title) return;

    const nextChapters = [
      ...chapters.filter((chapter) => chapter.pageIndex !== currentPageIndex),
      { pageIndex: currentPageIndex, title },
    ];

    persistBook(pages, nextChapters);
  }

  function removeChapter() {
    if (!currentChapterStart) return;
    persistBook(
      pages,
      chapters.filter((chapter) => chapter.pageIndex !== currentPageIndex),
    );
    setChapterDraft("");
  }

  function setLinkedSession(sessionId: string) {
    const nextSessionLinks =
      sessionId.trim().length === 0
        ? sessionLinks.filter((link) => link.pageIndex !== currentPageIndex)
        : [
            ...sessionLinks.filter((link) => link.pageIndex !== currentPageIndex),
            { pageIndex: currentPageIndex, sessionId },
          ];

    persistBook(pages, chapters, nextSessionLinks);
  }

  return (
    <div className="page campaign-book-page">
      <header className="page__header campaign-book-page__header">
        <div>
          <p className="ledger-kicker">CRONICAS DA CAMPANHA</p>
          <h1 className="page__title">{data.campaign.name || "Livro sem titulo"}</h1>
          <p className="page__subtitle">
            Cada campanha abre um livro proprio. Ao trocar de campanha, voce folheia outro tomo.
          </p>
        </div>
      </header>

      <section className="campaign-book" aria-label="Livro da campanha">
        <div className="campaign-book__frame">
          <div className="campaign-book__spine" aria-hidden="true" />
          <div className="campaign-book__spine-title" aria-hidden="true">
            {data.campaign.name || "Campanha sem nome"}
          </div>

          <div className="campaign-book__chrome">
            <div>
              <small className="campaign-book__eyebrow">Volume Atual</small>
              <strong>{data.campaign.name || "Campanha sem nome"}</strong>
            </div>
            <div className="campaign-book__status">
              <span>{pages.length} pagina{pages.length === 1 ? "" : "s"}</span>
              <span>{chapters.length} capitulo{chapters.length === 1 ? "" : "s"}</span>
              <span>{data.campaign.system.replace(/_/g, " ")}</span>
            </div>
          </div>

          <div className="campaign-book__chapter-toolbar">
            <div className="campaign-book__chapter-toolbar-copy">
              <div className="campaign-book__chapter-summary">
                <small className="campaign-book__eyebrow">Capitulo em andamento</small>
                <strong>{activeChapter ? activeChapter.title : "Sem capitulo registrado"}</strong>
                <span>
                  {currentChapterStart
                    ? `Esta pagina abre o capitulo ${String(currentPageIndex + 1).padStart(2, "0")}.`
                    : "Se quiser iniciar um novo arco aqui, insira o titulo abaixo."}
                </span>
              </div>
              <div className="campaign-book__chapter-marker">
                <small className="campaign-book__eyebrow">Marcador da pagina</small>
                <strong>
                  {currentChapterStart
                    ? `Inicio de "${currentChapterStart.title}"`
                    : "Continua o capitulo atual"}
                </strong>
              </div>
            </div>

            <div className="campaign-book__chapter-editor">
              <label className="campaign-book__chapter-field">
                <span>{currentChapterStart ? "Editar inicio do capitulo" : "Abrir novo capitulo nesta pagina"}</span>
                <input
                  type="text"
                  className="campaign-book__chapter-input"
                  value={chapterDraft}
                  onChange={(event) => setChapterDraft(event.target.value)}
                  placeholder="Ex.: O chamado da floresta rubra"
                  aria-label="Titulo do capitulo da pagina atual"
                />
              </label>

              <div className="campaign-book__chapter-actions">
                <button type="button" className="button" onClick={saveChapter} disabled={!chapterDraft.trim()}>
                  {currentChapterStart ? "Atualizar capitulo" : "Inserir capitulo"}
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={removeChapter}
                  disabled={!currentChapterStart}
                >
                  Remover inicio do capitulo
                </button>
              </div>
            </div>
          </div>

          <div className="campaign-book__sheet-stage">
            <article key={`${data.campaign.id}:${currentPageIndex}`} className="campaign-book__sheet">
              <div className="campaign-book__sheet-shadow" aria-hidden="true" />
              <div className="campaign-book__sheet-body">
                <div className="campaign-book__sheet-header">
                  <span>{activeChapter ? activeChapter.title : "Pagina sem capitulo"}</span>
                  <span>Folio {currentFolio}</span>
                </div>

                <textarea
                  className="campaign-book__editor"
                  value={currentPage}
                  onChange={(event) => updateCurrentPage(event.target.value)}
                  placeholder="Comece a escrever os acontecimentos, lendas, pressagios e memorias desta campanha..."
                  aria-label={`Pagina ${currentPageIndex + 1} do livro da campanha`}
                />

                <div className="campaign-book__folio">
                  <div className="campaign-book__folio-ornament" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>Folio {currentFolio}</span>
                </div>
              </div>
            </article>
          </div>

          <nav className="campaign-book__page-index" aria-label="Indice rapido de paginas">
            {pageIndexItems.map((item, index) =>
              typeof item === "number" ? (
                <button
                  key={`page-index-${item}`}
                  type="button"
                  className={
                    item === currentPageIndex + 1
                      ? "campaign-book__page-index-button campaign-book__page-index-button--active"
                      : "campaign-book__page-index-button"
                  }
                  onClick={() => goToPage(item - 1)}
                  aria-label={`Ir para pagina ${item}`}
                  aria-current={item === currentPageIndex + 1 ? "page" : undefined}
                >
                  {item}
                </button>
              ) : (
                <span
                  key={`${item}-${index}`}
                  className="campaign-book__page-index-ellipsis"
                  aria-hidden="true"
                >
                  ...
                </span>
              ),
            )}
          </nav>

          <div className="campaign-book__controls">
            <button
              type="button"
              className="button button--ghost"
              onClick={() => goToPage(currentPageIndex - 1)}
              disabled={currentPageIndex === 0}
            >
              Folhear para tras
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={goToNextPage}
            >
              Folhear para frente
            </button>
            <button
              type="button"
              className="button button--danger"
              onClick={removeCurrentPage}
              disabled={pages.length <= 1}
            >
              Remover pagina
            </button>
          </div>
        </div>

        <aside className="campaign-book__sidebar">
          <div className="campaign-book__sidebar-card">
            <small className="campaign-book__eyebrow">Sessao vinculada</small>
            <p className="campaign-book__sidebar-copy">
              Relacione esta pagina a uma sessao da campanha para saber de que encontro aquela anotacao nasceu.
            </p>

            {sortedSessions.length > 0 ? (
              <>
                <label className="campaign-book__chapter-field">
                  <span>Sessao da pagina atual</span>
                  <select
                    className="campaign-book__session-select"
                    value={currentSessionLink?.sessionId ?? ""}
                    onChange={(event) => setLinkedSession(event.target.value)}
                    aria-label="Sessao vinculada a pagina atual"
                  >
                    <option value="">Nenhuma sessao vinculada</option>
                    {sortedSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {formatSessionOption(session.scheduledAtIso, session.title)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="campaign-book__session-preview">
                  {currentLinkedSession ? (
                    <>
                      <strong>{currentLinkedSession.title}</strong>
                      <span>{formatSessionMeta(currentLinkedSession.scheduledAtIso)}</span>
                      {currentLinkedSession.address ? <p>{currentLinkedSession.address}</p> : null}
                    </>
                  ) : currentSessionLink ? (
                    <>
                      <strong>Sessao nao encontrada</strong>
                      <span>O vinculo foi mantido, mas essa sessao nao esta mais disponivel nesta campanha.</span>
                    </>
                  ) : (
                    <>
                      <strong>Pagina ainda sem sessao</strong>
                      <span>Escolha uma sessao quando esta pagina representar um encontro especifico.</span>
                    </>
                  )}
                </div>

                <Link className="button button--ghost campaign-book__session-link" to={ROUTES.sessions}>
                  Abrir Sessoes
                </Link>
              </>
            ) : (
              <>
                <p className="campaign-book__sidebar-empty">
                  Nenhuma sessao cadastrada nesta campanha ainda. Crie uma em Sessoes para poder vincular esta pagina.
                </p>
                <Link className="button button--ghost campaign-book__session-link" to={ROUTES.sessions}>
                  Ir para Sessoes
                </Link>
              </>
            )}
          </div>

          <div className="campaign-book__sidebar-card">
            <small className="campaign-book__eyebrow">Indice</small>
            <p className="campaign-book__sidebar-copy">
              O indice leva ao inicio de cada capitulo registrado, como um sumario de tomo.
            </p>
            {chapters.length > 0 ? (
              <div
                className="campaign-book__chapters"
                role="tablist"
                aria-label="Capitulos do livro"
              >
                {chapters.map((chapter) => (
                  <button
                    key={`${data.campaign.id}-chapter-${chapter.pageIndex}`}
                    type="button"
                    role="tab"
                    aria-selected={chapter.pageIndex === activeChapter?.pageIndex}
                    className={
                      chapter.pageIndex === activeChapter?.pageIndex
                        ? "campaign-book__chapter-link campaign-book__chapter-link--active"
                        : "campaign-book__chapter-link"
                    }
                    onClick={() => goToPage(chapter.pageIndex)}
                  >
                    <strong>{chapter.title}</strong>
                    <span>Comeca na pagina {chapter.pageIndex + 1}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="campaign-book__sidebar-empty">
                Nenhum capitulo marcado ainda. Quando voce inserir um no topo do livro, ele passa a aparecer neste indice.
              </p>
            )}
          </div>

          <div className="campaign-book__sidebar-card campaign-book__sidebar-card--summary">
            <small className="campaign-book__eyebrow">Resumo do tomo</small>
            <p>
              {flattenedNotes.trim()
                ? flattenedNotes.slice(0, 220)
                : "As paginas ainda estao em branco. Registre os primeiros eventos da jornada."}
            </p>
            <span>Salvamento automatico por campanha.</span>
          </div>
        </aside>
      </section>
    </div>
  );
}
