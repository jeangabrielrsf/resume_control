# Controle de Candidaturas

Este projeto é uma aplicação para gerenciamento de processos seletivos e candidaturas de emprego. Ele consiste em um **front-end** em React e um **back-end** utilizando ElysiaJS e Bun, com suporte a geração de currículos via IA (Nvidia/Minimax-m2.1).

## 📋 Pré-requisitos

Para rodar este projeto, você precisará ter instalado em sua máquina:

*   **Docker** e **Docker Compose** (Recomendado)
*   Ou **Bun** (caso deseje rodar localmente sem Docker)

## 🚀 Como rodar o projeto

### Opção 1: Usando Docker (Recomendado)

Esta é a maneira mais simples de iniciar a aplicação, pois não requer configuração de ambiente de desenvolvimento local.

1.  **Configure as variáveis de ambiente:**
    
    Crie um arquivo `.env` na raiz do projeto (se já não existir) e adicione sua chave da API da Nvidia:

    ```bash
    NVIDIA_API_KEY=sua_chave_aqui
    ```

2.  **Suba os contêineres:**

    Execute o seguinte comando na raiz do projeto:

    ```bash
    docker-compose up --build
    ```

    Isso irá construir as imagens do servidor e do cliente e iniciar os serviços.

3.  **Acesse a aplicação:**

    *   **Frontend:** [http://localhost](http://localhost) (ou http://localhost:80)
    *   **Backend (API):** [http://localhost:3000](http://localhost:3000)

### Opção 2: Rodando Localmente (Desenvolvimento)

Se você preferir rodar os serviços individualmente em sua máquina para desenvolvimento:

#### 1. Backend (Server)

1.  Navegue até a pasta do servidor:
    ```bash
    cd server
    ```
2.  Instale as dependências:
    ```bash
    bun install
    ```
3.  Configure a variável de ambiente (exporte no terminal ou crie um .env na pasta server):
    ```bash
    export NVIDIA_API_KEY=sua_chave_aqui
    ```
4.  Inicie o servidor:
    ```bash
    bun dev
    ```
    O servidor rodará em `http://localhost:3000`.

#### 2. Frontend (Client)

1.  Navegue até a pasta do cliente:
    ```bash
    cd client
    ```
2.  Instale as dependências:
    ```bash
    bun install
    # ou
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    bun dev
    # ou
    npm run dev
    ```
    O frontend estará disponível geralmente em `http://localhost:5173`.
    *Nota: Certifique-se de que o frontend está apontando para o backend corretamente (verifique `VITE_API_URL` se necessário).*

## 🛠️ Tecnologias Utilizadas

*   **Backend:** [Bun](https://bun.sh/), [ElysiaJS](https://elysiajs.com/), Nvidia API (Minimax-m2.1).
*   **Frontend:** [React](https://react.dev/), [Vite](https://vitejs.dev/), [TailwindCSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/).
*   **Infraestrutura:** Docker, Docker Compose, Nginx (no container do client).

## 📁 Estrutura do Projeto

*   `/client` - Código fonte do frontend React.
*   `/server` - Código fonte do backend ElysiaJS.
*   `docker-compose.yml` - Orquestração dos containers.
