const DEFAULT_KIWIFY_BASE = "https://api.kiwify.com.br/v1";

export function getKiwifyConfig(env = process.env) {
  const config = {
    clientId: env.KIWIFY_CLIENT_ID,
    clientSecret: env.KIWIFY_CLIENT_SECRET,
    accountId: env.KIWIFY_ACCOUNT_ID,
    apiBase: env.KIWIFY_API_BASE || DEFAULT_KIWIFY_BASE
  };

  const missing = Object.entries(config)
    .filter(([key, value]) => key !== "apiBase" && !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Configuracao Kiwify incompleta: ${missing.join(", ")}`);
  }

  return config;
}

export function priceToCents(price) {
  const numeric = Number(price);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("O preco deve ser um numero positivo.");
  }
  return Math.round(numeric * 100);
}

export function buildKiwifyProductPayload(input, config) {
  const name = String(input?.name || "").trim();
  const description = String(input?.description || "").trim();
  const type = String(input?.type || "ebook").trim();
  const currency = String(input?.currency || "BRL").trim();

  if (!name) {
    throw new Error("O nome do produto e obrigatorio.");
  }

  return {
    name,
    description,
    price: priceToCents(input?.price),
    type,
    currency,
    account_id: config.accountId
  };
}

async function readResponse(response) {
  const contentType = response.headers?.get?.("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function createKiwifyProduct(input, options = {}) {
  const fetcher = options.fetcher || fetch;
  const config = options.config || getKiwifyConfig(options.env);
  const productPayload = buildKiwifyProductPayload(input, config);

  const tokenResponse = await fetcher(`${config.apiBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "client_credentials"
    })
  });

  const tokenData = await readResponse(tokenResponse);
  if (!tokenResponse.ok || !tokenData?.access_token) {
    throw new Error(tokenData?.message || `Kiwify token falhou com status ${tokenResponse.status}`);
  }

  const productResponse = await fetcher(`${config.apiBase}/accounts/${config.accountId}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenData.access_token}`
    },
    body: JSON.stringify(productPayload)
  });

  const productData = await readResponse(productResponse);
  if (!productResponse.ok) {
    throw new Error(productData?.message || `Kiwify produto falhou com status ${productResponse.status}`);
  }

  return {
    product_id: productData.id || productData.product_id || null,
    checkout_url: productData.checkout_url || productData.link || null,
    link: productData.link || productData.checkout_url || null
  };
}
