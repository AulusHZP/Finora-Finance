# 💰 Nova Finance

> Uma aplicação de gestão financeira pessoal completa com rastreamento de transações, planejamento de objetivos, importação de dados e análise inteligente de gastos em tempo real.

<table>
  <tr>
    <td><strong>🚀 Live Demo</strong></td>
    <td><a href="https://finorafin.vercel.app" target="_blank">finorafin.vercel.app</a></td>
  </tr>
  <tr>
    <td><strong>📚 Documentação</strong></td>
    <td><a href="#-instalação-e-execução">Guia Completo</a></td>
  </tr>
  <tr>
    <td><strong>🔧 Stack</strong></td>
    <td>React 18 · Node.js · Express · Prisma · PostgreSQL</td>
  </tr>
  <tr>
    <td><strong>📦 Status</strong></td>
    <td>✅ Em Produção</td>
  </tr>
</table>

---

## 🚧 Status do Projeto

[![Vercel](https://img.shields.io/website?label=Frontend&url=https://finorafin.vercel.app&style=for-the-badge)](https://finorafin.vercel.app)
[![Render](https://img.shields.io/website?label=Backend&url=https://finora-finance-h6z4.onrender.com&style=for-the-badge)](https://finora-finance-h6z4.onrender.com)
![React](https://img.shields.io/badge/React-18.3.1-007ec6?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-007ec6?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ec6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-007ec6?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 📚 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Principais Funcionalidades](#-principais-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura](#-arquitetura)
- [Instalação e Execução](#-instalação-e-execução)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Deploy](#-deploy)
- [Demonstração](#-demonstração)
- [Testes](#-testes)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 📝 Sobre o Projeto

**Nova Finance** é uma solução completa de gestão financeira pessoal desenvolvida para ajudar usuários a **controlar gastos, planejar objetivos e entender seus hábitos de consumo** com dados precisos e visualizações intuitivas.

### Por que foi criado?
A falta de ferramentas simples e eficientes em português para gerenciar finanças pessoais motivou a criação desta aplicação. Muitas soluções no mercado são caras, complexas ou oferecem experiência de usuário pobre.

### Que problema resolve?
- ❌ **Desorganização financeira**: Usuários perdem o controle de onde seu dinheiro está indo
- ❌ **Falta de visão clara**: Sem dashboards intuitivos, é difícil identificar padrões de gasto
- ❌ **Planejamento ineficaz**: Sem ferramentas para rastrear objetivos financeiros
- ❌ **Dados em silos**: Extratos bancários espalhados em arquivos desorganizados

✅ **Nova Finance resolve tudo isso** em uma plataforma unificada, com suporte a importação de dados, análise automática e planejamento integrado.

### Contexto
Projeto desenvolvido como uma aplicação full-stack moderna com foco em **experiência do usuário**, **performance** e **segurança dos dados**.

---

## ✨ Principais Funcionalidades

- 🔐 **Autenticação Segura**: Login, Cadastro e gerenciamento de sessão com JWT + BCrypt
- 💳 **Gestão de Transações**: Criar, editar, deletar e visualizar todas as transações com suporte a categorias
- 📊 **Dashboard Inteligente**: Visualização em tempo real com gráficos de gasto semanal/mensal
- 📈 **Análise de Despesas**: Gráficos de distribuição de gastos por categoria
- 🎯 **Planejamento de Objetivos**: Criar e acompanhar objetivos financeiros (viagens, compras, etc.)
- 📤 **Importação de CSV**: Importar transações em lote a partir de extratos bancários
- 💰 **Formatação em BRL**: Suporte completo a moeda brasileira com input em vírgula decimal
- 🏷️ **Custos Fixos**: Marcar transações como custos fixos para análise separada
- 📱 **Responsive Design**: Interface totalmente otimizada para mobile, tablet e desktop
- 🔄 **Sincronização em Tempo Real**: Dados atualizados automaticamente sem refresh manual
- 📊 **Relatórios de Insights**: Análise automática de padrões de gasto

---

## 🛠 Tecnologias Utilizadas

### 🎨 Frontend

| Tecnologia | Versão | Uso |
| :--- | :---: | :--- |
| **React** | 18.3.1 | Framework UI para interface dinâmica |
| **TypeScript** | 5.x | Tipagem estática e melhor DX |
| **Vite** | 5.x | Build tool moderno e rápido |
| **Tailwind CSS** | 3.x | Estilização utilitária e responsiva |
| **Shadcn UI** | Latest | Componentes acessíveis pré-estilizados |
| **Recharts** | Latest | Gráficos e visualizações de dados |
| **TanStack Query** | Latest | Gerenciamento de cache e requisições |
| **React Router** | Latest | Roteamento cliente-side |
| **Zod** | Latest | Validação de schemas |

### 🖥️ Backend

| Tecnologia | Versão | Uso |
| :--- | :---: | :--- |
| **Node.js** | 20.x LTS | Runtime JavaScript |
| **Express** | 4.x | Framework HTTP minimalista |
| **TypeScript** | 5.x | Tipagem estática e segurança |
| **Prisma ORM** | Latest | ORM type-safe para banco de dados |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **JWT (jsonwebtoken)** | Latest | Autenticação stateless |
| **BCrypt** | Latest | Hash seguro de senhas |
| **Helmet** | Latest | Segurança com headers HTTP |
| **CORS** | Latest | Controle de requisições cross-origin |
| **Zod** | Latest | Validação de schemas |

### ☁️ Infraestrutura & DevOps

| Serviço | Uso |
| :--- | :--- |
| **Vercel** | Deploy frontend (CI/CD automático) |
| **Render** | Deploy backend (hospedagem Node.js) |
| **Railway** | Banco de dados PostgreSQL |
| **Docker** | Containerização para desenvolvimento local |

---

## 🏗 Arquitetura

### Visão Geral do Sistema

```
┌─────────────────┐
│   Frontend      │  React 18 + TypeScript
│  (Vercel)       │  - SPA com React Router
└────────┬────────┘  - Componentes reutilizáveis
         │           - Estado com Context API + localStorage
         │ HTTPS
         ├─────────────────────────────────────────────┐
         │                                              │
    ┌────▼──────────────────┐                ┌────────▼──────────┐
    │ API Gateway (CORS)    │                │ Auth Service      │
    │ (Render)              │                │ JWT Validation    │
    └────┬──────────────────┘                └───────────────────┘
         │
    ┌────▼──────────────────────────────────────────────────┐
    │  Backend API (Express + TypeScript)                    │
    │  ├─ Auth Routes (Register, Login, Me)                 │
    │  ├─ Transaction Routes (CRUD, Import, Clear)          │
    │  ├─ Goal Routes (CRUD)                                │
    │  └─ Middleware (JWT, CORS, Error Handling)            │
    └────┬──────────────────────────────────────────────────┘
         │
         │ Prisma Client
         │ Connection Pool
         │
    ┌────▼──────────────────────────────────────────────────┐
    │  PostgreSQL (Railway)                                  │
    │  ├─ users table (id, email, password_hash)            │
    │  ├─ transactions table (id, amount, type, date, etc)  │
    │  └─ goals table (id, title, target, current, etc)     │
    └───────────────────────────────────────────────────────┘
```

### Fluxo de Autenticação

```
User Login
    ↓
POST /auth/login (email, password)
    ↓
Backend validates credentials + generates JWT
    ↓
Client stores token in localStorage
    ↓
All subsequent requests include: Authorization: Bearer {token}
    ↓
Backend validates JWT on protected routes
```

### Estrutura de Pastas

```
nova-finance/
│
├── frontend/                    # Aplicação React (Vercel)
│   ├── src/
│   │   ├── components/         # Componentes React reutilizáveis
│   │   │   ├── ui/             # Componentes Shadcn UI
│   │   │   └── [Feature].tsx   # Componentes de features
│   │   ├── pages/              # Páginas/rotas da aplicação
│   │   ├── services/           # Serviços HTTP (API calls)
│   │   ├── lib/                # Utilitários (formatação, etc)
│   │   ├── config/             # Configurações (API URL, etc)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── App.tsx             # Componente raiz
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Estilos globais
│   ├── .env.local              # Variáveis locais
│   ├── .env.production         # Variáveis produção
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # API Node.js (Render)
│   ├── src/
│   │   ├── controllers/        # Lógica de requisições
│   │   ├── services/           # Lógica de negócio
│   │   ├── routes/             # Definição de endpoints
│   │   ├── middleware/         # Middleware (auth, cors, etc)
│   │   ├── config/             # Configurações
│   │   ├── app.ts              # Setup Express
│   │   └── index.ts            # Entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Schema do banco de dados
│   │   └── migrations/         # Histórico de migrações
│   ├── .env                    # Variáveis desenvolvimento
│   ├── .env.production         # Variáveis produção
│   ├── docker-compose.yml      # Orquestração local
│   ├── Dockerfile              # Imagem Docker
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                    # Este arquivo
```

---

## 🔧 Instalação e Execução

### 📋 Pré-requisitos

Certifique-se de ter instalado em sua máquina:

- **Node.js**: v20.x LTS ou superior (para React + Express)
- **npm** ou **yarn**: Gerenciador de pacotes
- **Docker**: (Opcional, mas recomendado para banco de dados)
- **Git**: Para clonar o repositório

#### Verificar versões instaladas:

```bash
node --version      # v20.x ou superior
npm --version       # 9.x ou superior
docker --version    # 24.x ou superior (opcional)
```

---

### 🔑 Variáveis de Ambiente

#### **Frontend** (`.env.local` e `.env.production`)

Crie um arquivo `.env.local` na pasta `/frontend`:

```env
# Desenvolvimento
VITE_API_URL=http://localhost:4000

# Produção (use o arquivo .env.production)
VITE_API_URL=https://finora-finance-h6z4.onrender.com
```

#### **Backend** (`.env` e `.env.production`)

Crie um arquivo `.env` na pasta `/backend`:

```env
# Configuração geral
NODE_ENV=development
PORT=4000

# Banco de dados (Development com Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/finora_auth?schema=public"

# Banco de dados (Production - Railway)
# DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"

# Autenticação
JWT_SECRET=sua_chave_super_secreta_aqui_min_32_chars

# CORS
CORS_ORIGIN=http://localhost:8080,http://localhost:8081
```

---

### 📦 Instalação de Dependências

1. **Clone o repositório:**

```bash
git clone https://github.com/AulusHZP/nova-finance.git
cd nova-finance
```

2. **Instale dependências do Frontend:**

```bash
cd frontend
npm install
cd ..
```

3. **Instale dependências do Backend:**

```bash
cd backend
npm install
cd ..
```

---

### 💾 Inicializar Banco de Dados

#### **Opção 1: Com Docker (Recomendado)**

```bash
cd backend

# Subir apenas o PostgreSQL
docker-compose up -d db

# Aguarde 5 segundos para o banco inicializar
sleep 5

# Executar migrações
npx prisma migrate dev --name init
```

#### **Opção 2: PostgreSQL Instalado Localmente

```bash
# Criar banco de dados
createdb finora_auth

# Executar migrações
cd backend
npx prisma migrate dev --name init
```

---

### ⚡ Como Rodar a Aplicação

Abra **dois terminais separados** e execute os comandos abaixo:

#### **Terminal 1: Backend** (na pasta `/backend`)

```bash
npm run dev
```

🚀 O backend estará disponível em: **http://localhost:4000**

---

#### **Terminal 2: Frontend** (na pasta `/frontend`)

```bash
npm run dev
```

🎨 O frontend estará disponível em: **http://localhost:5173** (ou a porta configurada pelo Vite)

---

#### **Credenciais Padrão (Desenvolvimento)**

Para testar a aplicação:

```
Email: usuario@teste.com
Senha: Senha123!
```

> 💡 Se não existir usuário, você pode criar um novo no formulário de cadastro.

---

### 🐳 Execução Completa com Docker Compose

Para executar toda a stack localmente (Backend, Frontend e Database):

```bash
cd backend

# Subir todos os serviços
docker-compose up -d

# Verificar se estão rodando
docker-compose ps

# Ver logs do backend
docker-compose logs app -f

# Parar todos os serviços
docker-compose down
```

---

## 🚀 Deploy

### 📤 Deploy do Frontend (Vercel)

1. **Build para produção:**

```bash
cd frontend
npm run build
```

2. **Conectar ao Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Selecione seu repositório GitHub
   - Configure as variáveis de ambiente:
     ```
     VITE_API_URL=https://finora-finance-h6z4.onrender.com
     ```
   - Clique em "Deploy"

3. **Deploy automático:**
   - Qualquer push para `main` fará deploy automático

### 📤 Deploy do Backend (Render)

1. **Build para produção:**

```bash
cd backend
npm run build
```

2. **Conectar ao Render:**
   - Acesse [render.com](https://render.com)
   - Clique em "New" → "Web Service"
   - Selecione seu repositório GitHub
   - Configure:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run start`
     - **Root Directory**: `backend`

3. **Variáveis de Ambiente no Render:**
   ```
   DATABASE_URL=postgresql://[railway_url]
   JWT_SECRET=sua_chave_super_secreta
   NODE_ENV=production
   CORS_ORIGIN=https://seu-frontend.vercel.app
   ```

4. **Banco de Dados (Railway):**
   - Crie uma conta em [railway.app](https://railway.app)
   - Crie um projeto PostgreSQL
   - Copie a `DATABASE_URL` para o Render

---

## 📊 Demonstração

### 📱 Tela Mobile

| Dashboard | Transações | Objetivos |
| :---: | :---: | :---: |
| ![Dashboard](https://via.placeholder.com/300x600) | ![Transações](https://via.placeholder.com/300x600) | ![Objetivos](https://via.placeholder.com/300x600) |

### 💻 Tela Desktop

| Dashboard | Transações Detalhadas | Importar CSV |
| :---: | :---: | :---: |
| ![Dashboard Desktop](https://via.placeholder.com/400x300) | ![Transações](https://via.placeholder.com/400x300) | ![CSV](https://via.placeholder.com/400x300) |

---

## ✅ Testes

### **Frontend**

```bash
cd frontend

# Rodar testes
npm run test

# Rodar testes com coverage
npm run test:coverage

# Verificar linting
npm run lint
```

### **Backend**

```bash
cd backend

# Rodar testes (quando implementados)
npm run test

# Validar TypeScript
npm run type-check
```

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork o repositório**
2. **Crie uma branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Faça commit** de suas mudanças (`git commit -m 'feat: adiciona MinhaFeature'`)
4. **Push para a branch** (`git push origin feature/MinhaFeature`)
5. **Abra um Pull Request**

### Diretrizes de Contribuição

- Siga o estilo de código do projeto (use `npm run lint`)
- Escreva testes para novas funcionalidades
- Atualize a documentação conforme necessário
- Use commits semânticos (feat:, fix:, docs:, etc)

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

Desenvolvido por **[AulusHZP](https://github.com/AulusHZP)**

---

## 🙏 Agradecimentos

- [Shadcn UI](https://ui.shadcn.com) - Componentes acessíveis
- [Recharts](https://recharts.org) - Biblioteca de gráficos
- [Prisma](https://prisma.io) - ORM type-safe
- [Railway](https://railway.app) - Banco de dados
- [Vercel](https://vercel.com) e [Render](https://render.com) - Hospedagem

---

**Desenvolvido com ❤️ para facilitar sua gestão financeira pessoal.**
