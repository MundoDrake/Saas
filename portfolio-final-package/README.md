# Portfólio em Next.js

Este é um site de portfólio profissional desenvolvido com Next.js, inspirado no design do site [sozacriador.com.br](https://www.sozacriador.com.br/).

## URL do Site

O site está implantado permanentemente e disponível em:

**[https://pcfpnvlg.manus.space](https://pcfpnvlg.manus.space)**

## Tecnologias Utilizadas

- **Next.js 15.1.4** - Framework React para renderização do lado do servidor
- **React 19.1.0** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset tipado de JavaScript
- **Framer Motion** - Biblioteca para animações
- **Tailwind CSS** - Framework CSS utilitário
- **ESLint** - Ferramenta de linting para identificar problemas no código

## Estrutura do Projeto

```
portfolio-site/
├── public/             # Arquivos estáticos
├── src/
│   ├── app/            # Páginas da aplicação (App Router)
│   │   ├── contato/    # Página de contato
│   │   ├── metodologia/# Página de metodologia
│   │   ├── projetos/   # Página de projetos e detalhes
│   │   ├── sobre/      # Página sobre
│   │   ├── globals.css # Estilos globais
│   │   ├── layout.tsx  # Layout principal
│   │   └── page.tsx    # Página inicial
│   ├── components/     # Componentes reutilizáveis
│   │   ├── layout/     # Componentes de layout
│   │   └── ui/         # Componentes de interface
│   └── hooks/          # Hooks personalizados
├── next.config.js      # Configuração do Next.js
├── tailwind.config.ts  # Configuração do Tailwind CSS
└── tsconfig.json       # Configuração do TypeScript
```

## Páginas Principais

1. **Home** - Página inicial com seção hero e apresentação dos projetos
2. **Projetos** - Galeria de projetos com filtro por categorias
3. **Metodologia** - Descrição da metodologia de trabalho
4. **Sobre** - Informações sobre o profissional
5. **Contato** - Formulário de contato e informações para contato

## Componentes Principais

- **Header** - Barra de navegação superior
- **Footer** - Rodapé com informações de contato
- **Hero** - Seção principal da página inicial
- **ProjectCard** - Card para exibição de projetos
- **ProjectFilter** - Filtro de projetos por categoria
- **MethodologyStep** - Etapas da metodologia
- **ContactForm** - Formulário de contato com validação
- **AnimatedText** - Texto com animação
- **AnimatedImage** - Imagem com animação

## Funcionalidades

- Design responsivo para todos os dispositivos
- Animações suaves usando Framer Motion
- Filtro de projetos por categoria
- Formulário de contato com validação
- Navegação entre páginas
- Modo escuro/claro (toggle de tema)
- Otimizações de SEO
- Acessibilidade aprimorada

## Como Executar Localmente

1. Clone o repositório
2. Instale as dependências:
   ```bash
   pnpm install
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```
4. Acesse `http://localhost:3000` no navegador

## Build e Deploy

Para criar uma versão de produção:

```bash
pnpm build
```

Para iniciar a versão de produção localmente:

```bash
pnpm start
```

## Melhorias e Correções Implementadas

- Correção de erros de TypeScript e ESLint
- Adição de verificações de nulidade para evitar erros em tempo de execução
- Otimização de imagens e recursos
- Melhoria na acessibilidade
- Testes de compatibilidade entre navegadores

## Créditos

Desenvolvido com base no design do site [sozacriador.com.br](https://www.sozacriador.com.br/).
