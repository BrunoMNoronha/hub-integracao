# 🤖 Hub de Automação(V1.3)

Este projeto é um *middleware* de automação (Hub) projetado para correr na Vercel usando Node.js.

## 1. Finalidade

O Hub atua como um "tradutor" seguro e inteligente entre o ChatGPT (ou outros serviços) e APIs de terceiros (WordPress, Google Drive, Slack, etc.).

Ele resolve dois problemas principais:

1.  **🔒 Autenticação (O "Cofre"):** O Hub gere com segurança todos os segredos (API keys, tokens OAuth) usando as Variáveis de Ambiente da Vercel. O código-fonte permanece "limpo", sem quaisquer segredos.
2.  **🔄 Tradução (O "Tradutor"):** O Hub recebe JSON simples do ChatGPT e converte-os em requisições de API complexas que os serviços de terceiros exigem (ex: `multipart/form-data` para uploads de ficheiros, gestão de fluxos OAuth 2.0, etc.).

## 2. Arquitetura (V1.3 Validada)

A arquitetura é modular e desenhada para escalabilidade.

* **Roteamento (Vercel):** Usamos o Roteamento Baseado em Sistema de Ficheiros da Vercel. Qualquer ficheiro em `/api/{nome-servico}/` torna-se um *endpoint* (uma função *serverless*) automaticamente.
* **Modularidade:** Cada serviço é um módulo autónomo com duas componentes:
    * `/api/{nome-servico}/action.js`: O **Controlador**. É "magro" e focado em validação de entrada (HTTP POST, JSON body) e tratamento de erros.
    * `/lib/{nome-servico}/client.js`: A **Lógica de Negócio** (o "cérebro"). Contém a autenticação, a lógica de `fetch` e a tradução de dados.
* **Segurança:** Os segredos são lidos em tempo de execução a partir de `process.env`, que a Vercel popula a partir do seu "Cofre" de Variáveis de Ambiente.
* **Gestão de Erros:** Usamos uma classe personalizada (`/lib/errors.js`) que permite à Lógica de Negócio lançar erros com códigos HTTP específicos (ex: 400, 401, 502), que o Controlador interpreta e retorna corretamente.

## 3. Requisitos

* Node.js (versão 20.x, conforme definido no `package.json`)
* npm (para gestão de pacotes)
* [Vercel CLI](https://vercel.com/docs/cli) (opcional, para *deploy* local e gestão de *secrets*)

## 4. Instalação Local

1.  Clone este repositório.
    ```bash
    git clone https://github.com/BrunoMNoronha/hub-integracao
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie o seu ficheiro de ambiente local. O *script* de *scaffolding* irá preenchê-lo, mas ele precisa de existir:
    ```bash
    # Copia o molde para o ficheiro de segredos (que é ignorado pelo Git)
    cp .env.example .env
    ```

## 5. Como Usar (Criar Novos Módulos)

A criação de novos módulos de API é automatizada através de um *script* de *scaffolding*.

### Como criar uma nova API (ex: "wordpress")

Rode o seguinte comando no seu terminal:

```bash
npm run nova-api wordpress