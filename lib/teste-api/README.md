## Módulo: TESTE-API

Este módulo integra o Hub com um serviço externo. Ele é criado via `npm run nova-api TESTE-API` e renderiza:

- `/api/TESTE-API/action.js`: endpoint HTTP
- `/lib/TESTE-API/client.js`: lógica de negócio/autenticação
- `/lib/TESTE-API/README.md`: este manual (gerado a partir deste teste-api)

### Variáveis de Ambiente (Secrets)

| Variável           | Descrição                                   |
|--------------------|----------------------------------------------|
| MY_API_BASE_URL    | URL base da API externa                      |
| MY_API_KEY         | Token/segredo para autenticação (se houver)  |

> Defina-as no Cofre da Vercel (Project Settings → Environment Variables). Nunca versione segredos.

### Payload de Entrada (Input)
Exemplo de corpo aceito pelo endpoint:

```json
{
  "title": "Exemplo",
  "content": "Conteúdo do post",
  "meta": { "tags": ["hub", "vercel"] }
}
```

### Resposta (Output)
Shape sugerido:

```json
{
  "ok": true,
  "data": { "id": "abc123", "url": "https://..." }
}
```

### Notas
- Ajuste validação em `/api/TESTE-API/action.js`.
- Implemente autenticação e rotas reais em `/lib/TESTE-API/client.js`.
- Padronize mensagens de erro para facilitar o consumo pelo ChatGPT.
