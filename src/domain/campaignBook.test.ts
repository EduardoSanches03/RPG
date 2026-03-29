import { flattenCampaignBook, parseCampaignBook, serializeCampaignBook } from "./campaignBook";

describe("campaignBook", () => {
  it("deve manter compatibilidade com anotacoes antigas em texto puro", () => {
    expect(parseCampaignBook("Cronica inicial")).toEqual({
      pages: ["Cronica inicial"],
      chapters: [],
      sessionLinks: [],
    });
  });

  it("deve serializar e ler capitulos opcionais sem perder as paginas", () => {
    const serialized = serializeCampaignBook({
      pages: ["Pagina 1", "Pagina 2"],
      chapters: [{ pageIndex: 1, title: "A coroacao do inverno" }],
      sessionLinks: [{ pageIndex: 0, sessionId: "sessao-1" }],
    });

    expect(parseCampaignBook(serialized)).toEqual({
      pages: ["Pagina 1", "Pagina 2"],
      chapters: [{ pageIndex: 1, title: "A coroacao do inverno" }],
      sessionLinks: [{ pageIndex: 0, sessionId: "sessao-1" }],
    });
    expect(flattenCampaignBook(serialized)).toBe("Pagina 1\n\nPagina 2");
  });
});
