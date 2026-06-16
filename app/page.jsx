"use client";

import { useMemo, useState } from "react";

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

const initialState = {
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
  ebookText: "",
  designText: "",
  productText: "",
  salesText: "",
  groupsText: "",
  scriptsText: ""
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
  ["design", "Design"],
  ["product", "Produto"],
  ["salesPage", "Copy"],
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

function fallbackText(module, state) {
  const productName = state.nomeProduto || `Método ${state.nicho || "Digital"} Express`;
  const promise = state.promessa || `Transformar ${state.dor || "uma dor clara"} numa oferta digital vendável.`;

  const texts = {
    ebook: `📖 ${state.titulo || productName}\n\nPúblico: ${state.publico || state.dor}\nPromessa: ${promise}\n\nÍndice sugerido:\n1. Diagnóstico do problema\n2. Erros comuns\n3. Método passo a passo\n4. Plano de ação\n5. Oferta final`,
    design: `🎨 Prompts de design para ${productName}\n\nPaleta: verde tecnológico, fundo escuro e acento azul.\nFormato: capa vertical 9:16, versão horizontal 16:9 e slides Gamma.\nCanva: layout limpo, blocos curtos, capa forte e CTA final.`,
    product: `🏷️ ${productName}\n\nPromessa: ${promise}\nPreço estimado: ${money(state.precoEstimado)}\nBônus: checklist, roteiro de ação e modelo de página.\nGarantia: ${state.garantia}.`,
    salesPage: `🎯 Headline: ${promise}\n\nBenefícios: clareza, velocidade, oferta pronta e checkout publicado.\nCTA: Quero criar minha estrutura agora.\nFAQ: para quem é, como recebo, garantia e próximos passos.`,
    facebookGroups: `Grupos e comunidades para ${state.nicho}\n\nProcura grupos ativos, com moderação clara, publicações recentes e público alinhado à dor.\nDica: entrar entregando valor antes de oferecer.`,
    scripts: `Dia 1: Conteúdo de valor sobre a dor.\nDia 2: Mini diagnóstico e prova.\nDia 3: Oferta do ${productName} com urgência.\nResposta padrão: envio o link e explico como funciona.`
  };

  return texts[module];
}

export default function Home() {
  const [page, setPage] = useState("ferramentas");
  const [tab, setTab] = useState("ebook");
  const [state, setState] = useState(initialState);
  const [format, setFormat] = useState("916");
  const [copyType, setCopyType] = useState("VSL · Carta de Vendas");
  const [sequenceType, setSequenceType] = useState("Funil 3 dias");
  const [priceRange, setPriceRange] = useState("R$27-R$47 (entrada)");
  const [loading, setLoading] = useState("");
  const [notice, setNotice] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [kiwifyModal, setKiwifyModal] = useState(false);
  const [kiwifyError, setKiwifyError] = useState("");

  const synced = Boolean(state.titulo || state.nomeProduto);
  const contextSummary = useMemo(() => {
    if (!state.nicho) return "🧠 Aguardando dados do E-book para sincronizar as outras tabs...";
    if (!synced) return `🧠 Nicho "${state.nicho}" definido. Gera o E-book para sincronizar Design, Produto, Copy e Grupos.`;
    return "✓ Sistema sincronizado — todas as tabs alimentadas com dados do E-book.";
  }, [state.nicho, synced]);

  const kiwifyPayload = useMemo(() => ({
    name: state.nomeProduto || state.titulo || "Produto Genesis",
    description: state.descricao || state.promessa || state.dor,
    price: Number(state.precoFinal || state.precoEstimado || 47),
    type: "ebook",
    currency: "BRL"
  }), [state]);

  function setField(field, value) {
    setState((current) => ({ ...current, [field]: value }));
  }

  function resetAll() {
    setState(initialState);
    setTab("ebook");
    setPage("ferramentas");
    setCheckout(null);
    setKiwifyError("");
    setNotice("");
    setKiwifyModal(false);
  }

  async function generate(module, extraOptions = {}) {
    setLoading(module);
    setNotice("");
    setKiwifyError("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          context: state,
          options: {
            format,
            copyType,
            sequenceType,
            priceRange,
            ...extraOptions
          }
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "A IA não conseguiu gerar este módulo.");
      }

      const data = result.data || {};
      setState((current) => ({
        ...current,
        ...data,
        precoEstimado: Number(data.precoEstimado || current.precoEstimado || priceRanges[priceRange]),
        precoFinal: Number(data.precoFinal || data.precoEstimado || current.precoFinal || priceRanges[priceRange]),
        [`${module}Text`]: result.text || fallbackText(module, { ...current, ...data })
      }));

      if (module === "ebook") setTab("design");
      if (module === "product") setTab("product");
      setNotice("Conteúdo gerado e sincronizado com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado.";
      setNotice(message);
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
    setCheckout(null);

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

      setCheckout(result);
      setKiwifyModal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido na Kiwify.";
      setKiwifyError(`${message} Verifica token, credenciais, permissões da conta e endpoint da Kiwify.`);
    } finally {
      setLoading("");
    }
  }

  function renderResult(title, text) {
    if (!text) return null;
    return (
      <div className="resultBox">
        <div className="resultHeader">
          <strong>{title}</strong>
          <button type="button" onClick={() => navigator.clipboard.writeText(text)}>Copiar</button>
        </div>
        <pre>{text}</pre>
      </div>
    );
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
        <div className={cx("brainBar", synced && "synced", state.nicho && !synced && "thinking")}>
          <span>{contextSummary}</span>
          <div className="brainChips">
            {syncChips.map(([id, label]) => (
              <span key={id} className={cx(synced && "active")}>{label}</span>
            ))}
          </div>
        </div>

        {page === "ferramentas" && (
          <>
            <header className="topbar">
              <div>
                <h1>Ferramentas</h1>
                <p>Selecciona o nicho no E-book e o sistema sincroniza tudo automaticamente</p>
              </div>
              <span className="status">● IA Activa</span>
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
                    <h2>Criar E-book</h2>
                    <p>Selecciona o nicho aqui — todas as outras tabs sincronizam automaticamente</p>
                  </div>

                  <div className="sectionLabel">Nicho <small>(define o contexto de todo o sistema)</small></div>
                  <div className="nicheGrid">
                    {niches.map((item) => (
                      <button key={item} className={state.nicho === item ? "selected" : ""} onClick={() => setField("nicho", item)}>{item}</button>
                    ))}
                  </div>

                  <label>Dor / Problema do público-alvo</label>
                  <textarea value={state.dor} onChange={(event) => setField("dor", event.target.value)} placeholder="Ex: Mães que querem emagrecer no pós-parto mas não têm tempo para academia..." />

                  <button className="actionButton" disabled={!state.nicho || !state.dor || loading === "ebook"} onClick={() => generate("ebook")}>
                    {loading === "ebook" ? "A gerar com IA..." : "↯ Gerar E-book + Sincronizar Sistema com IA"}
                  </button>

                  {renderResult("E-book estruturado", state.ebookText)}
                </section>
              )}

              {tab === "design" && (
                <section className="tool">
                  <ContextBanner state={state} synced={synced} />
                  <div className="toolHero">
                    <div className="toolIcon">◎</div>
                    <h2>Prompts de Design</h2>
                    <p>Gera prompts prontos para Gamma, Canva e Midjourney</p>
                  </div>

                  <div className="sectionLabel">Formato do documento</div>
                  <div className="formatGrid">
                    <button className={format === "916" ? "selected" : ""} onClick={() => setFormat("916")}><b>📱</b><strong>Vertical</strong><span>9×16 · Mobile</span></button>
                    <button className={format === "169" ? "selected" : ""} onClick={() => setFormat("169")}><b>🖥️</b><strong>Horizontal</strong><span>16×9 · Desktop</span></button>
                    <button className={format === "auto" ? "selected" : ""} onClick={() => setFormat("auto")}><b>✨</b><strong>Auto-detectar</strong><span>IA escolhe o ideal</span></button>
                  </div>

                  <label>Tema / Título do E-book</label>
                  <input value={state.titulo} onChange={(event) => setField("titulo", event.target.value)} placeholder="Preenchido automaticamente pelo E-book..." />

                  <button className="actionButton" disabled={!state.nicho || loading === "design"} onClick={() => generate("design")}>
                    {loading === "design" ? "A gerar prompts..." : "↯ Gerar Prompts de Design"}
                  </button>

                  {renderResult("Prompts de design", state.designText)}
                </section>
              )}

              {tab === "product" && (
                <section className="tool">
                  <ContextBanner state={state} synced={synced} />
                  <div className="toolHero">
                    <div className="toolIcon">▣</div>
                    <h2>Produto + Kiwify</h2>
                    <p>Estrutura o produto e publica directamente na Kiwify</p>
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
                    {loading === "product" ? "A gerar produto..." : "↯ Gerar Estrutura do Produto"}
                  </button>

                  {renderResult("Produto estruturado", state.productText)}

                  {(state.nomeProduto || state.productText) && (
                    <div className="kiwifyPanel">
                      <div>
                        <h3>Publicar na Kiwify</h3>
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

                  {checkout && (
                    <div className="success">
                      <strong>Produto criado com sucesso.</strong>
                      <a href={checkout.checkout_url || checkout.link} target="_blank" rel="noreferrer">{checkout.checkout_url || checkout.link}</a>
                      <small>ID: {checkout.product_id || "sem id retornado"}</small>
                    </div>
                  )}

                  {kiwifyError && <div className="error"><strong>Falha na Kiwify</strong><span>{kiwifyError}</span></div>}
                </section>
              )}

              {tab === "salesPage" && (
                <section className="tool">
                  <ContextBanner state={state} synced={synced} />
                  <div className="toolHero">
                    <div className="toolIcon">◻</div>
                    <h2>Página de Vendas</h2>
                    <p>Copy completa com headline, benefícios, prova social, CTA e FAQ</p>
                  </div>

                  <div className="sectionLabel">Tipo de copy</div>
                  <div className="tagRow">
                    {["VSL · Carta de Vendas", "Landing Page", "Bio Instagram", "E-mail de Vendas"].map((item) => (
                      <button key={item} className={copyType === item ? "selected" : ""} onClick={() => setCopyType(item)}>{item}</button>
                    ))}
                  </div>

                  <div className="twoCols">
                    <div>
                      <label>Nome do produto</label>
                      <input value={state.nomeProduto} onChange={(event) => setField("nomeProduto", event.target.value)} placeholder="Sincronizado automaticamente..." />
                    </div>
                    <div>
                      <label>Preço</label>
                      <input type="number" value={state.precoFinal} onChange={(event) => setField("precoFinal", event.target.value)} placeholder="Ex: R$47" />
                    </div>
                  </div>

                  <label>Promessa principal</label>
                  <textarea value={state.promessa} onChange={(event) => setField("promessa", event.target.value)} placeholder="Sincronizado automaticamente..." />

                  <button className="actionButton" disabled={!state.nicho || loading === "salesPage"} onClick={() => generate("salesPage")}>
                    {loading === "salesPage" ? "A gerar copy..." : "↯ Gerar Copy Completa com IA"}
                  </button>

                  {renderResult("Página de vendas", state.salesPageText || state.salesText)}
                </section>
              )}

              {tab === "groups" && (
                <section className="tool">
                  <ContextBanner state={state} synced={synced} />
                  <div className="toolHero">
                    <div className="toolIcon">♙</div>
                    <h2>Grupos do Facebook</h2>
                    <p>Encontra os grupos maiores no teu nicho + gera scripts prontos</p>
                  </div>

                  <div className="sectionLabel">Passo 1 — Encontrar grupos</div>
                  <button className="actionButton" disabled={!state.nicho || loading === "facebookGroups"} onClick={() => generate("facebookGroups")}>
                    {loading === "facebookGroups" ? "A buscar grupos..." : "⌕ Buscar Grupos no Facebook com IA"}
                  </button>
                  {renderResult("Grupos encontrados", state.facebookGroupsText || state.groupsText)}

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
                    {loading === "scripts" ? "A gerar scripts..." : "↯ Gerar Scripts para os Grupos"}
                  </button>
                  {renderResult("Scripts para grupos", state.scriptsText)}
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

        {page === "dashboard" && <Placeholder title="Dashboard" text="Próxima versão: estruturas criadas, funis publicados, checkouts gerados e receita por canal." />}
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
    return <div className="ctxBanner">🧠 Aguardando selecção de nicho no E-book...</div>;
  }

  return (
    <div className={cx("ctxBanner", synced && "synced")}>
      <strong>{state.nicho}</strong>
      {state.dor && <span>{state.dor}</span>}
      <em>{synced ? "✓ Sincronizado pelo E-book" : "Aguardando geração do E-book"}</em>
    </div>
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
