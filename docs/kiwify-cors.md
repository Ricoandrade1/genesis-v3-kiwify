# Nota tecnica - CORS da Kiwify

O bloqueio de CORS no browser e esperado neste tipo de integracao.

As credenciais e o payload podem estar corretos, mas a Kiwify Partner API deve ser chamada server-side. O frontend nao deve enviar `client_secret`, nem tentar obter OAuth token diretamente no browser.

## Decisao de producao

O Genesis usa uma rota backend:

`POST /api/kiwify/products`

Responsabilidades da rota:

- Receber do frontend apenas os dados do produto.
- Ler `KIWIFY_CLIENT_ID`, `KIWIFY_CLIENT_SECRET`, `KIWIFY_ACCOUNT_ID` e `KIWIFY_API_BASE` do ambiente.
- Pedir `access_token` via OAuth `client_credentials`.
- Criar o produto na Kiwify.
- Devolver ao frontend apenas o estado final e o link de checkout.

## Seguranca

- O secret fica mascarado na UI.
- O secret completo nao deve entrar em Markdown, screenshots, bundle frontend ou logs.
- Como o secret ja foi exposto durante prototipagem, a recomendacao antes de producao e rotacionar a credencial na Kiwify.

