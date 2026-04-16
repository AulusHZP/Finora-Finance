# Nova Finance

Aplicação de gestão financeira pessoal com rastreamento de transações, objetivos e análise de gastos.

## Estrutura do Projeto

```
nova-finance/
├── backend/          # API Node.js + Express + Prisma
├── frontend/         # React + TypeScript + Vite
└── README.md
```

## Início Rápido

### Frontend

```bash
cd frontend
npm install
npm run dev        # Desenvolvimento em http://localhost:8080
npm run build      # Build para produção
npm run lint       # Verificar linting
npm run test       # Rodar testes
```

### Backend

```bash
cd backend
npm install
npm run dev        # Desenvolvimento em http://localhost:4000
npm run build      # Build TypeScript
npm run start      # Rodar build produção
npm run prisma:migrate    # Rodar migrações
npm run prisma:deploy     # Deploy migrações em produção
```

## Tecnologias

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Auth**: JWT + BCrypt
- **Dados**: PostgreSQL com Railway

## Variáveis de Ambiente

### Frontend (.env)

```env
VITE_API_URL=https://finora-finance-h6z4.onrender.com
```

### Backend (.env)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=seu_secret_aqui
PORT=4000
CORS_ORIGIN=http://localhost:8080,http://localhost:8081
```
