# Wedding Inviter — MVP: Gerenciamento de Convidados

## Contexto do Produto

Wedding Inviter é um app fullstack (FastAPI + Next.js) para Marcos e Amanda gerenciarem
os convites do casamento deles (1º de novembro de 2026, Casa Maciço, Florianópolis – SC).

Os dois noivos têm contas separadas vinculadas à mesma entidade `Wedding`.
A infraestrutura de autenticação e o modelo `Wedding` já estão implementados e em produção.

A feature principal futura é um agente de IA que gera mensagens de convite personalizadas
para cada convidado via WhatsApp. O MVP foca na base de dados necessária para isso funcionar:
o cadastro e gerenciamento da lista de convidados.

## Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand, openapi-fetch
- **Auth:** JWT Bearer + refresh token cookie — padrão já estabelecido no codebase
- **DB:** PostgreSQL via asyncpg

## O que já existe

- `User` model com `wedding_id` FK para `Wedding`
- `Wedding` model (id, created_at, updated_at)
- Auth completo: register, login, logout, refresh, /auth/me
- `GET /wedding/me` retorna wedding + membros
- `POST /wedding/invite` gera token de convite para o parceiro
- Dashboard frontend em `/dashboard` (placeholder, autenticado)
- API client tipado com openapi-fetch + tipos gerados de `types/api.ts`

## Escopo do MVP

### Feature: Lista de Convidados

Cadastrar, visualizar, editar e deletar convidados associados ao casamento.
Cada convidado tem dados contextuais (proximidade, memórias, tom) que serão usados
pelo agente de IA futuramente, e campos de status (convite enviado? resposta recebida?).

### User Stories

**US-01 — Modelo e migration de Guest (backend)**

Como desenvolvedor, preciso de uma tabela `guests` no banco com todos os campos
necessários para o agente de IA gerar mensagens personalizadas.

Campos do modelo `Guest`:

- `id` (UUID, PK)
- `wedding_id` (UUID, FK para `weddings`, NOT NULL)
- `name` (str, NOT NULL)
- `nickname` (str, nullable)
- `relationship_type` (str, nullable) — ex: tio, prima, colega
- `friendship_level` (str, nullable) — ex: amigo próximo, conhecido
- `intimacy` (str, nullable) — alta / média / baixa
- `contact_frequency` (str, nullable) — frequente / esporádico / raro / perdemos contato
- `last_contact_medium` (str, nullable) — WhatsApp / Instagram / pessoalmente / telefone
- `city` (str, nullable)
- `state` (str, nullable)
- `is_distant` (bool, default False)
- `memory` (Text, nullable) — memória marcante
- `shared_element` (Text, nullable) — humor, hobby, história compartilhada
- `ideal_tone` (str, nullable) — descontraído / carinhoso / respeitoso-formal / brincalhão
- `notes` (Text, nullable) — observações extras
- `invite_status` (str, default "pending") — pending / sent
- `response_status` (str, default "pending") — pending / confirmed / absent / uncertain
- `created_at`, `updated_at` (datetime com timezone)

Migration gerada via `make docker-migrate-create MESSAGE="add guests table"`.

**US-02 — API CRUD de Convidados (backend)**

Como usuário autenticado, posso criar, listar, atualizar e deletar convidados
do meu casamento via API.

Endpoints:

- `GET /guests` — lista todos os convidados do `wedding_id` do usuário autenticado
- `POST /guests` — cria convidado vinculado ao `wedding_id` do usuário
- `PATCH /guests/{guest_id}` — atualiza qualquer campo do convidado (body parcial)
- `DELETE /guests/{guest_id}` — deleta o convidado

Restrições:

- Todos os endpoints exigem autenticação (Bearer token)
- Usuário só acessa convidados do seu próprio `wedding_id`
- Tentativa de acessar convidado de outro wedding → 404

Schemas: `GuestCreate`, `GuestRead`, `GuestUpdate` (todos campos opcionais), `GuestList`.

**US-03 — Página de Lista de Convidados (frontend)**

Como usuário, vejo todos os meus convidados num dashboard em `/dashboard/guests`
com informações essenciais e status de cada um.

- Tabela/lista com colunas: Nome, Cidade/Estado, Intimidade, Status Convite, Status Resposta
- Badge colorido por status (ex: "Enviado" verde, "Pendente" amarelo, "Confirmado" verde, "Ausente" vermelho)
- Botão "Adicionar convidado"
- Botão de editar e deletar por linha
- Estado vazio com CTA quando não há convidados
- Link "Convidados" no nav do dashboard
- Tipagem via `types/api.ts` (regenerado após US-02)

**US-04 — Formulário de Adicionar/Editar Convidado (frontend)**

Como usuário, posso adicionar um novo convidado ou editar um existente
através de um formulário completo com todos os campos da ficha.

- Modal ou página dedicada com todos os campos do Guest
- Campos de seleção (selects) para: intimidade, frequência de contato, tom ideal, status convite, status resposta
- Campos de texto livre para: memória, elemento compartilhado, observações
- Validação client-side: `name` obrigatório
- Ao salvar: fecha o modal/navega de volta e atualiza a lista
- Ao editar: formulário pré-preenchido com dados do convidado
- Confirmação antes de deletar

## O que NÃO está no MVP

- Geração de mensagem por IA (próxima feature)
- Importação/exportação de lista
- Filtros e busca na lista
- Ordenação de colunas
- Paginação (aceita-se lista simples por ora)
- Envio real de mensagens WhatsApp

## Restrições Técnicas

- Seguir exatamente o padrão de auth existente: `get_current_user` dependency do FastAPI
- Frontend usa `api-client.ts` com openapi-fetch — não usar fetch direto
- Tipos do frontend gerados de `types/api.ts` via `make generate-types` após API pronta
- Commits em português com conventional commits (feat(backend):, feat(frontend):, etc.)
- Typecheck deve passar: `mypy src` (backend) e `tsc --noEmit` (frontend)
