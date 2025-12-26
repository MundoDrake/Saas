# 📁 Componente Projeto — Documentação Completa

## 1. Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/ProjectsPage.tsx` | Lista de projetos com grid de cards |
| `src/pages/ProjectDetailPage.tsx` | Página de detalhes com tarefas |
| `src/pages/ProjectFormPage.tsx` | Criar/editar projetos |
| `src/components/ProjectLayout.tsx` | Layout com sidebar para páginas do projeto |
| `src/styles/projects.css` | Estilos dos cards de projeto |
| `supabase/migrations/002_crm.sql` | Schema do banco de dados |

---

## 2. Estrutura do Banco de Dados (Supabase)

```sql
-- Tabela projects
id              UUID PRIMARY KEY
client_id       UUID (FK → clients)
name            TEXT NOT NULL
description     TEXT
status          ENUM: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
start_date      DATE
end_date        DATE
budget          DECIMAL(12,2)
cover_image     TEXT
created_by      UUID (FK → auth.users)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

## 3. Rotas do Sistema (App.tsx)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/projects` | ProjectsPage | Lista de projetos |
| `/projects/new` | ProjectFormPage | Criar projeto |
| `/projects/:id` | ProjectDetailPage | Visão Geral |
| `/projects/:id/edit` | ProjectFormPage | Editar projeto |
| `/projects/:id/strategy` | BrandStrategyPage | Estratégia da marca |
| `/projects/:id/colors` | BrandColorsPage | Paleta de cores |
| `/projects/:id/fonts` | BrandTypographyPage | Tipografia |
| `/projects/:id/voice` | BrandVoicePage | Tom de voz |
| `/projects/:id/assets` | BrandAssetsPage | Assets da marca |
| `/projects/:id/guidelines` | BrandGuidelinesPage | Diretrizes |
| `/projects/:projectId/tasks/new` | TaskFormPage | Nova tarefa |
| `/projects/:projectId/tasks/:taskId/edit` | TaskFormPage | Editar tarefa |

---

## 4. ProjectLayout (Sidebar)

O `ProjectLayout.tsx` fornece uma sidebar com navegação:

### Seção "Projeto"
- ✅ Visão Geral (`/projects/:id`)
- ⚠️ Kanban (`/projects/:id/kanban`) — **rota não implementada**
- ⚠️ Arquivos (`/projects/:id/files`) — **rota não implementada**

### Seção "Marca"
- Estratégia
- Cores
- Tipografia
- Tom de Voz
- Assets
- Diretrizes

### Seção "Configurações"
- Editar projeto

---

## 5. ProjectsPage — Funcionalidades

- **Grid de 2 colunas** com cards de capa
- **Filtros:** Status e Cliente (via searchParams)
- **Busca** por nome
- **Upload de capa** (Supabase Storage)
- **Status badges:**
  - `draft` → badge-neutral (Rascunho)
  - `active` → badge-success (Ativo)
  - `paused` → badge-warning (Pausado)
  - `completed` → badge-primary (Concluído)
  - `cancelled` → badge-error (Cancelado)

---

## 6. ProjectDetailPage — Funcionalidades

- Exibe informações do projeto (cliente, datas, orçamento)
- Lista de **tarefas** com estatísticas
- **Modos de visualização:** Lista ou Kanban
- Atualização inline de status das tarefas
- Prioridades com cores:
  - `low` → Baixa (cinza)
  - `medium` → Média (azul)
  - `high` → Alta (amarelo)
  - `urgent` → Urgente (vermelho)

---

## 7. ProjectFormPage — Funcionalidades

- **Campos:** Nome, Cliente, Descrição, Status, Datas, Orçamento
- Suporte a **Templates** (cria tarefas automaticamente)
- Edição e exclusão de projetos

---

## 8. TypeScript Interface

```typescript
interface Project {
    id: string;
    client_id: string;
    client?: Client;
    name: string;
    description: string | null;
    status: ProjectStatus;
    start_date: string | null;
    end_date: string | null;
    budget: number | null;
    cover_image: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
```

---

## 9. CSS Classes (projects.css)

| Classe | Descrição |
|--------|-----------|
| `.projects-grid` | Grid de 2 colunas para cards |
| `.project-cover-card` | Card com imagem de capa |
| `.project-cover-image` | Imagem de capa |
| `.project-cover-placeholder` | Placeholder quando sem imagem |
| `.project-cover-overlay` | Gradiente sobre a imagem |
| `.project-cover-content` | Conteúdo sobre a capa |
| `.project-cover-edit-btn` | Botão de editar capa |
| `.project-cover-status` | Badge de status |

---

## 10. Observações Importantes

> ⚠️ **Rotas faltando no App.tsx:** `/kanban` e `/files` estão na sidebar mas não têm rotas definidas

> 📌 **RLS:** Projetos usam política permissiva para usuários autenticados

> 🔗 **Relacionamentos:**
> - Projeto pertence a um Cliente (`client_id`)
> - Projeto tem várias Tarefas (`tasks`)
