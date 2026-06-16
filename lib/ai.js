const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const MODULES = new Set(["ebook", "design", "product", "salesPage", "facebookGroups", "scripts"]);
const PROVIDERS = new Set(["gemini", "openai", "anthropic"]);

const SYSTEM_INSTRUCTION = [
  "Responde sempre em Portugues de Portugal, com clareza comercial e foco em infoprodutos.",
  "Devolve APENAS JSON valido com as chaves text e data.",
  "Nao incluas markdown, comentarios, texto antes ou depois do JSON."
].join(" ");

export function validateAiRequest(input = {}) {
  const module = String(input.module || "").trim();
  if (!MODULES.has(module)) {
    throw new Error("Modulo de IA invalido.");
  }

  const context = input.context || {};
  if (module === "ebook" && (!context.nicho || !context.dor)) {
    throw new Error("Nicho e dor sao obrigatorios para gerar o E-book.");
  }

  if (module !== "ebook" && !context.nicho) {
    throw new Error("Gera primeiro o E-book para sincronizar o nicho.");
  }

  return {
    module,
    context,
    options: input.options || {}
  };
}

function schemaFor(module) {
  const common = {
    type: "object",
    additionalProperties: true,
    properties: {
      text: { type: "string" },
      data: { type: "object", additionalProperties: true }
    },
    required: ["text", "data"]
  };

  if (module !== "ebook") return common;

  return {
    ...common,
    properties: {
      text: { type: "string" },
      data: {
        type: "object",
        additionalProperties: true,
        properties: {
          titulo: { type: "string" },
          subtitulo: { type: "string" },
          publico: { type: "string" },
          promessa: { type: "string" },
          precoEstimado: { type: "number" },
          precoFinal: { type: "number" },
          problema: { type: "string" },
          nomeProduto: { type: "string" },
          descricao: { type: "string" },
          bonus: { type: "array", items: { type: "string" } },
          garantia: { type: "string" },
          palavrasChave: { type: "array", items: { type: "string" } }
        },
        required: ["titulo", "publico", "promessa", "precoEstimado", "precoFinal", "problema", "nomeProduto", "descricao"]
      }
    }
  };
}

function moduleInstruction(module) {
  const instructions = {
    ebook: "Cria o e-book final, paginado e pronto para revisao humana, nao apenas um prompt ou indice.",
    design: "Cria um briefing visual utilizavel e prompts separados para Canva, Gamma e imagem de capa.",
    product: "Cria uma oferta pronta para venda, com payload Kiwify seguro e preco final editavel pelo usuario.",
    salesPage: "Cria uma landing page de alta conversao em secoes editaveis, com copy e rascunho HTML.",
    facebookGroups: "Sugere grupos e queries relevantes para validacao manual no Facebook, sem automatizar publicacao.",
    scripts: "Cria scripts organicos de publicacao, comentario e follow-up para distribuicao assistida."
  };

  return instructions[module];
}

function responseShapeFor(module) {
  const shapes = {
    ebook: {
      text: "resumo executivo do e-book",
      data: {
        titulo: "titulo comercial",
        subtitulo: "subtitulo do e-book",
        publico: "publico-alvo",
        promessa: "promessa principal",
        problema: "problema resolvido",
        nomeProduto: "nome comercial",
        descricao: "descricao curta",
        precoEstimado: 47,
        precoFinal: 47,
        ebook: {
          cover: {
            title: "titulo da capa",
            subtitle: "subtitulo da capa",
            audience: "para quem e"
          },
          index: ["capitulo 1", "capitulo 2", "capitulo 3"],
          pages: [
            {
              number: 1,
              title: "titulo da pagina",
              body: "conteudo completo da pagina em 2 a 5 paragrafos",
              takeaway: "acao pratica"
            }
          ],
          cta: "chamada final para o produto/checkout",
          prompt: "prompt usado para gerar o e-book"
        }
      }
    },
    design: {
      text: "resumo do briefing visual",
      data: {
        design: {
          visualBrief: {
            cover: "direcao da capa",
            palette: ["#5ED09E", "#080D15", "#F2F5F7"],
            typography: "sugestao tipografica",
            style: "estilo visual",
            layouts: ["capa", "pagina de conteudo", "CTA final"]
          },
          canvaPrompt: "prompt para Canva",
          gammaPrompt: "prompt para Gamma",
          imagePrompt: "prompt para imagem/capa",
          prompt: "prompt completo do modulo"
        }
      }
    },
    product: {
      text: "resumo da oferta",
      data: {
        nomeProduto: "nome comercial",
        descricao: "descricao curta para checkout",
        promessa: "promessa principal",
        publico: "publico-alvo",
        precoEstimado: 47,
        precoFinal: 47,
        product: {
          offer: {
            name: "nome do produto",
            description: "descricao vendavel",
            promise: "promessa",
            audience: "publico",
            problem: "problema"
          },
          bonuses: ["bonus 1", "bonus 2"],
          guarantee: "garantia",
          price: 47,
          kiwifyPayload: {
            name: "nome",
            description: "descricao",
            price: 47,
            type: "ebook",
            currency: "BRL"
          },
          prompt: "prompt completo do modulo"
        }
      }
    },
    salesPage: {
      text: "resumo da landing page",
      data: {
        salesPage: {
          sections: {
            hero: { headline: "headline", subheadline: "subheadline", cta: "CTA" },
            pain: "dor principal",
            mechanism: "mecanismo unico",
            benefits: ["beneficio 1", "beneficio 2", "beneficio 3"],
            proof: "prova/autoridade",
            bonuses: ["bonus 1", "bonus 2"],
            guarantee: "garantia",
            faq: [{ question: "pergunta", answer: "resposta" }],
            finalCta: "CTA final"
          },
          htmlDraft: "<section>rascunho html simples</section>",
          copyBlocks: ["bloco de copy 1", "bloco de copy 2"],
          prompt: "prompt completo do modulo"
        }
      }
    },
    facebookGroups: {
      text: "resumo da estrategia de grupos",
      data: {
        facebookGroups: {
          groups: [
            {
              name: "tipo/nome plausivel de grupo",
              relevance: "porque faz sentido",
              activity: "criterio de atividade",
              risk: "baixo/medio/alto",
              query: "termo para procurar no Facebook"
            }
          ],
          searchQueries: ["query facebook 1", "query facebook 2"],
          posts: ["post organico 1", "post organico 2"],
          scripts: ["script de abordagem 1", "script de follow-up 1"],
          prompt: "prompt completo do modulo"
        }
      }
    },
    scripts: {
      text: "sequencia organica",
      data: {
        facebookGroups: {
          posts: ["post dia 1", "post dia 2", "post dia 3"],
          scripts: ["comentario de entrada", "resposta por DM", "follow-up"],
          prompt: "prompt completo do modulo"
        }
      }
    }
  };

  return shapes[module];
}

function buildPrompt(input = {}) {
  const { module, context, options } = validateAiRequest(input);

  return [
    `Modulo: ${module}`,
    `Tarefa: ${moduleInstruction(module)}`,
    "O Genesis e uma fabrica semi-automatica de e-books e infoprodutos. O resultado visivel deve ser o artefato final revisavel pelo usuario. Prompts devem ficar separados no campo prompt, nunca como resultado principal.",
    "Nao automatizes publicacao em Facebook. Para grupos, devolve preparacao, criterios e queries de validacao manual.",
    "Nao cries checkout real. Para Kiwify, devolve apenas payload seguro e dados de oferta; a rota backend confirma depois.",
    `Contexto: ${JSON.stringify(context)}`,
    `Opcoes: ${JSON.stringify(options)}`,
    "Formato obrigatorio:",
    JSON.stringify(responseShapeFor(module))
  ].join("\n\n");
}

export function selectAiProvider(env = process.env) {
  const configured = String(env.AI_PROVIDER || "").trim().toLowerCase();
  if (configured) {
    if (!PROVIDERS.has(configured)) {
      throw new Error("AI_PROVIDER invalido. Usa gemini, openai ou anthropic.");
    }
    return configured;
  }

  if (env.GEMINI_API_KEY) return "gemini";
  if (env.OPENAI_API_KEY) return "openai";
  if (env.ANTHROPIC_API_KEY) return "anthropic";

  throw new Error("Nenhuma chave de IA configurada. Define GEMINI_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY no .env.local.");
}

export function buildOpenAiPayload(input = {}, env = process.env) {
  const { module } = validateAiRequest(input);

  return {
    model: env.OPENAI_MODEL || "gpt-5.5-mini",
    input: [SYSTEM_INSTRUCTION, buildPrompt(input)].join("\n\n"),
    text: {
      format: {
        type: "json_schema",
        name: `genesis_${module}`,
        schema: schemaFor(module),
        strict: false
      }
    }
  };
}

export function buildGeminiPayload(input = {}) {
  return {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(input) }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };
}

export function buildAnthropicPayload(input = {}, env = process.env) {
  return {
    model: env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    max_tokens: 4096,
    system: SYSTEM_INSTRUCTION,
    messages: [
      {
        role: "user",
        content: buildPrompt(input)
      }
    ]
  };
}

export function buildAiPayload(input = {}, env = process.env) {
  return buildOpenAiPayload(input, env);
}

function parseJsonText(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (!cleaned) {
    throw new Error("A IA nao devolveu texto utilizavel.");
  }

  return JSON.parse(cleaned);
}

export function parseOpenAIResponse(responseBody = {}) {
  if (typeof responseBody.output_text === "string" && responseBody.output_text.trim()) {
    return parseJsonText(responseBody.output_text);
  }

  const text = responseBody.output
    ?.flatMap((item) => item.content || [])
    ?.filter((content) => content.type === "output_text" || content.type === "text")
    ?.map((content) => content.text)
    ?.join("\n");

  return parseJsonText(text);
}

export function parseGeminiResponse(responseBody = {}) {
  const text = responseBody.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    ?.join("\n");

  return parseJsonText(text);
}

export function parseAnthropicResponse(responseBody = {}) {
  const text = responseBody.content
    ?.filter((part) => part.type === "text")
    ?.map((part) => part.text)
    ?.join("\n");

  return parseJsonText(text);
}

function providerRequest(input, provider, env) {
  if (provider === "gemini") {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY ausente. Configura a chave no .env.local para activar IA real.");
    }

    const model = env.GEMINI_MODEL || "gemini-3.5-flash";
    return {
      url: `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`,
      parser: parseGeminiResponse,
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(buildGeminiPayload(input, env))
      }
    };
  }

  if (provider === "openai") {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY ausente. Configura a chave no .env.local para activar IA real.");
    }

    return {
      url: OPENAI_RESPONSES_URL,
      parser: parseOpenAIResponse,
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(buildOpenAiPayload(input, env))
      }
    };
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ausente. Configura a chave no .env.local para activar Claude.");
  }

  return {
    url: ANTHROPIC_MESSAGES_URL,
    parser: parseAnthropicResponse,
    options: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(buildAnthropicPayload(input, env))
    }
  };
}

function providerError(provider, body, status) {
  const message =
    body?.error?.message ||
    body?.error?.error?.message ||
    body?.message ||
    body?.detail ||
    `${provider} falhou com status ${status}`;

  return `${provider} falhou: ${message}`;
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function generateAiModule(input, options = {}) {
  const env = options.env || process.env;
  const provider = selectAiProvider(env);
  const fetcher = options.fetcher || fetch;
  const request = providerRequest(input, provider, env);

  const response = await fetcher(request.url, request.options);
  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(providerError(provider, body, response.status));
  }

  return request.parser(body);
}
