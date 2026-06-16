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
    ebook: "Cria um e-book vendavel e extrai metadados comerciais para sincronizar produto, copy, grupos e checkout.",
    design: "Gera prompts completos para Gamma, Canva e Midjourney, com paleta, tipografia, capa e estrutura visual.",
    product: "Cria uma estrutura comercial de produto digital pronta para vender, com oferta, bonus, garantia e preco sugerido.",
    salesPage: "Escreve uma pagina de vendas completa com headline, beneficios, prova social, preco, garantia, CTA e FAQ.",
    facebookGroups: "Sugere grupos e comunidades relevantes, com orientacao estrategica para abordagem sem spam.",
    scripts: "Cria uma sequencia de mensagens para grupos e WhatsApp baseada no produto e na promessa."
  };

  return instructions[module];
}

function buildPrompt(input = {}) {
  const { module, context, options } = validateAiRequest(input);

  return [
    `Modulo: ${module}`,
    `Tarefa: ${moduleInstruction(module)}`,
    `Contexto: ${JSON.stringify(context)}`,
    `Opcoes: ${JSON.stringify(options)}`,
    "Formato obrigatorio:",
    JSON.stringify({
      text: "resumo pronto para mostrar/copiar",
      data: {
        titulo: "quando aplicavel",
        publico: "quando aplicavel",
        promessa: "quando aplicavel",
        precoEstimado: 47,
        precoFinal: 47,
        nomeProduto: "quando aplicavel",
        descricao: "quando aplicavel"
      }
    })
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
