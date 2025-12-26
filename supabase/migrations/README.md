# Supabase Migrations

## Estrutura

| Arquivo | Descrição | Dependências |
|---------|-----------|--------------|
| `001_core.sql` | Roles, Perfis, Funções utilitárias | - |
| `002_crm.sql` | Clientes, Projetos, Tarefas, Deadlines | 001 |
| `003_modules.sql` | Timesheet, Finanças, Categorias | 001, 002 |
| `100_brand_strategy.sql` | Estratégia de marca | 001, 002 |
| `101_brand_colors.sql` | Cores da marca | 002 |
| `102_brand_fonts.sql` | Tipografia da marca | 002 |
| `103_brand_voice.sql` | Tom de voz | 002 |
| `104_brand_guidelines.sql` | Manual da marca | 002 |
| `105_project_templates.sql` | Templates de projeto | 001, 002 |
| `106_storage_buckets.sql` | Buckets de storage | - |

## Como Executar

1. Acesse **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Execute os arquivos **na ordem numérica**:
   - Primeiro: `001_core.sql`
   - Depois: `002_crm.sql`
   - Em seguida: `003_modules.sql`
   - Por fim: `100-106` (features opcionais)

## Adicionando Novas Migrations

Para adicionar nova funcionalidade:
1. Crie arquivo com numeração sequencial apropriada
2. Use o template padrão com seções: TYPES, TABLES, INDEXES, RLS, TRIGGERS, SEED
3. Declare dependências no cabeçalho

## Alterando Tabelas Existentes

Para modificar tabelas existentes de forma segura:
```sql
-- Use IF NOT EXISTS para colunas
ALTER TABLE tabela ADD COLUMN IF NOT EXISTS nova_coluna TYPE;

-- Use DROP IF EXISTS para remover
DROP POLICY IF EXISTS "nome_policy" ON tabela;
```
