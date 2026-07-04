# AGENTS.md — Polo Agenda

## Projeto
Sistema interno de agendamento de sala de reunião para a Polo Negócios Imobiliários.
6-7 usuários internos. Ferramenta operacional, não produto público.

## Stack obrigatória
- Next.js 15.5 com **Pages Router** — NUNCA App Router
- TypeScript estrito
- Prisma 6 + PostgreSQL (porta 5433, Docker, container `agenda-postgres`)
- NextAuth v4 com Google OAuth
- Tailwind CSS + shadcn/ui
- Schedule-X (calendário) com toolbar customizada externa
- Zod para validação de inputs e variáveis de ambiente
- Vitest para testes
- nodemailer para emails

## Estrutura de arquivos
- Páginas: `src/pages/`
- APIs: `src/pages/api/`
- Componentes: `src/components/`
- Lib/utilitários: `src/lib/`
- Estilos: `src/styles/globals.css`
- Schema banco: `prisma/schema.prisma`
- NUNCA criar: `app/`, `route.ts`, `layout.tsx`, Server Actions

## Banco de dados
- PostgreSQL porta 5433 via Docker
- Constraint de exclusão impede reservas sobrepostas (erro PostgreSQL 23P01)
- Soft delete em reservas: status CANCELLED, nunca DELETE físico
- Roles de usuário: USER e ADMIN
- Campo isActive controla se usuário pode fazer login

## Autenticação
- NextAuth v4, provider Google OAuth
- Allowlist de emails via variável ALLOWED_EMAILS no .env
- Verificação de allowlist no callback signIn ANTES de qualquer consulta ao banco
- Sessão retorna id, role e isActive do usuário
- Middleware protege: /agenda, /minhas-reservas, /admin, /api/reservations, /api/admin

## Regras de negócio
- Reservas permitidas apenas entre 06:00 e 20:00
- Validação de horário no frontend E no backend (nunca só um lado)
- Reserva aberta: calendarId 'normal', cor laranja #F97316
- Reserva privada: calendarId 'privacy', cor azul #3B82F6
- Privada mostra nome do responsável mas oculta título e observações para outros usuários
- Conflito de horário retorna HTTP 409 com mensagem em português

## Design e tema
- Dark mode via classe `dark` no `<html>`, persistido em localStorage com chave `polo-agenda-theme`
- Tokens de cor em CSS custom properties em src/styles/globals.css
- NUNCA usar hex hardcoded nos componentes — sempre var(--token)
- Laranja #F97316 é exclusivo da marca, nunca usar como cor de evento
- Logo em public/logo-polo.png
- Fonte Inter do Google Fonts
- Schedule-X toolbar nativa está oculta (display:none), toolbar customizada em src/components/calendar/calendar-toolbar.tsx

## Regras de implementação
- Ler os arquivos relevantes ANTES de editar qualquer coisa
- Localizar padrões existentes no projeto e seguir o mesmo estilo
- Fazer a menor alteração possível para resolver o problema
- NUNCA refatorar código fora do escopo da task
- NUNCA inventar métodos ou propriedades de bibliotecas — verificar o que está instalado em package.json
- NUNCA mover arquivos de lugar sem ser explicitamente pedido
- Endpoints nunca confiam em dados do body para identificar o usuário — sempre usar a sessão
- Validar todos os inputs com Zod antes de qualquer operação no banco

## Comandos obrigatórios após qualquer alteração
1. `npx tsc --noEmit` — deve passar com zero erros
2. `npx vitest run` — todos os testes devem passar
3. `npm run build` — deve passar sem erro

Se qualquer comando falhar: corrigir ANTES de declarar a task concluída.
NUNCA afirmar que terminou sem rodar os três comandos.

## Ambiente
- Windows, PowerShell — NUNCA usar comandos bash (rm -rf, touch, etc)
- PowerShell equivalentes: Remove-Item, New-Item, Get-Content
- Porta padrão do dev: varia (3001, 3002, 3003) — verificar o que está livre
- Variáveis de ambiente em .env na raiz do projeto
- Build corrompido: sintoma é MODULE_NOT_FOUND apontando para .next — solução: Remove-Item -Recurse -Force .next

## O que NÃO fazer
- Não adicionar dependências sem necessidade explícita
- Não criar arquivos de teste sem ser pedido
- Não adicionar comentários óbvios no código
- Não validar visualmente via browser headless — perde tempo e token
- Não rodar npm audit fix — pode quebrar dependências
- Não usar docker compose down -v — apaga os dados do banco
- Não fazer push para o GitHub sem aprovação explícita