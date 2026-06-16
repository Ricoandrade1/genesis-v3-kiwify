import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAnthropicPayload,
  buildAiPayload,
  buildGeminiPayload,
  generateAiModule,
  parseAnthropicResponse,
  parseGeminiResponse,
  parseOpenAIResponse,
  selectAiProvider,
  validateAiRequest
} from "../lib/ai.js";

test("valida modulo e contexto minimo", () => {
  assert.throws(() => validateAiRequest({ module: "x", context: {} }), /Modulo de IA invalido/);
  assert.throws(() => validateAiRequest({ module: "ebook", context: { nicho: "Fitness" } }), /Nicho e dor/);

  const request = validateAiRequest({
    module: "ebook",
    context: { nicho: "Fitness", dor: "Falta de tempo" }
  });

  assert.equal(request.module, "ebook");
});

test("seleciona Gemini como provedor padrao quando existe chave", () => {
  assert.equal(selectAiProvider({ GEMINI_API_KEY: "gemini-test" }), "gemini");
  assert.equal(selectAiProvider({ OPENAI_API_KEY: "openai-test" }), "openai");
  assert.equal(selectAiProvider({ ANTHROPIC_API_KEY: "claude-test" }), "anthropic");
  assert.equal(selectAiProvider({ AI_PROVIDER: "anthropic", GEMINI_API_KEY: "gemini-test" }), "anthropic");
  assert.throws(() => selectAiProvider({ AI_PROVIDER: "x" }), /AI_PROVIDER invalido/);
});

test("monta payload Gemini sem expor chave", () => {
  const payload = buildGeminiPayload({
    module: "product",
    context: { nicho: "Marketing Digital", dor: "Nao sabe vender" }
  });

  assert.equal(payload.generationConfig.responseMimeType, "application/json");
  assert.match(payload.contents[0].parts[0].text, /kiwifyPayload/);
  assert.match(payload.contents[0].parts[0].text, /Prompts devem ficar separados/);
  assert.doesNotMatch(JSON.stringify(payload), /GEMINI_API_KEY|gemini-test/);
});

test("mantem payload OpenAI Responses compativel", () => {
  const payload = buildAiPayload(
    {
      module: "product",
      context: { nicho: "Marketing Digital", dor: "Nao sabe vender" }
    },
    { OPENAI_MODEL: "modelo-teste" }
  );

  assert.equal(payload.model, "modelo-teste");
  assert.equal(payload.text.format.type, "json_schema");
  assert.match(payload.input, /kiwifyPayload/);
  assert.doesNotMatch(JSON.stringify(payload), /OPENAI_API_KEY/);
});

test("monta payload Claude sem expor chave", () => {
  const payload = buildAnthropicPayload(
    {
      module: "salesPage",
      context: { nicho: "Educacao", dor: "Nao consegue estudar", produto: "Metodo Teste" }
    },
    { ANTHROPIC_MODEL: "claude-modelo-teste" }
  );

  assert.equal(payload.model, "claude-modelo-teste");
  assert.equal(payload.messages[0].role, "user");
  assert.match(payload.messages[0].content, /landing page/i);
  assert.match(payload.messages[0].content, /htmlDraft/);
  assert.doesNotMatch(JSON.stringify(payload), /ANTHROPIC_API_KEY|claude-test/);
});

test("gera modulo com Gemini fetch mockado", async () => {
  const fetcher = async (url, options) => {
    assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-teste:generateContent");
    assert.equal(options.headers["x-goog-api-key"], "gemini-test");
    assert.doesNotMatch(options.body, /gemini-test/);

    return new Response(JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  text: "resultado",
                  data: { nomeProduto: "Metodo Teste", precoFinal: 97 }
                })
              }
            ]
          }
        }
      ]
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const result = await generateAiModule(
    { module: "product", context: { nicho: "Marketing Digital", dor: "Nao sabe vender" } },
    { env: { GEMINI_API_KEY: "gemini-test", GEMINI_MODEL: "gemini-teste" }, fetcher }
  );

  assert.equal(result.text, "resultado");
  assert.equal(result.data.precoFinal, 97);
});

test("gera modulo com OpenAI fetch mockado quando provider e openai", async () => {
  const fetcher = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, "Bearer key-test");

    return new Response(JSON.stringify({
      output_text: JSON.stringify({
        text: "resultado",
        data: { nomeProduto: "Metodo Teste", precoFinal: 97 }
      })
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const result = await generateAiModule(
    { module: "product", context: { nicho: "Marketing Digital", dor: "Nao sabe vender" } },
    { env: { AI_PROVIDER: "openai", OPENAI_API_KEY: "key-test", OPENAI_MODEL: "modelo-teste" }, fetcher }
  );

  assert.equal(result.text, "resultado");
  assert.equal(result.data.precoFinal, 97);
});

test("parseia respostas textuais dos provedores", () => {
  assert.equal(parseOpenAIResponse({
    output: [{ content: [{ type: "output_text", text: "{\"text\":\"ok\",\"data\":{}}" }] }]
  }).text, "ok");

  assert.equal(parseGeminiResponse({
    candidates: [{ content: { parts: [{ text: "```json\n{\"text\":\"gemini\",\"data\":{}}\n```" }] } }]
  }).text, "gemini");

  assert.equal(parseAnthropicResponse({
    content: [{ type: "text", text: "{\"text\":\"claude\",\"data\":{}}" }]
  }).text, "claude");
});
