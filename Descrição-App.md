# 🎨 Studio Manager — Documentação Completa do App

## Visão Geral

**Studio Manager** é uma aplicação web completa para gestão de estúdios de design e branding, construída com:

| Tecnologia | Uso |
|------------|-----|
| **SolidJS** | Framework reativo frontend |
| **Supabase** | Backend (PostgreSQL, Auth, Storage) |
| **Vite** | Build tool |
| **TypeScript** | Tipagem estática |

---

## 📊 Estrutura do Projeto

```
src/
├── components/     # 15 componentes reutilizáveis
├── contexts/       # 3 contextos (Auth, Profile, Timer)
├── hooks/          # 3 hooks customizados
├── lib/            # Configuração Supabase
├── pages/          # 27 páginas
├── styles/         # Arquivos CSS
└── types/          # Tipos TypeScript
```

---

## 🔐 Sistema de Autenticação

### Páginas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/login` | LoginPage | Login com email/senha |
| `/signup` | SignUpPage | Cadastro de novo usuário |
| `/forgot-password` | ForgotPasswordPage | Recuperação de senha |
| `/reset-password` | ResetPasswordPage | Redefinição de senha |

### Funcionalidades
- ✅ Autenticação via Supabase Auth
- ✅ Persistência de sessão
- ✅ Proteção de rotas (ProtectedRoute)
- ✅ Perfis de usuário (roles: admin, user)

---

## 🏠 Dashboard

**Rota:** `/dashboard`  
**Arquivo:** `DashboardPage.tsx` (675 linhas)

### Estatísticas Exibidas
- Total de Projetos / Projetos Ativos
- Total de Clientes
- Total de Tarefas / Concluídas / Atrasadas
- Projetos por Status (gráfico)
- Tarefas por Status (gráfico)

### Analytics
- Horas trabalhadas no mês
- Receita do mês
- Despesas do mês
- Valores pendentes
- Horas por semana (gráfico de barras)

### Atividade Recente
- Projetos recentes
- Tarefas próximas
- Clientes recentes

---

## 👥 CRM — Clientes

### Rotas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/clients` | ClientsPage | Lista de clientes |
| `/clients/new` | ClientFormPage | Cadastrar cliente |
| `/clients/:id` | ClientDetailPage | Detalhes do cliente |
| `/clients/:id/edit` | ClientFormPage | Editar cliente |

### Funcionalidades
- CRUD completo de clientes
- Contatos múltiplos por cliente
- Documentos anexados
- Histórico de projetos
- Deadlines do cliente

### Campos do Cliente
- Nome, Nome fantasia
- CNPJ/CPF
- Email, Telefone
- Endereço (JSONB)
- Notas

---

## 📁 Projetos

### Rotas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/projects` | ProjectsPage | Grid de projetos com capas |
| `/projects/new` | ProjectFormPage | Criar projeto |
| `/projects/:id` | ProjectDetailPage | Visão geral + Tarefas |
| `/projects/:id/edit` | ProjectFormPage | Editar projeto |

### Status de Projeto
| Status | Label | Badge |
|--------|-------|-------|
| `draft` | Rascunho | neutral |
| `active` | Ativo | success |
| `paused` | Pausado | warning |
| `completed` | Concluído | primary |
| `cancelled` | Cancelado | error |

### Funcionalidades
- Grid visual com imagens de capa
- Upload de capa (Supabase Storage)
- Filtros por status e cliente
- Busca por nome
- Suporte a Templates de projeto

---

## ✅ Tarefas

### Rotas

| Rota | Página |
|------|--------|
| `/projects/:projectId/tasks/new` | TaskFormPage |
| `/projects/:projectId/tasks/:taskId/edit` | TaskFormPage |

### Status de Tarefa
| Status | Label |
|--------|-------|
| `backlog` | Backlog |
| `todo` | A Fazer |
| `in_progress` | Em Progresso |
| `review` | Revisão |
| `done` | Concluído |

### Prioridade
| Prioridade | Cor |
|------------|-----|
| `low` | Cinza |
| `medium` | Azul |
| `high` | Amarelo |
| `urgent` | Vermelho |

### Funcionalidades
- Kanban Board (KanbanBoard.tsx)
- Drag & Drop
- Atribuição de responsável
- Prazo e horas estimadas
- Ordenação customizada

---

## 📋 Templates de Projeto

### Rotas

| Rota | Página |
|------|--------|
| `/templates` | TemplatesPage |
| `/templates/new` | TemplateFormPage |
| `/templates/:id/edit` | TemplateFormPage |

### Funcionalidades
- Criar templates com tarefas pré-definidas
- Ao criar projeto, aplicar template
- Tarefas são criadas automaticamente

---

## ⏱️ Timesheet (Bio-Tracking)

**Rota:** `/timesheet`  
**Arquivo:** `TimesheetPage.tsx` (502 linhas)

### Sistema de Timer Global
- Timer persistente (TimerContext)
- Salvo em localStorage
- Popup flutuante (TimerPopup)
- Pausar/Retomar

### Bio-Tracking (Checkout)
| Campo | Valores |
|-------|---------|
| **Categoria** | Categorias customizáveis |
| **Energia** | 1 (Baixa), 2 (Média), 3 (Alta) |
| **Satisfação** | 😞 Negativo, 😐 Neutro, 😊 Positivo |
| **Observações** | Texto livre |

### Funcionalidades
- Iniciar timer com atividade
- Modal de checkout com bio-tracking
- Lista de entradas por data
- Edição de entradas (modal detalhado)
- Categorias personalizáveis
- Duração calculada automaticamente

---

## 💰 Finanças

### Rotas

| Rota | Página |
|------|--------|
| `/finance` | FinancePage |
| `/finance/new` | FinanceFormPage |
| `/finance/:id/edit` | FinanceFormPage |

### Tipos de Lançamento
- `income` — Receita
- `expense` — Despesa

### Status
| Status | Label | Cor |
|--------|-------|-----|
| `pending` | Pendente | Laranja |
| `paid` | Pago | Verde |
| `cancelled` | Cancelado | Cinza |

### Categorias de Despesa
- Operacional, Pessoal, Software, Marketing, Outros

### Funcionalidades
- Total de receitas/despesas
- Balanço geral
- Filtro por período
- Vínculo com cliente/projeto
- Número de nota fiscal

---

## 🎨 Módulos de Marca (Brand)

Todos acessíveis via `/projects/:id/...`

### Rotas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/strategy` | BrandStrategyPage | Estratégia da marca |
| `/colors` | BrandColorsPage | Paleta de cores |
| `/fonts` | BrandTypographyPage | Tipografia |
| `/voice` | BrandVoicePage | Tom de voz |
| `/assets` | BrandAssetsPage | Assets (logos, ícones) |
| `/guidelines` | BrandGuidelinesPage | Diretrizes da marca |

### BrandStrategyPage (5 abas)
1. Golden Circle (Why, How, What)
2. Posicionamento
3. Personalidade
4. Público-alvo
5. Diferenciais

### BrandColorsPage
- Paleta primária e secundária
- Color picker integrado
- Códigos HEX/RGB

### BrandTypographyPage
- Fontes primárias e secundárias
- Hierarquia tipográfica
- Preview de aplicação

### BrandVoicePage
- Tom de comunicação
- Exemplos de uso
- Do's e Don'ts

### BrandAssetsPage
- Upload de arquivos
- Categorias: Logo, Font, Palette, Icon, Photo, Other
- Supabase Storage

### BrandGuidelinesPage
- Documento consolidado
- Regras de uso

---

## 📈 Analytics & Relatórios

### Rotas

| Rota | Página |
|------|--------|
| `/analytics` | AnalyticsPage |
| `/reports/timesheet` | ReportsTimesheetPage |
| `/reports/finance` | ReportsFinancePage |

### Componentes de Gráficos
- `BarChart.tsx` — Gráfico de barras
- `DonutChart.tsx` — Gráfico de rosca
- `RadarChart.tsx` — Gráfico radar
- `EfficiencyHeatmap.tsx` — Mapa de calor

### Funcionalidades
- Filtro por período
- Exportação de dados
- Visualizações customizadas

---

## 👤 Perfil

**Rota:** `/profile`  
**Arquivo:** `ProfilePage.tsx`

### Funcionalidades
- Editar nome completo
- Upload de avatar
- Visualizar role (admin/user)

---

## 🔧 Componentes Reutilizáveis

| Componente | Descrição |
|------------|-----------|
| `AppLayout.tsx` | Layout principal com sidebar |
| `ProjectLayout.tsx` | Layout interno de projetos |
| `ProtectedRoute.tsx` | Proteção de rotas |
| `KanbanBoard.tsx` | Board de tarefas |
| `Timer.tsx` | Display do timer |
| `TimerPopup.tsx` | Popup flutuante do timer |
| `TimeEntryDetailModal.tsx` | Modal de edição de entrada |
| `CategoryModal.tsx` | Modal de categorias |
| `CheckoutModal.tsx` | Modal de checkout com bio-tracking |
| `FileUpload.tsx` | Upload de arquivos |
| `BarChart.tsx` | Gráfico de barras SVG |
| `DonutChart.tsx` | Gráfico de rosca SVG |
| `RadarChart.tsx` | Gráfico radar SVG |
| `EfficiencyHeatmap.tsx` | Mapa de calor |
| `Can.tsx` | Controle de permissões |

---

## 🪝 Hooks Customizados

| Hook | Descrição |
|------|-----------|
| `useProfile.ts` | Busca e atualiza perfil do usuário |
| `useStorage.ts` | Upload/download de arquivos |
| `useTimesheet.ts` | Operações de timesheet |

---

## 🌐 Contexts

| Context | Descrição |
|---------|-----------|
| `AuthContext` | Estado de autenticação |
| `ProfileContext` | Dados do perfil |
| `TimerContext` | Estado global do timer |

---

## 🗄️ Banco de Dados (Migrations)

| Migration | Descrição |
|-----------|-----------|
| `001_core.sql` | Profiles, Roles, update_updated_at() |
| `002_crm.sql` | Clients, Projects, Tasks, Deadlines |
| `003_modules.sql` | Time entries, Finances, Documents, Assets |
| `100_brand_strategy.sql` | brand_strategies |
| `101_brand_colors.sql` | brand_colors |
| `102_brand_fonts.sql` | brand_fonts |
| `103_brand_voice.sql` | brand_voice |
| `104_brand_guidelines.sql` | brand_guidelines |
| `105_project_templates.sql` | templates, template_tasks |
| `106_storage_buckets.sql` | Buckets de storage |
| `107_user_data_isolation.sql` | RLS policies para isolamento |

---

## 🔒 Segurança (RLS)

- Row Level Security habilitado em todas as tabelas
- Políticas por usuário autenticado
- Isolamento de dados por `created_by`
- Admin tem acesso completo

---

## ⚠️ Funcionalidades Pendentes

| Feature | Status |
|---------|--------|
| `/projects/:id/kanban` | Rota na sidebar mas não implementada |
| `/projects/:id/files` | Rota na sidebar mas não implementada |

---

## 📱 Responsividade

- Grid adaptativo (2 colunas → 1 coluna em mobile)
- Sidebar colapsável
- Componentes com media queries

---

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

**Porta:** http://localhost:3000
