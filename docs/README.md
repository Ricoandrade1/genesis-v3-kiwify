# Genesis - Documentacao do Projeto

Genesis e uma plataforma para criar infoprodutos vendaveis a partir de um nicho e de uma dor clara do publico.

O produto nao deve ser tratado apenas como gerador de texto. A proposta central e entregar uma estrutura pronta para vender: e-book, design, produto, pagina de vendas, scripts de distribuicao e checkout.

## Fluxo de valor

1. Usuario escolhe nicho e descreve a dor do publico.
2. IA gera a base do e-book e extrai metadados comerciais.
3. Sistema sincroniza produto, promessa, preco, bonus e publico-alvo.
4. Modulos geram prompts de design, copy de vendas e scripts para comunidades.
5. Backend cria produto/checkout na Kiwify.
6. Usuario recebe link de pagamento para divulgar.

## Principios

- Kiwify e prioridade para Brasil por Pix, boleto, afiliados e checkout simples.
- Stripe e evolucao natural para Portugal, Europa e assinaturas SaaS.
- Gemini e o provedor de IA padrao do Genesis v3; OpenAI/ChatGPT e Claude ficam como alternativas por variavel de ambiente.
- Credenciais sensiveis ficam sempre no backend ou em variaveis de ambiente.
- Frontend nunca chama diretamente APIs server-to-server como Kiwify ou provedores de IA.

## Documentos

- [Mapa mental](./mapa-mental.md)
- [Arquitetura](./arquitetura.md)
- [CORS Kiwify](./kiwify-cors.md)
