"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "genesis.factory.current.v1";
const HISTORY_KEY = "genesis.factory.history.v1";

const credentials = {
  clientId: "5b82d833-1784-4c56-9b26-2dc3495eb3f0",
  clientSecretMasked: "2e3b0577••••••••••••••••b3d1e6",
  accountId: "Rda3UUEcBSl6Oil"
};

const aiRuntime = {
  provider: "Gemini",
  model: "gemini-3.5-flash",
  project: "projects/396252550551"
};

const factoryModules = ["ebook", "design", "product", "salesPage", "facebookGroups", "scripts"];

const initialState = {
  structureId: "",
  factoryStatus: "idle",
  nicho: "",
  dor: "",
  titulo: "",
  subtitulo: "",
  publico: "",
  promessa: "",
  precoEstimado: 47,
  precoFinal: 47,
  problema: "",
  nomeProduto: "",
  descricao: "",
  bonus: [],
  garantia: "7 dias",
  palavrasChave: [],
  ebook: null,
  design: null,
  product: null,
  salesPage: null,
  facebookGroups: null,
  checkout: null
};

const niches = [
  "Emagrecimento",
  "Finanças",
  "Relacionamento",
  "Marketing Digital",
  "Produtividade",
  "Saúde Mental",
  "Culinária",
  "Fitness",
  "Educação",
  "Maternidade",
  "Dev. Pessoal",
  "Outro"
];

const tabs = [
  { id: "ebook", label: "E-book", icon: "▯" },
  { id: "design", label: "Design", icon: "◎" },
  { id: "product", label: "Produto + Kiwify", icon: "▣" },
  { id: "salesPage", label: "Página de Vendas", icon: "◻" },
  { id: "groups", label: "Grupos Facebook", icon: "♙" }
];

const syncChips = [
  ["ebook", "E-book"],
  ["design", "Design"],
  ["product", "Produto"],
  ["salesPage", "Landing"],
  ["groups", "Grupos"]
];

const priceRanges = {
  "R$27-R$47 (entrada)": 47,
  "R$47-R$97 (médio)": 97,
  "R$97-R$197 (premium)": 197,
  "R$197+ (alto valor)": 297
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(value) {
  const numeric = Number(value || 0);
  return `R$${numeric.toFixed(2).replace(".", ",")}`;
}

function makeId() {
  return `genesis-${Date.now().toString(36)}`;
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [String(value)];
}

function fallbackProductName(state) {
  if (state.nomeProduto) return state.nomeProduto;
  if (state.titulo) return state.titulo;
  return `Método ${state.nicho || "Digital"} Express`;
}

function fallbackPromise(state) {
  return state.promessa || `Transformar ${state.dor || "uma dor clara"} numa solução prática e vendável.`;
}

function buildFallbackEbook(state, text = "") {
  const title = state.titulo || fallbackProductName(state);
  const promise = fallbackPromise(state);
  const chapters = [
    "Diagnóstico da dor",
    "Os erros que atrasam o resultado",
    "O método passo a passo",
    "Plano de ação",
    "Próximo passo e oferta"
  ];

  return {
    cover: {
      title,
      subtitle: state.subtitulo || promise,
      audience: state.publico || state.dor || state.nicho
    },
    index: chapters,
    pages: chapters.map((chapter, index) => ({
      number: index + 1,
      title: chapter,
      body: text || `${chapter}: explica de forma prática como ${state.publico || "o público"} pode sair da dor "${state.dor || "principal"}" e avançar para ${promise.toLowerCase()}.`,
      takeaway: index === chapters.length - 1 ? "Clicar no checkout quando a oferta estiver pronta." : "Aplicar este passo antes de avançar."
    })),
    cta: `Conhece o ${title} e aplica o método completo.`,
    prompt: "Prompt interno gerado pelo Genesis para criar o e-book paginado."
  };
}

function buildFallbackDesign(state, text = "") {
  return {
    visualBrief: {
      cover: `Capa forte para ${fallbackProductName(state)}, com promessa clara e leitura mobile-first.`,
      palette: ["#5ED09E", "#080D15", "#F2F5F7", "#1B8F69"],
      typography: "Título forte sem serifa, corpo limpo e etiquetas curtas.",
      style: "Produto digital premium, escuro, tecnológico e direto.",
      layouts: ["Capa vertical 9:16", "Página de capítulo", "Checklist prático", "CTA final"]
    },
    canvaPrompt: text || `Cria um e-book vertical para ${fallbackProductName(state)} com capa premium, páginas limpas e CTA final.`,
    gammaPrompt: `Transforma o e-book ${fallbackProductName(state)} numa apresentação Gamma com capítulos curtos, exemplos e CTA.`,
    imagePrompt: `Capa de e-book premium sobre ${state.nicho}, fundo escuro, acento verde, composição editorial moderna.`,
    prompt: "Prompt interno do Genesis para briefing visual e assets."
  };
}

function buildFallbackProduct(state, text = "") {
  const name = fallbackProductName(state);
  const price = Number(state.precoFinal || state.precoEstimado || 47);
  const description = state.descricao || `E-book prático para ${fallbackPromise(state).toLowerCase()}`;

  return {
    offer: {
      name,
      description,
      promise: fallbackPromise(state),
      audience: state.publico || state.dor || state.nicho,
      problem: state.problema || state.dor
    },
    bonuses: asArray(state.bonus).length ? asArray(state.bonus) : ["Checklist de execução", "Roteiro de 3 dias", "Modelo de página de vendas"],
    guarantee: state.garantia || "7 dias",
    price,
    kiwifyPayload: {
      name,
      description,
      price,
      type: "ebook",
      currency: "BRL"
    },
    prompt: text || "Prompt interno do Genesis para oferta e checkout."
  };
}

function buildFallbackSalesPage(state, text = "") {
  const name = fallbackProductName(state);
  const promise = fallbackPromise(state);

  return {
    sections: {
      hero: {
        headline: promise,
        subheadline: `O ${name} entrega um caminho direto para resolver "${state.dor || "a dor principal"}".`,
        cta: `Quero o ${name}`
      },
      pain: state.dor || "O público sabe que precisa agir, mas não tem um caminho claro.",
      mechanism: "Método simples em passos curtos, com foco em ação e resultado rápido.",
      benefits: ["Clareza do problema", "Plano prático", "Oferta pronta para comprar"],
      proof: "Estrutura baseada em copy direta, promessa específica e checkout simples.",
      bonuses: buildFallbackProduct(state).bonuses,
      guarantee: state.garantia || "7 dias",
      faq: [
        { question: "Para quem é?", answer: `Para pessoas no nicho de ${state.nicho} que vivem esta dor.` },
        { question: "Como recebo?", answer: "Após a compra, o acesso é entregue pelo checkout." },
        { question: "Tem garantia?", answer: state.garantia || "Sim, garantia de 7 dias." }
      ],
      finalCta: `Começar com ${name}`
    },
    htmlDraft: text || `<main><section><h1>${promise}</h1><p>${name}</p></section></main>`,
    copyBlocks: [promise, state.descricao || "", `CTA: Quero o ${name}`].filter(Boolean),
    prompt: "Prompt interno do Genesis para landing page de alta conversão."
  };
}

function buildFallbackGroups(state, text = "") {
  const niche = state.nicho || "infoprodutos";
  const product = fallbackProductName(state);

  return {
    groups: [
      {
        name: `${niche} Brasil - comunidade ativa`,
        relevance: "Público alinhado ao tema e com dores recorrentes.",
        activity: "Verificar publicações das últimas 24-72 horas.",
        risk: "Médio",
        query: `${niche} grupo facebook`
      },
      {
        name: `${niche} para iniciantes`,
        relevance: "Bom para posts educativos e diagnóstico de dor.",
        activity: "Priorizar grupos com comentários reais.",
        risk: "Baixo",
        query: `${niche} iniciantes facebook`
      }
    ],
    searchQueries: [`${niche} grupo facebook`, `${niche} comunidade`, `${state.dor || niche} ajuda`],
    posts: [
      `Post de valor: 3 sinais de que ${state.dor || "esta dor"} está a travar o teu resultado.`,
      `Post diagnóstico: comenta "quero" se queres um checklist para resolver isto com clareza.`
    ],
    scripts: asArray(text).length ? asArray(text) : [`Quando alguém pedir ajuda, responder com valor e só depois mencionar o ${product}.`],
    prompt: "Prompt interno do Genesis para preparação orgânica em grupos."
  };
}

function normalizeModuleResult(module, result, current) {
  const data = result?.data || {};
  const text = result?.text || "";
  const next = {
    ...current,
    ...data,
    structureId: current.structureId || makeId()
  };

  if (module === "ebook") {
    const ebook = data.ebook || buildFallbackEbook({ ...next }, text);
    next.ebook = {
      ...ebook,
      pages: asArray(ebook.pages).map((page, index) => ({
        number: page.number || index + 1,
        title: page.title || `Página ${index + 1}`,
        body: page.body || String(page),
        takeaway: page.takeaway || ""
      }))
    };
    next.titulo = data.titulo || ebook.cover?.title || next.titulo || fallbackProductName(next);
    next.subtitulo = data.subtitulo || ebook.cover?.subtitle || next.subtitulo;
    next.factoryStatus = "review";
  }

  if (module === "design") {
    next.design = data.design || buildFallbackDesign(next, text);
  }

  if (module === "product") {
    const product = data.product || buildFallbackProduct(next, text);
    next.product = product;
    next.nomeProduto = data.nomeProduto || product.offer?.name || next.nomeProduto || fallbackProductName(next);
    next.descricao = data.descricao || product.offer?.description || next.descricao;
    next.promessa = data.promessa || product.offer?.promise || next.promessa;
    next.publico = data.publico || product.offer?.audience || next.publico;
    next.problema = data.problema || product.offer?.problem || next.problema;
    next.precoEstimado = Number(data.precoEstimado || product.price || next.precoEstimado || 47);
    next.precoFinal = Number(data.precoFinal || product.price || next.precoFinal || next.precoEstimado || 47);
    next.bonus = asArray(data.bonus).length ? asArray(data.bonus) : asArray(product.bonuses);
    next.garantia = data.garantia || product.guarantee || next.garantia;
    next.factoryStatus = next.checkout ? "published" : "checkout_ready";
  }

  if (module === "salesPage") {
    next.salesPage = data.salesPage || buildFallbackSalesPage(next, text);
  }

  if (module === "facebookGroups") {
    next.facebookGroups = data.facebookGroups || buildFallbackGroups(next, text);
  }

  if (module === "scripts") {
    const merged = data.facebookGroups || buildFallbackGroups(next, text);
    next.facebookGroups = {
      ...buildFallbackGroups(next),
      ...next.facebookGroups,
      ...merged,
      posts: asArray(merged.posts).length ? asArray(merged.posts) : asArray(next.facebookGroups?.posts),
      scripts: asArray(merged.scripts).length ? asArray(merged.scripts) : asArray(next.facebookGroups?.scripts)
    };
  }

  return next;
}

function ebookMarkdown(state) {
  const ebook = state.ebook || buildFallbackEbook(state);
  const pages = asArray(ebook.pages)
    .map((page) => `## ${page.number}. ${page.title}\n\n${page.body}\n\n**Ação:** ${page.takeaway || "Aplicar esta página."}`)
    .join("\n\n");

  return `# ${ebook.cover?.title || state.titulo}\n\n${ebook.cover?.subtitle || state.subtitulo || ""}\n\n**Público:** ${ebook.cover?.audience || state.publico || ""}\n\n## Índice\n${asArray(ebook.index).map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n${pages}\n\n## CTA\n${ebook.cta || ""}\n`;
}

function landingMarkdown(state) {
  const page = state.salesPage || buildFallbackSalesPage(state);
  const sections = page.sections || {};

  return `# ${sections.hero?.headline || fallbackPromise(state)}\n\n${sections.hero?.subheadline || ""}\n\n## Dor\n${sections.pain || ""}\n\n## Mecanismo\n${sections.mechanism || ""}\n\n## Benefícios\n${asArray(sections.benefits).map((item) => `- ${item}`).join("\n")}\n\n## Prova\n${sections.proof || ""}\n\n## Bónus\n${asArray(sections.bonuses).map((item) => `- ${item}`).join("\n")}\n\n## Garantia\n${sections.guarantee || state.garantia || ""}\n\n## FAQ\n${asArray(sections.faq).map((item) => `### ${item.question || "Pergunta"}\n${item.answer || ""}`).join("\n\n")}\n\n## CTA\n${sections.finalCta || sections.hero?.cta || ""}\n`;
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function rememberStructure(state, setHistory) {
  if (!state.structureId || !state.nicho) return;

  const item = {
    id: state.structureId,
    updatedAt: new Date().toISOString(),
    nicho: state.nicho,
    titulo: state.titulo || fallbackProductName(state),
    status: state.factoryStatus,
    precoFinal: state.precoFinal,
    checkoutUrl: state.checkout?.checkout_url || state.checkout?.link || ""
  };

  setHistory((current) => {
    const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 12);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  });
}

export default function Home() {
  const [page, setPage] = useState("ferramentas");
  const [tab, setTab] = useState("ebook");
  const [state, setState] = useState(initialState);
  const [format, setFormat] = useState("916");
  const [copyType, setCopyType] = useState("Landing Page");
  const [sequenceType, setSequenceType] = useState("Funil 3 dias");
  const [priceRange, setPriceRange] = useState("R$27-R$47 (entrada)");
  const [loading, setLoading] = useState("");
  const [notice, setNotice] = useState("");
  const [kiwifyModal, setKiwifyModal] = useState(false);
  const [kiwifyError, setKiwifyError] = useState("");
  const [ebookPage, setEbookPage] = useState(0);
  const [openPrompts, setOpenPrompts] = useState({});
  const [history, setHistory] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const ready = Boolean(state.nicho && state.dor);
  const synced = Boolean(state.ebook);
  const isGeneratingFactory = loading === "factory";

  const contextSummary = useMemo(() => {
    if (!state.nicho) return "🧠 Aguardando nicho para iniciar a fábrica...";
    if (!state.dor) return `🧠 Nicho "${state.nicho}" selecionado. Descreve a dor para ativar a fábrica.`;
    if (state.factoryStatus === "generating") return "⚙ Fábrica a gerar e-book, design, produto, landing e distribuição...";
    if (state.factoryStatus === "published") return "✓ Produto em ponto de venda com checkout Kiwify.";
    if (synced) return "✓ Fábrica sincronizada — e-book, produto, landing e grupos prontos para revisão.";
    return "✓ Contexto pronto — gera a fábrica semi-automática.";
  }, [state.nicho, state.dor, state.factoryStatus, synced]);

  const kiwifyPayload = useMemo(() => {
    const productPayload = state.product?.kiwifyPayload || {};
    return {
      name: state.nomeProduto || productPayload.name || state.titulo || "Produto Genesis",
      description: state.descricao || productPayload.description || state.promessa || state.dor,
      price: Number(state.precoFinal || productPayload.price || state.precoEstimado || 47),
      type: "ebook",
      currency: "BRL"
    };
  }, [state]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (saved) setState((current) => ({ ...current, ...JSON.parse(saved) }));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  function setField(field, value) {
    setState((current) => {
      const next = { ...current, [field]: value };
      if ((field === "nicho" || field === "dor") && next.nicho && next.dor && next.factoryStatus === "idle") {
        next.factoryStatus = "ready";
      }
      return next;
    });
  }

  function resetAll() {
    const next = { ...initialState, structureId: makeId() };
    setState(next);
    setTab("ebook");
    setPage("ferramentas");
    setKiwifyError("");
    setNotice("");
    setKiwifyModal(false);
    setEbookPage(0);
  }

  async function requestAi(module, context) {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module,
        context,
        options: {
          format,
          copyType,
          sequenceType,
          priceRange,
          factoryMode: true
        }
      })
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "A IA não conseguiu gerar este módulo.");
    }

    return result;
  }

  async function generate(module) {
    setLoading(module);
    setNotice("");
    setKiwifyError("");

    try {
      const result = await requestAi(module, state);
      const next = normalizeModuleResult(module, result, state);
      setState(next);
      if (module === "ebook") {
        setEbookPage(0);
        setTab("ebook");
      }
      if (module === "product") setTab("product");
      rememberStructure(next, setHistory);
      setNotice("Artefato gerado e sincronizado com sucesso.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setLoading("");
    }
  }

  async function generateFactory() {
    setLoading("factory");
    setNotice("");
    setKiwifyError("");

    let draft = {
      ...state,
      structureId: state.structureId || makeId(),
      factoryStatus: "generating"
    };
    setState(draft);

    try {
      for (const module of factoryModules) {
        setNotice(`A gerar ${module === "salesPage" ? "landing" : module}...`);
        const result = await requestAi(module, draft);
        draft = normalizeModuleResult(module, result, draft);
        draft.factoryStatus = module === "scripts" ? "checkout_ready" : "generating";
        setState(draft);
        if (module === "ebook") setEbookPage(0);
      }

      rememberStructure(draft, setHistory);
      setTab("ebook");
      setNotice("Fábrica completa: e-book, design, produto, landing e grupos prontos para revisão.");
    } catch (error) {
      setState((current) => ({ ...current, factoryStatus: current.ebook ? "review" : "ready" }));
      setNotice(error instanceof Error ? error.message : "Erro inesperado na fábrica.");
    } finally {
      setLoading("");
    }
  }

  function applyPriceRange(value) {
    setPriceRange(value);
    const nextPrice = priceRanges[value] || state.precoFinal || 47;
    setState((current) => ({
      ...current,
      precoEstimado: nextPrice,
      precoFinal: current.precoFinal || nextPrice
    }));
  }

  async function confirmKiwifyCreation() {
    setLoading("kiwify");
    setKiwifyError("");

    try {
      const response = await fetch("/api/kiwify/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kiwifyPayload)
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "A Kiwify não devolveu sucesso.");
      }

      const next = {
        ...state,
        checkout: result,
        factoryStatus: "published"
      };
      setState(next);
      rememberStructure(next, setHistory);
      setKiwifyModal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido na Kiwify.";
      setKiwifyError(`${message} Verifica token, credenciais, permissões da conta e endpoint da Kiwify.`);
    } finally {
      setLoading("");
    }
  }

  function togglePrompt(id) {
    setOpenPrompts((current) => ({ ...current, [id]: !current[id] }));
  }

  function copyText(text) {
    navigator.clipboard.writeText(text);
  }

  function openHistoryItem(item) {
    if (item.id !== state.structureId) return;
    setPage("ferramentas");
    setTab("ebook");
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="mark">↯</div>
          <div className="brandName">
            <strong>Genesis</strong>
            <span>v3</span>
          </div>
        </div>

        <button className="newButton" type="button" onClick={resetAll}>+ Nova Estrutura</button>

        <nav className="sideNav">
          <span>Geral</span>
          <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>▦ Dashboard</button>
          <button className={page === "ferramentas" ? "active pulse" : ""} onClick={() => setPage("ferramentas")}>⌘ Ferramentas</button>
          <span>Conta</span>
          <button className={page === "config" ? "active" : ""} onClick={() => setPage("config")}>⚙ Configurações</button>
          <button className={page === "perfil" ? "active" : ""} onClick={() => setPage("perfil")}>♙ Perfil</button>
        </nav>

        <footer>Genesis Platform © 2026</footer>
      </aside>

      <section className="main">
        <div className={cx("brainBar", synced && "synced", ready && !synced && "thinking")}>
          <span>{contextSummary}</span>
          <div className="brainChips">
            {syncChips.map(([id, label]) => (
              <span key={id} className={cx((id === "ebook" ? state.ebook : id === "groups" ? state.facebookGroups : state[id]) && "active")}>{label}</span>
            ))}
          </div>
        </div>

        {page === "ferramentas" && (
          <>
            <header className="topbar">
              <div>
                <h1>Fábrica Genesis</h1>
                <p>Seleciona nicho e dor; o sistema prepara e-book, oferta, landing, checkout e distribuição orgânica.</p>
              </div>
              <span className={cx("status", state.factoryStatus === "published" && "published")}>
                {state.factoryStatus === "published" ? "● Produto à venda" : "● IA Activa"}
              </span>
            </header>

            <div className="tabs">
              {tabs.map((item) => (
                <button key={item.id} className={cx(tab === item.id && "selected", synced && item.id !== "ebook" && "ready")} onClick={() => setTab(item.id)}>
                  <span>{item.icon}</span>
                  {item.label}
                  {item.id !== "ebook" && <i />}
                </button>
              ))}
            </div>

            {notice && (
              <div className={cx("notice", /erro|falhou|ausente|invalido|openai|gemini|anthropic/i.test(notice) ? "errorNotice" : "")}>
                {notice}
              </div>
            )}

            <div className="content">
              {tab === "ebook" && (
                <section className="tool">
                  <div className="toolHero">
                    <div className="toolIcon">▯</div>
                    <h2>E-book paginado</h2>
                    <p>O resultado principal é o e-book pronto para conferência, com prompts escondidos.</p>
                  </div>

                  <div className="sectionLabel">Nicho <small>(define o contexto de toda a fábrica)</small></div>
                  <div className="nicheGrid">
                    {niches.map((item) => (
                      <button key={item} className={state.nicho === item ? "selected" : ""} onClick={() => setField("nicho", item)}>{item}</button>
                    ))}
                  </div>

                  <label htmlFor="audience-pain">Dor / Problema do público-alvo</label>
                  <textarea id="audience-pain" value={state.dor} onChange={(event) => setField("dor", event.target.value)} placeholder="Ex: Criadores iniciantes querem vender um infoproduto, mas não sabem transformar conhecimento em oferta..." />

                  <div className="factoryActions">
                    <button className="actionButton" disabled={!ready || isGeneratingFactory} onClick={generateFactory}>
                      {isGeneratingFactory ? "⚙ A fábrica está a gerar tudo..." : "↯ Gerar Fábrica Completa"}
                    </button>
                    <button className="secondaryAction" disabled={!ready || loading === "ebook"} onClick={() => generate("ebook")}>
                      {loading === "ebook" ? "A gerar e-book..." : "Gerar só E-book"}
                    </button>
                  </div>

                  {state.ebook && (
                    <EbookReader
                      ebook={state.ebook}
                      pageIndex={ebookPage}
                      setPageIndex={setEbookPage}
                      onExport={() => downloadText(`${fallbackProductName(state)}.md`, ebookMarkdown(state))}
                      onCopy={() => copyText(ebookMarkdown(state))}
                    />
                  )}

                  <PromptPanel id="ebook" label="Ver prompt do E-book" openPrompts={openPrompts} togglePrompt={togglePrompt} prompt={state.ebook?.prompt} />
                </section>
              )}

              {tab === "design" && (
                <section className="tool">
                  <ContextBanner state={state} synced={synced} />
                  <div className="toolHero">
                    <div className="toolIcon">◎</div>
                    <h2>Design do produto</h2>
                    <p>Briefing visual primeiro; prompts ficam disponíveis apenas quando precisares.</p>
                  </div>

                  <div className="sectionLabel">Formato do documento</div>
                  <div className="formatGrid">
                    <button className={format === "916" ? "selected" : ""} onClick={() => setFormat("916")}><b>📱</b><strong>Vertical</strong><span>9×16 · Mobile</span></button>
                    <button className={format === "169" ? "selected" : ""} onClick={() => setFormat("169")}><b>🖥️</b><strong>Horizontal</strong><span>16×9 · Desktop</span></button>
                    <button className={format === "auto" ? "selected" : ""} onClick={() => setFormat("auto")}><b>✨</b><strong>Auto-detectar</strong><span>IA escolhe o ideal</span></button>
                  </div>

                  <label htmlFor="ebook-title">Tema / Título do E-book</label>
                  <input id="ebook-title" value={state.titulo} onChange={(event) => setField("titulo", event.target.value)} placeholder="Preenchido automaticamente pelo E-book..." />

                  <button className="actionButton" disabled={!state.nicho || loading === "design"} onClick={() => generate("design")}>
                    {loading === "design" ? "A gerar design..." : "↯ Gerar Briefing de Design"}
                  </button>

                  {state.design && <DesignBrief design={state.design} />}
                  <PromptPanel id="design" label="Ver prompts de design" openPrompts={openPrompts} togglePrompt={togglePrompt} prompt={[state.design?.canvaPrompt, state.design?.gammaPrompt, state.design?.imagePrompt, state.design?.prompt].filter(Boolean).join("\n\n---\n\n")} />
                </section>
              )}

              {tab === "product" && (
                <section className="tool">
                  <ContextBanner state={state} synced={synced} />
                  <div className="toolHero">
                    <div className="toolIcon">▣</div>
                    <h2>Produto + Kiwify</h2>
                    <p>Oferta pronta para venda, com preço final editável e checkout criado só após confirmação.</p>
                  </div>

                  <div className="twoCols">
                    <div>
                      <label htmlFor="product-publico">Público-alvo</label>
                      <input id="product-publico" value={state.publico} onChange={(event) => setField("publico", event.target.value)} placeholder="Sincronizado automaticamente..." />
                    </div>
                    <div>
                      <label htmlFor="product-price-range">Faixa de preço</label>
                      <select id="product-price-range" value={priceRange} onChange={(event) => applyPriceRange(event.target.value)}>
                        {Object.keys(priceRanges).map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                  </div>

                  <label htmlFor="product-problema">Problema que o produto resolve</label>
                  <textarea id="product-problema" value={state.problema} onChange={(event) => setField("problema", event.target.value)} placeholder="Sincronizado automaticamente..." />

                  <button className="actionButton" disabled={!state.nicho || loading === "product"} onClick={() => generate("product")}>
                    {loading === "product" ? "A gerar produto..." : "↯ Gerar Produto Pronto para Venda"}
                  </button>

                  {state.product && <ProductOffer state={state} setField={setField} />}

                  {(state.nomeProduto || state.product) && (
                    <div className="kiwifyPanel">
                      <div>
                        <h3>{state.checkout ? "Produto em ponto de venda" : "Publicar na Kiwify"}</h3>
                        <p>Confere nome, descrição e valor final antes de criar o checkout real.</p>
                      </div>
                      <label htmlFor="kiwify-product-name">Nome do produto</label>
                      <input id="kiwify-product-name" value={state.nomeProduto} onChange={(event) => setField("nomeProduto", event.target.value)} placeholder="Nome comercial do produto" />
                      <div className="twoCols">
                        <div>
                          <label htmlFor="kiwify-estimated-price">Preço estimado</label>
                          <input id="kiwify-estimated-price" value={money(state.precoEstimado)} readOnly />
                        </div>
                        <div>
                          <label htmlFor="kiwify-final-price">Valor final de venda</label>
                          <input id="kiwify-final-price" type="number" min="1" value={state.precoFinal} onChange={(event) => setField("precoFinal", event.target.value)} />
                        </div>
                      </div>
                      <label htmlFor="kiwify-description">Descrição curta</label>
                      <textarea id="kiwify-description" value={state.descricao} onChange={(event) => setField("descricao", event.target.value)} placeholder="Descrição que será enviada para a Kiwify..." />
                      <button className="actionButton" onClick={() => setKiwifyModal(true)}>✓ Testar Payload e Preparar Checkout</button>
                    </div>
                  )}

                  {state.checkout && (
                    <div className="success">
                      <strong>Produto criado com sucesso.</strong>
                      <a href={state.checkout.checkout_url || state.checkout.link} target="_blank" rel="noreferrer">{state.checkout.checkout_url || state.checkout.link}</a>
                      <small>ID: {state.checkout.product_id || "sem id retornado"}</small>
                    </div>
                  )}

                  {kiwifyError && <div className="error"><strong>Falha na Kiwify</strong><span>{kiwifyError}</span></div>}
                  <PromptPanel id="product" label="Ver prompt do produto" openPrompts={openPrompts} togglePrompt={togglePrompt} prompt={state.product?.prompt} />
                </section>
              )}

              {tab === "salesPage" && (
                <section className="tool">
                  <ContextBanner state={state} synced={synced} />
                  <div className="toolHero">
                    <div className="toolIcon">◻</div>
                    <h2>Landing page de vendas</h2>
                    <p>Preview visual editável, com copy por blocos e CTA para o checkout.</p>
                  </div>

                  <div className="sectionLabel">Tipo de copy</div>
                  <div className="tagRow">
                    {["Landing Page", "VSL · Carta de Vendas", "Bio Instagram", "E-mail de Vendas"].map((item) => (
                      <button key={item} className={copyType === item ? "selected" : ""} onClick={() => setCopyType(item)}>{item}</button>
                    ))}
                  </div>

                  <div className="twoCols">
                    <div>
                      <label htmlFor="sales-product-name">Nome do produto</label>
                      <input id="sales-product-name" value={state.nomeProduto} onChange={(event) => setField("nomeProduto", event.target.value)} placeholder="Sincronizado automaticamente..." />
                    </div>
                    <div>
                      <label htmlFor="sales-price">Preço</label>
                      <input id="sales-price" type="number" value={state.precoFinal} onChange={(event) => setField("precoFinal", event.target.value)} placeholder="Ex: R$47" />
                    </div>
                  </div>

                  <label htmlFor="sales-promise">Promessa principal</label>
                  <textarea id="sales-promise" value={state.promessa} onChange={(event) => setField("promessa", event.target.value)} placeholder="Sincronizado automaticamente..." />

                  <button className="actionButton" disabled={!state.nicho || loading === "salesPage"} onClick={() => generate("salesPage")}>
                    {loading === "salesPage" ? "A gerar landing..." : "↯ Gerar Landing Page com IA"}
                  </button>

                  {state.salesPage && (
                    <>
                      <LandingPreview state={state} />
                      <div className="exportRow">
                        <button type="button" onClick={() => copyText(landingMarkdown(state))}>Copiar landing</button>
                        <button type="button" onClick={() => downloadText(`${fallbackProductName(state)}-landing.md`, landingMarkdown(state))}>Exportar Markdown</button>
                      </div>
                    </>
                  )}
                  <PromptPanel id="salesPage" label="Ver copy/prompt" openPrompts={openPrompts} togglePrompt={togglePrompt} prompt={[...(state.salesPage?.copyBlocks || []), state.salesPage?.prompt].filter(Boolean).join("\n\n---\n\n")} />
                </section>
              )}

              {tab === "groups" && (
                <section className="tool">
                  <ContextBanner state={state} synced={synced} />
                  <div className="toolHero">
                    <div className="toolIcon">♙</div>
                    <h2>Grupos do Facebook</h2>
                    <p>Preparação orgânica: grupos plausíveis, queries e scripts. Sem publicação automática nesta fase.</p>
                  </div>

                  <div className="sectionLabel">Passo 1 — Encontrar grupos relevantes</div>
                  <button className="actionButton" disabled={!state.nicho || loading === "facebookGroups"} onClick={() => generate("facebookGroups")}>
                    {loading === "facebookGroups" ? "A preparar grupos..." : "⌕ Preparar Grupos + Queries"}
                  </button>
                  {state.facebookGroups && <FacebookPlan groups={state.facebookGroups} />}

                  <div className="divider" />
                  <div className="sectionLabel">Passo 2 — Gerar scripts</div>
                  <div className="tagRow">
                    {["Funil 3 dias", "Lançamento 7 dias", "Oferta directa", "Reactivação"].map((item) => (
                      <button key={item} className={sequenceType === item ? "selected" : ""} onClick={() => setSequenceType(item)}>{item}</button>
                    ))}
                  </div>

                  <label>Produto / Oferta</label>
                  <input value={`${state.nomeProduto || state.titulo}${state.precoFinal ? ` — ${money(state.precoFinal)}` : ""}`} readOnly placeholder="Sincronizado automaticamente..." />
                  <label>Público dos grupos</label>
                  <textarea value={state.publico} onChange={(event) => setField("publico", event.target.value)} placeholder="Sincronizado automaticamente..." />

                  <button className="actionButton" disabled={!state.nicho || loading === "scripts"} onClick={() => generate("scripts")}>
                    {loading === "scripts" ? "A gerar scripts..." : "↯ Gerar Scripts para Publicação Assistida"}
                  </button>
                  <PromptPanel id="facebookGroups" label="Ver prompt dos grupos" openPrompts={openPrompts} togglePrompt={togglePrompt} prompt={state.facebookGroups?.prompt} />
                </section>
              )}
            </div>
          </>
        )}

        {page === "config" && (
          <section className="content">
            <div className="tool configTool">
              <h1>Configurações</h1>
              <p>Credenciais Kiwify visíveis para auditoria, com secret mascarado por segurança.</p>
              <label>Client ID<input readOnly value={credentials.clientId} /></label>
              <label>Client Secret<input readOnly value={credentials.clientSecretMasked} /></label>
              <label>Account ID<input readOnly value={credentials.accountId} /></label>
              <div className="warning">Nota técnica: em produção, credenciais ficam no backend/env; frontend nunca chama Kiwify diretamente.</div>
              <h2>IA</h2>
              <label>Provider<input readOnly value={aiRuntime.provider} /></label>
              <label>Modelo<input readOnly value={aiRuntime.model} /></label>
              <label>Project<input readOnly value={aiRuntime.project} /></label>
              <div className="warning">Nota técnica: chaves Gemini, OpenAI e Claude ficam apenas no backend/env; o frontend nunca recebe segredos de IA.</div>
            </div>
          </section>
        )}

        {page === "dashboard" && <Dashboard history={history} currentId={state.structureId} onOpen={openHistoryItem} />}
        {page === "perfil" && <Placeholder title="Perfil" text="Área de conta e equipa em preparação." />}
      </section>

      {kiwifyModal && (
        <div className="modalOverlay" onClick={(event) => event.target === event.currentTarget && setKiwifyModal(false)}>
          <div className="modal">
            <h3>Confirmar criação na Kiwify</h3>
            <p>Este é o payload que será enviado server-side. A criação real só acontece ao confirmar.</p>
            <pre>{JSON.stringify(kiwifyPayload, null, 2)}</pre>
            <div className="modalActions">
              <button type="button" onClick={() => setKiwifyModal(false)}>Cancelar</button>
              <button type="button" className="confirm" disabled={loading === "kiwify"} onClick={confirmKiwifyCreation}>
                {loading === "kiwify" ? "A criar..." : "Confirmar criação na Kiwify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ContextBanner({ state, synced }) {
  if (!state.nicho) {
    return <div className="ctxBanner">🧠 Aguardando seleção de nicho no E-book...</div>;
  }

  return (
    <div className={cx("ctxBanner", synced && "synced")}>
      <strong>{state.nicho}</strong>
      {state.dor && <span>{state.dor}</span>}
      <em>{synced ? "✓ Sincronizado pela fábrica" : "Aguardando geração"}</em>
    </div>
  );
}

function EbookReader({ ebook, pageIndex, setPageIndex, onExport, onCopy }) {
  const pages = asArray(ebook.pages);
  const current = pages[pageIndex] || pages[0];

  return (
    <div className="ebookReader">
      <div className="ebookCover">
        <span>E-book pronto</span>
        <h3>{ebook.cover?.title}</h3>
        <p>{ebook.cover?.subtitle}</p>
        <small>{ebook.cover?.audience}</small>
      </div>
      <div className="ebookPage">
        <div className="readerHeader">
          <strong>Página {current?.number || 1} de {pages.length}</strong>
          <div>
            <button type="button" onClick={onCopy}>Copiar</button>
            <button type="button" onClick={onExport}>Exportar</button>
          </div>
        </div>
        <h3>{current?.title}</h3>
        <p>{current?.body}</p>
        {current?.takeaway && <div className="takeaway">Ação: {current.takeaway}</div>}
        <div className="readerNav">
          <button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}>← Página anterior</button>
          <button type="button" disabled={pageIndex >= pages.length - 1} onClick={() => setPageIndex(Math.min(pages.length - 1, pageIndex + 1))}>Próxima página →</button>
        </div>
      </div>
      <div className="ebookIndex">
        <strong>Índice</strong>
        {asArray(ebook.index).map((item, index) => (
          <button type="button" key={`${item}-${index}`} className={pageIndex === index ? "selected" : ""} onClick={() => setPageIndex(Math.min(index, pages.length - 1))}>{index + 1}. {item}</button>
        ))}
      </div>
    </div>
  );
}

function PromptPanel({ id, label, openPrompts, togglePrompt, prompt }) {
  if (!prompt) return null;

  return (
    <div className="promptPanel">
      <button type="button" onClick={() => togglePrompt(id)}>{openPrompts[id] ? "Ocultar prompt" : label}</button>
      {openPrompts[id] && <pre>{prompt}</pre>}
    </div>
  );
}

function DesignBrief({ design }) {
  const brief = design.visualBrief || {};

  return (
    <div className="briefGrid">
      <article>
        <span>Capa</span>
        <strong>{brief.cover}</strong>
      </article>
      <article>
        <span>Estilo</span>
        <strong>{brief.style}</strong>
      </article>
      <article>
        <span>Tipografia</span>
        <strong>{brief.typography}</strong>
      </article>
      <article>
        <span>Layouts</span>
        <ul>{asArray(brief.layouts).map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
      <article className="paletteCard">
        <span>Paleta</span>
        <div>{asArray(brief.palette).map((color) => <i key={color} style={{ background: color }} title={color} />)}</div>
      </article>
    </div>
  );
}

function ProductOffer({ state, setField }) {
  const product = state.product || buildFallbackProduct(state);

  return (
    <div className="offerPanel">
      <div>
        <span>Oferta</span>
        <h3>{product.offer?.name || state.nomeProduto}</h3>
        <p>{product.offer?.description || state.descricao}</p>
      </div>
      <div className="offerMeta">
        <strong>{money(state.precoFinal || product.price)}</strong>
        <em>{product.guarantee || state.garantia}</em>
      </div>
      <div className="listBlock">
        <strong>Bónus</strong>
        {asArray(product.bonuses).map((item) => <span key={item}>{item}</span>)}
      </div>
      <label htmlFor="product-bonuses">Editar bónus</label>
      <textarea id="product-bonuses" value={asArray(state.bonus).join("\n")} onChange={(event) => setField("bonus", event.target.value.split("\n").filter(Boolean))} />
    </div>
  );
}

function LandingPreview({ state }) {
  const salesPage = state.salesPage || buildFallbackSalesPage(state);
  const sections = salesPage.sections || {};
  const checkoutUrl = state.checkout?.checkout_url || state.checkout?.link || "#";

  return (
    <div className="landingPreview">
      <section className="landingHero">
        <h3>{sections.hero?.headline}</h3>
        <p>{sections.hero?.subheadline}</p>
        <a href={checkoutUrl}>{sections.hero?.cta || "Quero começar"}</a>
      </section>
      <section>
        <h4>Dor</h4>
        <p>{sections.pain}</p>
      </section>
      <section>
        <h4>Mecanismo único</h4>
        <p>{sections.mechanism}</p>
      </section>
      <section>
        <h4>Benefícios</h4>
        <div className="benefitGrid">{asArray(sections.benefits).map((item) => <span key={item}>{item}</span>)}</div>
      </section>
      <section>
        <h4>Prova e garantia</h4>
        <p>{sections.proof}</p>
        <strong>{sections.guarantee}</strong>
      </section>
      <section>
        <h4>FAQ</h4>
        {asArray(sections.faq).map((item) => (
          <details key={item.question} open>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </div>
  );
}

function FacebookPlan({ groups }) {
  return (
    <div className="facebookPlan">
      <div className="queryRow">
        {asArray(groups.searchQueries).map((query) => (
          <a key={query} href={`https://www.facebook.com/search/groups/?q=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer">{query}</a>
        ))}
      </div>
      <div className="groupGrid">
        {asArray(groups.groups).map((group) => (
          <article key={group.name || group.query}>
            <strong>{group.name}</strong>
            <p>{group.relevance}</p>
            <span>Atividade: {group.activity}</span>
            <em>Risco: {group.risk}</em>
          </article>
        ))}
      </div>
      <div className="scriptColumns">
        <div>
          <h3>Posts orgânicos</h3>
          {asArray(groups.posts).map((post) => <p key={post}>{post}</p>)}
        </div>
        <div>
          <h3>Scripts assistidos</h3>
          {asArray(groups.scripts).map((script) => <p key={script}>{script}</p>)}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ history, currentId, onOpen }) {
  return (
    <section className="content">
      <div className="tool">
        <h1>Dashboard</h1>
        <p>Histórico local das estruturas geradas nesta máquina.</p>
        <div className="historyList">
          {history.length === 0 && <div className="warning">Ainda não há estruturas salvas. Gera uma fábrica completa para popular o histórico.</div>}
          {history.map((item) => (
            <button type="button" key={item.id} className={cx(item.id === currentId && "active")} onClick={() => onOpen(item)}>
              <strong>{item.titulo}</strong>
              <span>{item.nicho} · {item.status}</span>
              <small>{item.checkoutUrl || money(item.precoFinal)}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Placeholder({ title, text }) {
  return (
    <section className="content">
      <div className="tool">
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}
