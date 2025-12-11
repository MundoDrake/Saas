# Guia de Implantação

Este documento fornece instruções detalhadas para implantar o site de portfólio em diferentes ambientes.

## Implantação Atual

O site já está implantado e disponível em:

**[https://pcfpnvlg.manus.space](https://pcfpnvlg.manus.space)**

## Requisitos

- Node.js 18.x ou superior
- pnpm 8.x ou superior (recomendado) ou npm
- Git (opcional, para controle de versão)

## Opções de Implantação

### 1. Vercel (Recomendado)

A Vercel é a plataforma ideal para projetos Next.js, oferecendo implantação contínua e otimizações específicas.

1. Crie uma conta em [vercel.com](https://vercel.com)
2. Instale a CLI da Vercel:
   ```bash
   npm install -g vercel
   ```
3. No diretório do projeto, execute:
   ```bash
   vercel login
   vercel
   ```
4. Siga as instruções na tela para completar a implantação

### 2. Netlify

1. Crie uma conta em [netlify.com](https://netlify.com)
2. No painel do Netlify, clique em "New site from Git"
3. Conecte ao seu repositório Git
4. Configure as seguintes opções:
   - Build command: `pnpm build`
   - Publish directory: `.next`
5. Clique em "Deploy site"

### 3. Servidor Próprio

Para implantar em um servidor próprio:

1. Construa o projeto:
   ```bash
   pnpm build
   ```
2. Instale o pacote `pm2` para gerenciar o processo:
   ```bash
   npm install -g pm2
   ```
3. Inicie o servidor:
   ```bash
   pm2 start npm --name "portfolio" -- start
   ```
4. Configure um proxy reverso (Nginx ou Apache) para encaminhar o tráfego para a porta do Next.js

#### Exemplo de configuração Nginx:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Docker

Para implantar usando Docker:

1. Crie um arquivo `Dockerfile` na raiz do projeto:
   ```dockerfile
   FROM node:18-alpine AS base
   
   FROM base AS deps
   WORKDIR /app
   COPY package.json pnpm-lock.yaml* ./
   RUN npm install -g pnpm && pnpm install
   
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm install -g pnpm && pnpm build
   
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   EXPOSE 3000
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. Construa a imagem Docker:
   ```bash
   docker build -t portfolio-nextjs .
   ```

3. Execute o contêiner:
   ```bash
   docker run -p 3000:3000 portfolio-nextjs
   ```

## Personalização

Para personalizar o site antes da implantação:

1. Edite os textos e informações em `src/app/page.tsx` e nas outras páginas
2. Substitua as imagens em `public/` por suas próprias imagens
3. Ajuste as cores e estilos em `src/app/globals.css` e `tailwind.config.ts`
4. Atualize as informações de contato em `src/app/contato/page.tsx`

## Domínio Personalizado

Para configurar um domínio personalizado:

1. Compre um domínio em um registrador de sua preferência
2. Configure os registros DNS para apontar para o servidor de hospedagem
3. Na plataforma de hospedagem (Vercel, Netlify, etc.), adicione o domínio personalizado nas configurações do projeto

## Suporte

Se encontrar problemas durante a implantação, consulte:

- [Documentação do Next.js](https://nextjs.org/docs/deployment)
- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Netlify](https://docs.netlify.com/)
