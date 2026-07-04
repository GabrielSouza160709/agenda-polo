# Polo Agenda

[<img alt="Next.js" src="https://img.shields.io/badge/Next.js-15.5.15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>](https://nextjs.org/)
[<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>](https://www.typescriptlang.org/)
[<img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>](https://www.postgresql.org/)
[<img alt="Prisma" src="https://img.shields.io/badge/Prisma-6.3.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/>](https://www.prisma.io/)
[<img alt="Railway" src="https://img.shields.io/badge/Railway-Deploy-000000?style=for-the-badge&logo=railway&logoColor=white"/>](https://railway.app/)

Sistema interno de agendamento de sala de reunião desenvolvido para a **Polo Negócios Imobiliários**. Trata-se de uma ferramenta operacional voltada para um grupo restrito de 6 a 7 usuários internos para gerenciar a ocupação e reservas do espaço de reuniões da empresa.

---

## 📸 Descrição Visual das Telas Principais

- **Página de Login (`/`)**: Tela inicial limpa com autenticação via Google OAuth, restrita por lista de e-mails permitidos (Allowlist).
- **Página da Agenda (`/agenda`)**: Interface principal que contém o calendário interativo de reservas do Schedule-X. Apresenta controles de visualização (Dia, Semana, Mês), exibição do status da sala em tempo real (`RoomStatus`), alternância de tema escuro/claro e o botão para criação de novas reservas.
- **Página de Minhas Reservas (`/minhas-reservas`)**: Tabela paginada listando apenas as reservas criadas pelo usuário autenticado, com a opção direta de cancelamento para compromissos futuros.
- **Painel Admin - Usuários (`/admin/usuarios`)**: Tela restrita a administradores para visualização de todos os usuários cadastrados. Permite modificar a permissão (`USER` ou `ADMIN`), ativar/desativar o acesso de um usuário ao sistema (`isActive`) e excluir contas permanentemente (com remoção em cascata e cancelamento de reservas).
- **Painel Admin - Métricas (`/admin/metricas`)**: Painel de análise operacional exclusivo para administradores. Exibe estatísticas consolidadas da ferramenta (total de reservas, reservas no mês, taxa de cancelamento e o usuário mais ativo do mês), gráficos de barras em HTML/CSS puro do fluxo de reservas por dia da semana e horários de pico (das 06h às 20h), além de uma tabela detalhada de reservas por usuário.

---

## 🚀 Funcionalidades do Sistema

- **Agendamento de Reservas**: Agendamento de reuniões definindo data, horário de início e de término.
- **Reservas Privadas**: O usuário pode sinalizar se a reserva precisa de privacidade. Reservas privadas ocultam o título e as observações para outros usuários no calendário e e-mails, exibindo apenas "Sala reservada" e o nome do responsável.
- **Notificações Assíncronas por E-mail (SMTP)**: Integração com Nodemailer para notificar todos os outros usuários ativos por e-mail automaticamente e de forma não-bloqueante (fire-and-forget) quando uma reserva é criada, editada ou cancelada.
- **Controle de Acesso por Allowlist**: Apenas e-mails contidos na lista de permissões no arquivo de ambiente conseguem se cadastrar ou efetuar login.
- **Gestão Administrativa**: Ativação/desativação e exclusão lógica e física de contas pelo painel de administração.
- **Painel de Métricas e Análise de Ocupação**: Gráficos e tabelas consolidadas sobre o uso e os horários de pico da sala de reunião.
- **Suporte a Tema Escuro (Dark Mode)**: Tema escuro totalmente persistido no localStorage do navegador sob a chave `polo-agenda-theme`.

---

## 🛠️ Stack Tecnológica

As dependências principais e ferramentas do projeto extraídas do `package.json`:

- **Next.js**: `15.5.15` (utilizando Pages Router)
- **React**: `19.0.0`
- **TypeScript**: `^5` (modo estrito)
- **Prisma**: `^6.3.0` (Client e CLI)
- **PostgreSQL**: `16-alpine` (Banco de dados relacional)
- **NextAuth**: `^4.24.14` (Provedor Google OAuth)
- **Tailwind CSS**: `^3.4.17`
- **Schedule-X**: `@schedule-x/calendar` `^4.6.0` (visualização de agenda)
- **Nodemailer**: `^6.9.16` (envio de e-mails via SMTP)
- **Zod**: `^3.24.1` (validação e tipagem de entradas e variáveis de ambiente)
- **Vitest**: `^3.1.0` (framework de testes automatizados)
- **Biome**: `^1.9.4` (linter e formatador de código)

---

## 📦 Pré-requisitos

- Node.js 20+ (LTS recomendado)
- Docker e Docker Compose instalados localmente
- Credenciais OAuth obtidas no Google Cloud Console (ID do cliente e Segredo)

---

## ⚙️ Configuração Local Passo a Passo

1. **Clonar o Repositório e Instalar Dependências:**
   ```powershell
   git clone <url-do-repositorio>
   cd ignitecall-app
   npm install
   ```

2. **Configuração de Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto a partir do modelo existente e configure as variáveis obrigatórias:
   ```powershell
   Copy-Item .env.example .env
   ```

3. **Subir Banco de Dados via Docker:**
   O banco de dados PostgreSQL roda no container `agenda-postgres` através do Docker Compose (exposto localmente na porta `5433`):
   ```powershell
   docker compose up -d
   ```

4. **Rodar as Migrações do Banco:**
   Execute as migrações do Prisma para estruturar o banco de dados local:
   ```powershell
   npx prisma migrate dev
   ```

5. **Popolar o Banco de Dados (Seed):**
   Rode o comando de seed para cadastrar o e-mail do administrador inicial configurado em `INITIAL_ADMIN_EMAIL`:
   ```powershell
   npx prisma db seed
   ```

6. **Iniciar o Servidor de Desenvolvimento:**
   ```powershell
   npm run dev
   ```
   A aplicação estará acessível na porta livre indicada no terminal (geralmente `http://localhost:3001`).

---

## 🔒 Variáveis de Ambiente (`.env`)

Tabela das configurações do ambiente validadas pelo Zod em `src/lib/env.ts`:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | String de conexão principal do PostgreSQL. Porta padrão local: `5433`. |
| `DATABASE_DIRECT_URL` | Sim | String de conexão direta do PostgreSQL, usada para migrações do Prisma. |
| `GOOGLE_CLIENT_ID` | Sim | ID do Cliente gerado no Console do Google Cloud para o login. |
| `GOOGLE_CLIENT_SECRET` | Sim | Segredo do Cliente gerado no Console do Google Cloud para o login. |
| `NEXTAUTH_SECRET` | Sim | String secreta usada pelo NextAuth para criptografar tokens. |
| `NEXTAUTH_URL` | Sim | URL completa da aplicação (ex: `http://localhost:3001` ou a URL de produção). |
| `INITIAL_ADMIN_EMAIL` | Sim | E-mail do usuário administrador inicial criado no seed do banco de dados. |
| `ALLOWED_EMAILS` | Sim | Lista de e-mails autorizados a logar na plataforma, separados por vírgula. |
| `SMTP_HOST` | Não | Host do servidor SMTP para envio de notificações por e-mail (ex: `smtp.gmail.com`). |
| `SMTP_PORT` | Não | Porta do servidor SMTP (ex: `587` ou `465`). |
| `SMTP_USER` | Não | Usuário do e-mail do remetente no servidor SMTP. |
| `SMTP_PASS` | Não | Senha de aplicativo (App Password) do servidor de e-mail. |
| `SMTP_FROM` | Não | Formato do remetente das notificações (ex: `"Polo Agenda <email@gmail.com>"`). |
| `NEXT_TELEMETRY_DISABLED` | Não | Define se a telemetria do Next.js está desativada (`1`). |

---

## 📝 Regras de Negócio Reais

- **Janela de Funcionamento**: Reservas só podem ser efetuadas entre **06:00** e **20:00**. Essa regra é validada tanto no front-end quanto no back-end da API.
- **Garantia de Sem Conflito**: Uma restrição de exclusão (`exclusion constraint`) no banco de dados impede sobreposição de horários. Tentativas de agendamento conflitantes geram erro `23P01` no PostgreSQL e a API retorna status `409 Conflict` com uma mensagem amigável em português.
- **Remoção de Reserva**: O cancelamento de reservas pelo usuário comum ou pelo painel de reservas funciona por meio de soft-delete, alterando o status do registro para `CANCELLED`.
- **Hierarquia de Permissões**: 
  - `USER`: Apenas gerencia suas próprias reservas na agenda e na tela de Minhas Reservas.
  - `ADMIN`: Possui acesso completo às telas `/admin/usuarios` e `/admin/metricas`. Pode ativar/desativar outros usuários, mudar permissões, ver painel de estatísticas detalhadas e realizar exclusões permanentes.
- **Login e Segurança**:
  - Antes de qualquer conexão com o banco de dados, o NextAuth valida se o e-mail de login pertence à lista `ALLOWED_EMAILS`. Se não pertencer, o acesso é barrado imediatamente redirecionando para a rota de erro de autenticação `/auth/error?error=AccessDenied`.
  - Contas marcadas com `isActive: false` são bloqueadas e não podem efetuar login ou acessar as páginas internas da aplicação.

---

## 📁 Estrutura de Pastas

Estrutura de arquivos do projeto organizada segundo as regras de desenvolvimento do projeto:

```bash
ignitecall-app/
├── prisma/                    # Configurações do Prisma ORM
│   ├── seed.ts                # Seed do banco (criação do admin inicial)
│   └── schema.prisma          # Definições de tabelas e enums do banco
├── public/                    # Imagens e logotipos estáticos (logo-polo.png)
├── src/
│   ├── components/            # Componentes React reutilizáveis (app-shell, status da sala)
│   │   └── ui/                # Componentes básicos estilizados (botões, switches, toasts, etc)
│   ├── lib/                   # Módulos utilitários (prisma, rate limit, env, mailer de e-mail)
│   ├── styles/                # Estilos globais e configurações de cores (globals.css)
│   └── pages/                 # Páginas da aplicação usando Pages Router (Next.js)
│       ├── agenda/            # Rota principal do calendário (/agenda)
│       ├── admin/             # Páginas restritas do administrador (/admin/usuarios, /admin/metricas)
│       ├── auth/              # Páginas de fluxo e erros de login (/auth/error)
│       ├── minhas-reservas/   # Página de listagem de reservas do usuário (/minhas-reservas)
│       ├── api/               # Controladores e endpoints back-end da API do Next.js
│       ├── _app.page.tsx      # Configuração global de renderização de páginas e contextos
│       └── index.page.tsx     # Página inicial / Tela de login
├── docker-compose.yaml        # Docker Compose para orquestração local do PostgreSQL
├── next.config.ts             # Configurações de compilação, redirecionamentos e headers do Next.js
├── tailwind.config.ts         # Tokens visuais e design system no Tailwind CSS
└── package.json               # Gerenciamento de scripts e dependências do projeto
```

---

## 🚀 Instruções de Deploy na Railway

A aplicação está configurada para deploy simplificado na plataforma **Railway**:

1. **Modo Standalone**: A propriedade `output: 'standalone'` está ativada no `next.config.ts` para criar builds compactos e otimizados para contêineres Docker da Railway.
2. **Script de Inicialização**: O script `start` no `package.json` inicia o Next.js limitando o consumo de heap do Node a `320MB` (`node --max-old-space-size=320 ...`), mantendo o serviço estável e dentro da cota de memória gratuita da plataforma.
3. **Instalação e Geração Automática**: O script `build` executa `prisma generate` antes do build principal para garantir que os esquemas do Prisma Client estejam atualizados na máquina de compilação.
4. **Configuração de Variáveis de Ambiente**:
   - Conecte o banco de dados PostgreSQL do Railway à aplicação usando a variável `DATABASE_URL`.
   - Adicione todas as demais variáveis obrigatórias listadas na seção de Variáveis de Ambiente na dashboard da Railway.
   - Configure a variável `NEXT_TELEMETRY_DISABLED=1` para desativar a telemetria do framework e acelerar as compilações.

---

## 💻 Scripts Disponíveis (`package.json`)

- `npm run dev`: Inicia o servidor Next.js em modo de desenvolvimento local.
- `npm run build`: Roda o Prisma Client Generator e compila a aplicação para produção (`prisma generate && next build`).
- `npm run start`: Inicia o servidor de produção compilado com limite otimizado de uso de memória.
- `npm run lint`: Executa a verificação estática de código com o Biome.
- `npm run format`: Corrige a formatação e estilo do código automaticamente.
- `npm run test`: Executa os testes de unidade da aplicação via Vitest.

---

## 👥 Créditos

Desenvolvido por **Gabriel Souza** para a **Polo Negócios Imobiliários**.