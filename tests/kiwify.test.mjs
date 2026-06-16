import assert from "node:assert/strict";
import test from "node:test";
import { buildKiwifyProductPayload, createKiwifyProduct, priceToCents } from "../lib/kiwify.js";

const config = {
  clientId: "client-id-test",
  clientSecret: "secret-test",
  accountId: "account-test",
  apiBase: "https://kiwify.test/v1"
};

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { "content-type": "application/json" }
  });
}

test("converte preco em centavos", () => {
  assert.equal(priceToCents(47), 4700);
  assert.equal(priceToCents("31.42"), 3142);
});

test("cria produto usando OAuth client_credentials e payload em centavos", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    if (url.endsWith("/oauth/token")) {
      return jsonResponse({ access_token: "token-test" });
    }
    return jsonResponse({ id: "prod_123", checkout_url: "https://pay.kiwify.test/prod_123" });
  };

  const result = await createKiwifyProduct(
    {
      name: "Metodo Teste",
      description: "Produto gerado pelo Genesis",
      price: 47,
      type: "ebook",
      currency: "BRL"
    },
    { config, fetcher }
  );

  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://kiwify.test/v1/oauth/token");
  assert.equal(calls[0].body.grant_type, "client_credentials");
  assert.equal(calls[0].body.client_id, "client-id-test");
  assert.equal(calls[0].body.client_secret, "secret-test");
  assert.equal(calls[1].url, "https://kiwify.test/v1/accounts/account-test/products");
  assert.equal(calls[1].options.headers.Authorization, "Bearer token-test");
  assert.equal(calls[1].body.price, 4700);
  assert.equal(calls[1].body.account_id, "account-test");
  assert.deepEqual(result, {
    product_id: "prod_123",
    checkout_url: "https://pay.kiwify.test/prod_123",
    link: "https://pay.kiwify.test/prod_123"
  });
});

test("payload Kiwify usa o valor final editado pelo usuario", () => {
  const payload = buildKiwifyProductPayload(
    {
      name: "Metodo Teste",
      description: "Descricao",
      price: 97,
      type: "ebook",
      currency: "BRL"
    },
    config
  );

  assert.equal(payload.price, 9700);
  assert.equal(payload.name, "Metodo Teste");
  assert.equal(payload.account_id, "account-test");
});

test("retorna erro claro quando a Kiwify falha", async () => {
  const fetcher = async () => jsonResponse({ message: "credenciais invalidas" }, { status: 401 });

  await assert.rejects(
    () => createKiwifyProduct({ name: "Produto", price: 47 }, { config, fetcher }),
    /credenciais invalidas/
  );
});
