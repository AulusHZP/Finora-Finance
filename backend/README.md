# Finora Authentication Backend

Backend de autenticacao do Finora com Node.js, TypeScript, Express, Prisma, PostgreSQL e Docker.

## Recursos

- Cadastro de usuario
- Login com JWT
- Hash de senha com bcrypt
- Rota protegida `/auth/me`
- Validacao de payload com zod
- Middleware de erro centralizado
- Ambiente pronto para Docker Compose

## Estrutura

- `src/controllers`
- `src/routes`
- `src/middlewares`
- `src/services`
- `src/utils`
- `src/config`
- `prisma`

## Variaveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

## Rodando localmente (sem Docker)

1. Instale dependencias:

```bash
npm install
```

2. Gere o client Prisma:

```bash
npm run prisma:generate
```

3. Suba um PostgreSQL local e ajuste `DATABASE_URL` no `.env`.

4. Crie a estrutura no banco:

```bash
npm run prisma:migrate -- --name init
```

5. Inicie em modo dev:

```bash
npm run dev
```

## Rodando com Docker

1. Copie variaveis:

```bash
cp .env.example .env
```

2. Suba os containers:

```bash
docker compose up --build
```

A API ficara em `http://localhost:4000`.

## Endpoints

### Registrar

`POST /auth/register`

```json
{
  "name": "John Doe",
  "email": "john@finora.com",
  "password": "StrongPass123"
}
```

### Login

`POST /auth/login`

```json
{
  "email": "john@finora.com",
  "password": "StrongPass123"
}
```

### Perfil autenticado

`GET /auth/me`

Header:

```txt
Authorization: Bearer <token>
```

## Padrao de resposta

### Sucesso

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@finora.com"
    },
    "token": "jwt-token"
  }
}
```

### Erro

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```
